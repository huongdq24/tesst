'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { firebaseConfig } from '@/firebase/config';

const billingClient = new CloudBillingClient();

/**
 * Khám phá và lấy trạng thái Credits thực tế mà không cần hardcode ID.
 * @param targetProjectId Project ID mục tiêu (tùy chọn). Nếu không có, sẽ lấy từ cấu hình hệ thống.
 */
export async function getRealtimeCredits(targetProjectId?: string) {
  // Ưu tiên: 1. Tham số truyền vào -> 2. Biến môi trường -> 3. Config Firebase
  const projectId = targetProjectId || process.env.GOOGLE_CLOUD_PROJECT || firebaseConfig.projectId;

  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID could not be determined' };
  }

  try {
    // 1. Lấy thông tin Billing của Project để biết nó thuộc Billing Account nào
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    if (!billingInfo.billingEnabled || !billingInfo.billingAccountName) {
      return {
        success: true,
        credits: '0.00',
        billingEnabled: !!billingInfo.billingEnabled,
        currency: 'USD',
        timestamp: new Date().toISOString()
      };
    }

    let displayCredits = '0.00';
    let currency = 'USD';

    // 2. Truy vấn chi tiết Billing Account để lấy mảng credits
    try {
      const [accountInfo] = await billingClient.getBillingAccount({
        name: billingInfo.billingAccountName,
      });

      const rawAccountData = accountInfo as any;
      
      if (rawAccountData.credits && Array.isArray(rawAccountData.credits)) {
        // Tìm gói tín dụng có số dư còn lại lớn nhất (thường là Free Trial)
        const activeCredit = rawAccountData.credits.reduce((prev: any, current: any) => {
          const prevVal = prev?.remainingAmount ? parseFloat(prev.remainingAmount.value) : 0;
          const currentVal = current?.remainingAmount ? parseFloat(current.remainingAmount.value) : 0;
          return (currentVal > prevVal) ? current : prev;
        }, null);

        if (activeCredit && activeCredit.remainingAmount) {
          const val = parseFloat(activeCredit.remainingAmount.value);
          currency = activeCredit.remainingAmount.currencyCode;

          // Quy đổi VND sang USD (xấp xỉ VND / 25.000) nếu cần hiển thị đồng bộ $
          if (currency === 'VND') {
            displayCredits = (val / 25000).toFixed(2); 
          } else {
            displayCredits = val.toFixed(2);
          }
        }
      }
    } catch (accError: any) {
      console.warn("Account Detail Fetch Warning:", accError.message);
    }

    return {
      success: true,
      credits: displayCredits === 'NaN' ? '0.00' : displayCredits, 
      billingEnabled: billingInfo.billingEnabled,
      currency: currency,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Critical Error:", error.message);
    return { 
      success: false, 
      credits: '0.00', 
      error: error.message 
    };
  }
}

/**
 * Liệt kê tất cả các dự án đang liên kết với các Billing Accounts mà Service Account thấy.
 */
export async function listAllBillingProjects() {
  try {
    const [accounts] = await billingClient.listBillingAccounts();
    if (accounts.length === 0) {
      return { success: false, error: 'No billing accounts found for this Service Account.' };
    }

    let allProjects: any[] = [];
    for (const account of accounts) {
      const [projects] = await billingClient.listProjectBillingInfo({
        name: account.name,
      });
      allProjects = [...allProjects, ...projects.map(p => ({
        projectId: p.name?.split('/').pop(),
        billingEnabled: p.billingEnabled,
        accountName: account.displayName
      }))];
    }

    return {
      success: true,
      projects: allProjects,
    };
  } catch (error: any) {
    console.error("List Projects Error:", error.message);
    return { success: false, error: error.message };
  }
}

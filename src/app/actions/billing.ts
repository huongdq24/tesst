'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { firebaseConfig } from '@/firebase/config';

const billingClient = new CloudBillingClient();

/**
 * Truy xuất số dư Credits thực tế từ Google Cloud Billing API.
 * Thực hiện bóc tách mảng credits từ Billing Account một cách an toàn.
 */
export async function getRealtimeCredits(targetProjectId?: string) {
  const projectId = targetProjectId || firebaseConfig.projectId;

  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID not found' };
  }

  try {
    // 1. Lấy thông tin Billing của Project
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    if (!billingInfo.billingEnabled || !billingInfo.billingAccountName) {
      return {
        success: true,
        credits: '0.00',
        billingEnabled: !!billingInfo.billingEnabled,
        currency: 'USD'
      };
    }

    let displayCredits = '0.00';
    let currency = 'USD';

    // 2. Truy vấn chi tiết Billing Account
    try {
      const [accountInfo] = await billingClient.getBillingAccount({
        name: billingInfo.billingAccountName,
      });

      // Google SDK có thể trả về dữ liệu thô trong thuộc tính internals hoặc trực tiếp
      const rawAccountData = accountInfo as any;
      
      // Kiểm tra mảng credits (thường có trong gói Free Trial hoặc khuyến mãi)
      const creditsArray = rawAccountData.credits || [];
      
      if (creditsArray && Array.isArray(creditsArray) && creditsArray.length > 0) {
        // Tìm gói tín dụng có giá trị lớn nhất (thường là gói active)
        const activeCredit = creditsArray.reduce((prev: any, current: any) => {
          const prevVal = prev?.remainingAmount?.value ? parseFloat(prev.remainingAmount.value) : 0;
          const currentVal = current?.remainingAmount?.value ? parseFloat(current.remainingAmount.value) : 0;
          return (currentVal >= prevVal) ? current : prev;
        }, creditsArray[0]);

        if (activeCredit && activeCredit.remainingAmount) {
          const val = parseFloat(activeCredit.remainingAmount.value);
          currency = activeCredit.remainingAmount.currencyCode || 'USD';

          // Quy đổi VND sang USD (xấp xỉ VND / 25.000)
          if (currency === 'VND') {
            displayCredits = (val / 25000).toFixed(2); 
          } else {
            displayCredits = val.toFixed(2);
          }
        }
      }
    } catch (accError: any) {
      console.warn("Billing Sync Warning: ", accError.message);
    }

    return {
      success: true,
      credits: displayCredits === 'NaN' || !displayCredits ? '0.00' : displayCredits, 
      billingEnabled: billingInfo.billingEnabled,
      currency: currency,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Error:", error.message);
    return { success: false, credits: '0.00', error: error.message };
  }
}

/**
 * Khám phá các dự án liên kết với Billing Account.
 */
export async function listAllBillingProjects() {
  try {
    const [accounts] = await billingClient.listBillingAccounts();
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

    return { success: true, projects: allProjects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

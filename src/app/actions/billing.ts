'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { firebaseConfig } from '@/firebase/config';

const billingClient = new CloudBillingClient();

/**
 * Truy xuất số dư Credits thực tế từ Google Cloud Billing API.
 * Cơ chế DISCOVERY: Tự động quét toàn bộ Billing Accounts và Projects mà Service Account có quyền.
 */
export async function getRealtimeCredits(targetProjectId?: string) {
  try {
    // 1. Lấy danh sách tất cả Billing Accounts mà SA có quyền truy cập
    const [billingAccounts] = await billingClient.listBillingAccounts();
    
    if (!billingAccounts || billingAccounts.length === 0) {
      return { success: true, credits: '0.00', message: 'No billing accounts found' };
    }

    let totalCreditsUSD = 0;
    let foundAnyCredit = false;

    // 2. Duyệt qua từng Billing Account để tìm mảng credits
    for (const account of billingAccounts) {
      if (!account.name) continue;

      try {
        const [accountInfo] = await billingClient.getBillingAccount({
          name: account.name,
        });

        // Bóc tách dữ liệu thô (có thể chứa credits từ gói Free Trial)
        const rawData = accountInfo as any;
        const credits = rawData.credits || [];

        if (Array.isArray(credits) && credits.length > 0) {
          foundAnyCredit = true;
          credits.forEach((c: any) => {
            if (c.remainingAmount) {
              const val = parseFloat(c.remainingAmount.value || '0');
              const currency = c.remainingAmount.currencyCode || 'USD';

              if (currency === 'VND') {
                totalCreditsUSD += (val / 25000);
              } else {
                totalCreditsUSD += val;
              }
            }
          });
        }
      } catch (accErr) {
        console.warn(`Error reading account ${account.name}:`, accErr);
      }
    }

    // 3. Nếu không tìm thấy credits trực tiếp, kiểm tra trạng thái của Project hiện tại
    const currentProjectId = targetProjectId || firebaseConfig.projectId;
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${currentProjectId}`,
    });

    return {
      success: true,
      credits: totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00',
      billingEnabled: billingInfo.billingEnabled,
      foundCredits: foundAnyCredit,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Discovery Error:", error.message);
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
      try {
        const [projects] = await billingClient.listProjectBillingInfo({
          name: account.name,
        });
        allProjects = [...allProjects, ...projects.map(p => ({
          projectId: p.name?.split('/').pop(),
          billingEnabled: p.billingEnabled,
          accountName: account.displayName
        }))];
      } catch (err) {
        console.warn(`Could not list projects for ${account.name}`);
      }
    }

    return { success: true, projects: allProjects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

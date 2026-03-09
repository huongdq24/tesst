'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { firebaseConfig } from '@/firebase/config';

const billingClient = new CloudBillingClient();

/**
 * Truy xuất số dư Credits thực tế từ Google Cloud Billing API.
 * Cơ chế DEEP DISCOVERY: Quét sâu vào toàn bộ Billing Accounts và Project liên kết.
 */
export async function getRealtimeCredits(targetProjectId?: string) {
  try {
    // 1. Lấy danh sách tất cả Billing Accounts mà SA có quyền truy cập
    const [billingAccounts] = await billingClient.listBillingAccounts();
    
    let totalCreditsUSD = 0;
    let foundAnyCredit = false;

    // 2. Nếu không tìm thấy Account qua list, thử lấy từ Project hiện tại
    let accountsToScan = [...billingAccounts];
    if (accountsToScan.length === 0) {
      try {
        const currentProjectId = targetProjectId || firebaseConfig.projectId;
        const [projectBillingInfo] = await billingClient.getProjectBillingInfo({
          name: `projects/${currentProjectId}`,
        });
        if (projectBillingInfo.billingAccountName) {
          const [directAccount] = await billingClient.getBillingAccount({
            name: projectBillingInfo.billingAccountName,
          });
          accountsToScan.push(directAccount);
        }
      } catch (e) {
        console.warn("Could not find billing account via project link.");
      }
    }

    // 3. Duyệt qua từng Billing Account để bóc tách mảng credits (Free Trial)
    for (const account of accountsToScan) {
      if (!account.name) continue;

      try {
        const [accountInfo] = await billingClient.getBillingAccount({
          name: account.name,
        });

        // Bóc tách dữ liệu thô từ mảng credits (Đây là nơi Google lưu $300 Free Trial)
        const rawData = accountInfo as any;
        const credits = rawData.credits || [];

        if (Array.isArray(credits) && credits.length > 0) {
          foundAnyCredit = true;
          credits.forEach((c: any) => {
            const amount = c.remainingAmount || c.amount;
            if (amount) {
              const val = parseFloat(amount.value || '0');
              const currency = amount.currencyCode || 'USD';

              // Quy đổi VND sang USD nếu cần (tỉ giá xấp xỉ 25.000)
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

    return {
      success: true,
      credits: totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00',
      foundCredits: foundAnyCredit,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Discovery Error:", error.message);
    return { success: false, credits: '0.00', error: error.message };
  }
}

/**
 * Khám phá các dự án liên kết với Billing Account để hiển thị trong Admin Panel.
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
          accountName: account.displayName || account.name
        }))];
      } catch (err) {
        console.warn(`Could not list projects for account.`);
      }
    }

    return { success: true, projects: allProjects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

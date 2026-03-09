
'use server';

import { CloudBillingClient } from '@google-cloud/billing';

const billingClient = new CloudBillingClient();

/**
 * Truy xuất số dư Credits thực tế từ Google Cloud Billing API.
 * Hỗ trợ bóc tách mảng credits từ JSON response của cả User Token và Service Account.
 */
export async function getRealtimeCredits(accessToken?: string) {
  try {
    let totalCreditsUSD = 0;
    let foundAnyCredit = false;

    console.log("[Server] Bắt đầu gọi Billing API...");

    // CHẾ ĐỘ 1: DÙNG ACCESS TOKEN (Dành cho người dùng vừa đăng nhập Google)
    if (accessToken) {
      console.log("[Server] Chế độ 1: Sử dụng User Access Token");
      try {
        const response = await fetch('https://cloudbilling.googleapis.com/v1/billingAccounts', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const accounts = data.billingAccounts || [];
          console.log(`[Server] Tìm thấy ${accounts.length} Billing Accounts từ User Token`);
          
          for (const account of accounts) {
            const detailRes = await fetch(`https://cloudbilling.googleapis.com/v1/${account.name}`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              const credits = detail.credits || [];
              if (Array.isArray(credits) && credits.length > 0) {
                foundAnyCredit = true;
                console.log(`[Server] Tìm thấy mảng Credits (${credits.length} items) trong Account: ${account.name}`);
                credits.forEach((c: any) => {
                  const amount = c.remainingAmount || c.amount;
                  if (amount) {
                    const val = parseFloat(String(amount.value || '0').replace(/,/g, ''));
                    const currency = amount.currencyCode || 'VND';
                    totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
                  }
                });
              }
            }
          }
        } else {
          console.log("[Server] Token User không hợp lệ hoặc không có quyền.");
        }
      } catch (err) {
        console.warn("[Server] Lỗi khi dùng Token User:", err);
      }
    }

    // CHẾ ĐỘ 2: DÙNG SERVICE ACCOUNT (Phương án dự phòng/Admin Sync)
    if (!foundAnyCredit) {
      console.log("[Server] Chế độ 2: Sử dụng Service Account");
      const [billingAccounts] = await billingClient.listBillingAccounts();
      console.log(`[Server] SA tìm thấy ${billingAccounts.length} Billing Accounts`);
      
      for (const account of billingAccounts) {
        if (!account.name) continue;
        
        const [accountInfo] = await billingClient.getBillingAccount({ name: account.name });
        const rawData = accountInfo as any;
        const credits = rawData.credits || [];
        
        if (Array.isArray(credits) && credits.length > 0) {
          foundAnyCredit = true;
          console.log(`[Server] SA tìm thấy mảng Credits (${credits.length} items)`);
          credits.forEach((c: any) => {
            const amount = c.remainingAmount || c.amount;
            if (amount) {
              const val = parseFloat(String(amount.value || '0').replace(/,/g, ''));
              const currency = amount.currencyCode || 'VND';
              totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
            }
          });
        }
      }
    }

    // NẾU VẪN KHÔNG THẤY: Discovery cuối cùng từ Project Billing Info
    if (!foundAnyCredit) {
      console.log("[Server] Discovery cuối: Kiểm tra trực tiếp Project Billing Info...");
       try {
         const [projectBillingInfo] = await billingClient.getProjectBillingInfo({
           name: 'projects/project-5306ce34-5626-488a-913'
         });
         const rawProj = projectBillingInfo as any;
         const credits = rawProj.credits || [];
         if (Array.isArray(credits) && credits.length > 0) {
           foundAnyCredit = true;
           credits.forEach((c: any) => {
             const amount = c.remainingAmount || c.amount;
             if (amount) {
               const val = parseFloat(String(amount.value || '0').replace(/,/g, ''));
               const currency = amount.currencyCode || 'VND';
               totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
             }
           });
         }
       } catch (err) { /* silent */ }
    }

    console.log(`[Server] Hoàn tất. Tìm thấy Credits: ${foundAnyCredit}. Tổng USD: ${totalCreditsUSD}`);

    return {
      success: true,
      credits: totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00',
      foundCredits: foundAnyCredit,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("[Server] Billing API Critical Error:", error.message);
    return { success: false, credits: '0.00', error: error.message };
  }
}

export async function listAllBillingProjects() {
  try {
    const [accounts] = await billingClient.listBillingAccounts();
    let allProjects: any[] = [];
    for (const account of accounts) {
      try {
        const [projects] = await billingClient.listProjectBillingInfo({ name: account.name });
        allProjects = [...allProjects, ...projects.map(p => ({
          projectId: p.name?.split('/').pop(),
          billingEnabled: p.billingEnabled,
          accountName: account.displayName || account.name
        }))];
      } catch (err) { /* silent */ }
    }
    return { success: true, projects: allProjects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

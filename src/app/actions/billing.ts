
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

    // CHẾ ĐỘ 1: DÙNG ACCESS TOKEN (Dành cho người dùng vừa đăng nhập Google)
    if (accessToken) {
      try {
        const response = await fetch('https://cloudbilling.googleapis.com/v1/billingAccounts', {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          const accounts = data.billingAccounts || [];
          
          for (const account of accounts) {
            const detailRes = await fetch(`https://cloudbilling.googleapis.com/v1/${account.name}`, {
              headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            if (detailRes.ok) {
              const detail = await detailRes.json();
              // Bóc tách mảng credits từ REST response
              const credits = detail.credits || [];
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
            }
          }
        }
      } catch (err) {
        console.warn("User Token Billing Sync failed, falling back to Service Account.");
      }
    }

    // CHẾ ĐỘ 2: DÙNG SERVICE ACCOUNT (Phương án dự phòng/Admin Sync)
    if (!foundAnyCredit) {
      const [billingAccounts] = await billingClient.listBillingAccounts();
      for (const account of billingAccounts) {
        if (!account.name) continue;
        
        // Lấy thông tin chi tiết tài khoản bao gồm mảng credits qua SDK
        const [accountInfo] = await billingClient.getBillingAccount({ name: account.name });
        
        // SDK trả về object thô, chúng ta ép kiểu để bóc tách credits "ẩn"
        const rawData = accountInfo as any;
        const credits = rawData.credits || [];
        
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
      }
    }

    // NẾU VẪN KHÔNG THẤY: Thử quét Project Billing Info trực tiếp (Discovery cấp cuối)
    if (!foundAnyCredit) {
       try {
         const [projectBillingInfo] = await billingClient.getProjectBillingInfo({
           name: 'projects/project-5306ce34-5626-488a-913'
         });
         const rawProj = projectBillingInfo as any;
         // Đôi khi credits nằm ở đây nếu được gán cho project cụ thể
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
       } catch (err) { /* silent discovery */ }
    }

    return {
      success: true,
      credits: totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00',
      foundCredits: foundAnyCredit,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Critical Error:", error.message);
    return { success: false, credits: '0.00', error: error.message };
  }
}

/**
 * Liệt kê toàn bộ dự án đang liên kết thanh toán để Admin Discovery.
 */
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

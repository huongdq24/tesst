'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế từ Google Cloud Billing API.
 * Thiết kế chống lỗi 500 bằng cách bao bọc SDK trong try/catch và ưu tiên User Token.
 */
export async function getRealtimeCredits(accessToken?: string) {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let errorLog = "";

  console.log("[Server] Bắt đầu tiến trình đồng bộ Billing...");

  // CHẾ ĐỘ 1: DÙNG USER ACCESS TOKEN (Tài khoản cá nhân - Lấy từ OAuth hoặc nhập tay)
  if (accessToken && accessToken.startsWith('ya29.')) { 
    try {
      console.log("[Server] Đang truy vấn bằng User Access Token...");
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
              credits.forEach((c: any) => {
                const amount = c.remainingAmount || c.amount;
                if (amount) {
                  // Xử lý cả trường hợp giá trị là chuỗi có dấu phẩy (VND format)
                  const valStr = String(amount.value || '0').replace(/,/g, '');
                  const val = parseFloat(valStr);
                  const currency = amount.currencyCode || 'VND';
                  totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
                }
              });
            }
          }
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn("[Server] Token User không hợp lệ hoặc hết hạn:", errData);
        errorLog += `OAuth Response Error: ${JSON.stringify(errData)}; `;
      }
    } catch (err: any) {
      console.error("[Server] Lỗi Chế độ 1 (OAuth):", err.message);
      errorLog += `OAuth Error: ${err.message}; `;
    }
  }

  // CHẾ ĐỘ 2: DÙNG SERVICE ACCOUNT (Tài khoản hệ thống - Dùng khi Admin Master Sync)
  if (!foundAnyCredit) {
    try {
      console.log("[Server] Đang thử Chế độ 2 (Service Account)...");
      const billingClient = new CloudBillingClient();
      const [billingAccounts] = await billingClient.listBillingAccounts();
      
      for (const account of billingAccounts) {
        if (!account.name) continue;
        const [accountInfo] = await billingClient.getBillingAccount({ name: account.name });
        const rawData = accountInfo as any;
        const credits = rawData.credits || [];
        
        if (Array.isArray(credits) && credits.length > 0) {
          foundAnyCredit = true;
          credits.forEach((c: any) => {
            const amount = c.remainingAmount || c.amount;
            if (amount) {
              const valStr = String(amount.value || '0').replace(/,/g, '');
              const val = parseFloat(valStr);
              const currency = amount.currencyCode || 'VND';
              totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
            }
          });
        }
      }
    } catch (err: any) {
      console.warn("[Server] Chế độ 2 (Service Account) thất bại:", err.message);
      errorLog += `SDK Error: ${err.message}`;
    }
  }

  console.log(`[Server] Hoàn tất. Tìm thấy Credits: ${foundAnyCredit}. Tổng cộng: $${totalCreditsUSD}`);

  return {
    success: true, // Trả về true để không làm sập UI, chỉ hiển thị số dư 0 nếu không tìm thấy
    credits: totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00',
    foundCredits: foundAnyCredit,
    error: errorLog || undefined,
    timestamp: new Date().toISOString()
  };
}

export async function listAllBillingProjects() {
  try {
    const billingClient = new CloudBillingClient();
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
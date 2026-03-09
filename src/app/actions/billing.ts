'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế.
 * Hệ thống ưu tiên Service Account để đảm bảo tính vĩnh viễn và tự động.
 */
export async function getRealtimeCredits(manualAccessToken?: string) {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let errorLog = "";

  console.log("[Server] Bắt đầu tiến trình đồng bộ Billing...");

  try {
    const billingClient = new CloudBillingClient();

    // 1. LẤY DANH SÁCH TÀI KHOẢN THANH TOÁN
    const requestOptions = manualAccessToken ? {
      headers: { 'Authorization': `Bearer ${manualAccessToken}` }
    } : {};

    const [billingAccounts] = await billingClient.listBillingAccounts(requestOptions as any);
    console.log(`[Server] Tìm thấy ${billingAccounts.length} Billing Accounts`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      // 2. Lấy chi tiết từng tài khoản để bóc tách mảng credits
      const [accountInfo] = await billingClient.getBillingAccount({ name: account.name }, requestOptions as any);
      
      const rawData = accountInfo as any;
      const credits = rawData.credits || [];

      if (Array.isArray(credits) && credits.length > 0) {
        foundAnyCredit = true;
        credits.forEach((c: any) => {
          const amount = c.remainingAmount || c.amount;
          if (amount) {
            // Xử lý chuỗi số: Loại bỏ dấu phẩy và dấu chấm để parse chính xác (Ví dụ: 7,835,100 -> 7835100)
            const rawVal = String(amount.value || '0');
            const cleanVal = rawVal.replace(/,/g, '');
            const val = parseFloat(cleanVal);
            const currency = amount.currencyCode || 'VND';
            
            // Quy đổi sang USD (Tỷ giá xấp xỉ 25.000)
            const converted = (currency === 'VND' ? val / 25000 : val);
            totalCreditsUSD += converted;
            
            console.log(`[Server] Phát hiện Credit: ${rawVal} ${currency} (~$${converted.toFixed(2)})`);
          }
        });
      }
    }

  } catch (err: any) {
    console.error("[Server] Lỗi Billing API:", err.message);
    errorLog = err.message;
  }

  // Kết quả cuối cùng
  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  console.log(`[Server] Hoàn tất. Kết quả: $${finalCredits}`);

  return {
    success: true,
    credits: finalCredits,
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

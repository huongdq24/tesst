'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế ĐỘNG (Dynamic) cho TẤT CẢ các dự án liên kết.
 * Quét toàn bộ Billing Accounts mà Service Account có quyền truy cập.
 */
export async function getRealtimeCredits() {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let summary = [];

  console.log(`[Server - Dynamic Sync] Bắt đầu quét toàn bộ hệ thống Billing...`);

  try {
    const billingClient = new CloudBillingClient();

    // 1. Liệt kê tất cả Billing Accounts mà Service Account có quyền xem
    const [billingAccounts] = await billingClient.listBillingAccounts();
    console.log(`[Server] Tìm thấy ${billingAccounts.length} Billing Account(s).`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      console.log(`[Server] Đang kiểm tra Account: ${account.displayName} (${account.name})`);

      // 2. Truy vấn thông tin chi tiết để tìm mảng credits
      const [accountInfo] = await billingClient.getBillingAccount({ 
        name: account.name 
      });
      
      const rawData = accountInfo as any;
      const credits = rawData.credits || [];

      if (Array.isArray(credits) && credits.length > 0) {
        foundAnyCredit = true;
        credits.forEach((c: any) => {
          const amount = c.remainingAmount || c.amount;
          if (amount) {
            const rawVal = String(amount.value || '0');
            // Xử lý chuỗi số VND/USD (Xóa dấu phẩy, dấu chấm phân cách)
            const cleanVal = rawVal.replace(/,/g, '').replace(/\.(?=.*\.)/g, ''); 
            const val = parseFloat(cleanVal);
            const currency = amount.currencyCode || 'VND';
            
            // Quy đổi sang USD (Tỷ giá xấp xỉ 25.000)
            const converted = (currency === 'VND' ? val / 25000 : val);
            totalCreditsUSD += converted;
            
            console.log(`[Server] PHÁT HIỆN CREDIT: ${rawVal} ${currency} (~$${converted.toFixed(2)})`);
          }
        });
      }

      // 3. Liệt kê các dự án liên kết với Account này (Để hiển thị Dashboard Admin)
      try {
        const [projects] = await billingClient.listProjectBillingInfo({ name: account.name });
        summary.push({
          accountName: account.displayName,
          projects: projects.map(p => ({
            id: p.name?.split('/').pop(),
            enabled: p.billingEnabled
          }))
        });
      } catch (e) {
        console.warn(`[Server] Không thể liệt kê dự án cho account ${account.name}`);
      }
    }

  } catch (err: any) {
    console.error("[Server] Lỗi Billing API (Service Account):", err.message);
    return { success: false, error: err.message };
  }

  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  console.log(`[Server] Tổng Credits bóc tách được: $${finalCredits}`);

  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    summary: summary,
    timestamp: new Date().toISOString()
  };
}

/**
 * Liệt kê trạng thái Billing chi tiết (Dành cho Admin).
 */
export async function listAllBillingProjects() {
  return getRealtimeCredits();
}

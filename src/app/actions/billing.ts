'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế ĐỘNG (Dynamic) cho TẤT CẢ các dự án liên kết.
 * Quét toàn bộ Billing Accounts mà Service Account có quyền truy cập.
 * Tích hợp cơ chế xử lý lỗi mạnh mẽ cho môi trường Firebase Studio.
 */
export async function getRealtimeCredits() {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let summary = [];

  console.log(`[Server - Dynamic Sync] Khởi động tiến trình quét Billing (Service Account)...`);

  try {
    // Khởi tạo client sử dụng Application Default Credentials (Service Account)
    const billingClient = new CloudBillingClient();

    // 1. Liệt kê tất cả Billing Accounts
    const [billingAccounts] = await billingClient.listBillingAccounts();
    console.log(`[Server] Tìm thấy ${billingAccounts.length} Billing Account(s).`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      console.log(`[Server] Đang phân tích Account: ${account.displayName} (${account.name})`);

      // 2. Truy vấn chi tiết mảng credits
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
            // Xử lý chuỗi số dư (Xóa dấu phẩy phân cách định dạng VND/USD)
            const cleanVal = rawVal.replace(/,/g, '').replace(/\.(?=.*\.)/g, ''); 
            const val = parseFloat(cleanVal);
            const currency = amount.currencyCode || 'VND';
            
            // Quy đổi sang USD (Tỷ giá xấp xỉ 25.000)
            const converted = (currency === 'VND' ? val / 25000 : val);
            totalCreditsUSD += converted;
            
            console.log(`[Server] PHÁT HIỆN TÍN DỤNG: ${rawVal} ${currency} (~$${converted.toFixed(2)})`);
          }
        });
      }

      // 3. Liệt kê các dự án liên kết
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
        console.warn(`[Server] Bỏ qua danh sách dự án cho account ${account.name}`);
      }
    }

  } catch (err: any) {
    console.error("[Server] Lỗi Xác thực Google SDK:", err.message);
    
    // Nếu lỗi "Could not refresh access token", trả về một lỗi thân thiện
    if (err.message?.includes('access token')) {
      return { 
        success: false, 
        error: "Hệ thống iGen Cloud đang chờ cấp quyền từ Service Account. Vui lòng triển khai (Publish) app để kích hoạt tự động.",
        credits: '0.00'
      };
    }
    return { success: false, error: err.message, credits: '0.00' };
  }

  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  console.log(`[Server] Tổng Credits hoàn tất bóc tách: $${finalCredits}`);

  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    summary: summary,
    timestamp: new Date().toISOString()
  };
}

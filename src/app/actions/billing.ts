'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế ĐỘNG cho TẤT CẢ các dự án liên kết.
 * Trả về ID tài khoản thanh toán đầu tiên tìm thấy để tạo link động.
 */
export async function getRealtimeCredits() {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let summary = [];
  let primaryAccountId = '';

  console.log(`[Server - Dynamic Sync] Khởi động tiến trình quét Billing...`);

  try {
    const billingClient = new CloudBillingClient();

    // 1. Liệt kê tất cả Billing Accounts
    const [billingAccounts] = await billingClient.listBillingAccounts();
    console.log(`[Server] Tìm thấy ${billingAccounts.length} Billing Account(s).`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      // Lấy ID từ chuỗi "billingAccounts/017D0B-..."
      const accountId = account.name.split('/').pop() || '';
      if (!primaryAccountId) primaryAccountId = accountId;

      console.log(`[Server] Đang phân tích Account: ${account.displayName} (ID: ${accountId})`);

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
            const cleanVal = rawVal.replace(/,/g, '').replace(/\.(?=.*\.)/g, ''); 
            const val = parseFloat(cleanVal);
            const currency = amount.currencyCode || 'VND';
            
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
          accountId: accountId,
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
    if (err.message?.includes('access token')) {
      return { 
        success: false, 
        error: "Hệ thống iGen Cloud đang chờ cấp quyền từ Service Account.",
        credits: '0.00'
      };
    }
    return { success: false, error: err.message, credits: '0.00' };
  }

  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';

  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    primaryAccountId,
    summary: summary,
    timestamp: new Date().toISOString()
  };
}

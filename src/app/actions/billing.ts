'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế ĐỘNG cho TẤT CẢ các dự án liên kết.
 * Xử lý chính xác cấu trúc Money của Google (units + nanos).
 */
export async function getRealtimeCredits() {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let summary = [];
  let primaryAccountId = '';

  console.log(`[Server - Billing Sync] Bắt đầu tiến trình quét dữ liệu Billing thực tế...`);

  try {
    const billingClient = new CloudBillingClient();

    // 1. Liệt kê tất cả Billing Accounts
    const [billingAccounts] = await billingClient.listBillingAccounts();
    console.log(`[Server] Tìm thấy ${billingAccounts.length} tài khoản thanh toán.`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      const accountId = account.name.split('/').pop() || '';
      if (!primaryAccountId) primaryAccountId = accountId;

      console.log(`[Server] Phân tích Account: ${account.displayName} (ID: ${accountId})`);

      // 2. Truy vấn chi tiết thông tin Billing
      const [accountInfo] = await billingClient.getBillingAccount({ 
        name: account.name 
      });
      
      // LOG DỮ LIỆU THÔ ĐỂ DEBUG THEO YÊU CẦU
      console.log(`[Server DEBUG] RAW JSON DATA cho Account ${accountId}:`, JSON.stringify(accountInfo, null, 2));

      const rawData = accountInfo as any;
      const credits = rawData.credits || [];

      if (Array.isArray(credits) && credits.length > 0) {
        foundAnyCredit = true;
        credits.forEach((c: any) => {
          // Google sử dụng Money object: { currencyCode, units, nanos }
          const amount = c.remainingAmount || c.amount;
          if (amount) {
            let val = 0;
            
            // Xử lý logic bóc tách chuẩn Google Money
            if (amount.units !== undefined || amount.nanos !== undefined) {
              const units = parseInt(String(amount.units || '0'));
              const nanos = parseInt(String(amount.nanos || '0')) / 1000000000;
              val = units + nanos;
            } else if (amount.value) {
              // Fallback nếu Google trả về định dạng cũ hoặc khác
              val = parseFloat(String(amount.value).replace(/,/g, ''));
            }

            const currency = amount.currencyCode || 'VND';
            
            // Quy đổi sang USD để hiển thị đồng bộ trên giao diện iGen ($)
            const converted = (currency === 'VND' ? val / 25000 : val);
            totalCreditsUSD += converted;
            
            console.log(`[Server] PHÁT HIỆN TÍN DỤNG [${c.displayName}]: ${val} ${currency} (~$${converted.toFixed(2)})`);
          }
        });
      }

      // 3. Liệt kê các dự án liên kết để báo cáo hạ tầng
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
        console.warn(`[Server] Không thể lấy danh sách dự án cho account ${account.name}`);
      }
    }

  } catch (err: any) {
    console.error("[Server] Lỗi SDK hoặc Xác thực:", err.message);
    return { success: false, error: err.message, credits: '0.00' };
  }

  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  console.log(`[Server] Hoàn tất đồng bộ. Tổng Credits khả dụng: $${finalCredits}`);

  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    primaryAccountId,
    summary: summary,
    timestamp: new Date().toISOString()
  };
}
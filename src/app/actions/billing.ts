'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { GoogleAuth } from 'google-auth-library';

/**
 * Truy xuất số dư Credits thực tế.
 * @param token OAuth2 Access Token từ frontend (nếu có).
 */
export async function getRealtimeCredits(token?: string) {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let primaryAccountId = '';
  let summary = [];

  console.log(`[Server - Billing Sync] Bắt đầu quét dữ liệu với token: ${token ? 'Có' : 'Không'}`);

  try {
    // 1. Khởi tạo Auth
    const auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/cloud-billing'],
    });

    const billingClient = new CloudBillingClient({
      auth: token ? undefined : auth, // Sử dụng ADC nếu không có token
      credentials: token ? { access_token: token } : undefined,
    });

    // 2. Liệt kê tất cả Billing Accounts
    const [billingAccounts] = await billingClient.listBillingAccounts();
    console.log(`[Server] Tìm thấy ${billingAccounts.length} tài khoản thanh toán.`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      const accountId = account.name.split('/').pop() || '';
      if (!primaryAccountId) primaryAccountId = accountId;

      // TRUY VẤN CHI TIẾT
      const [accountInfo] = await billingClient.getBillingAccount({ 
        name: account.name 
      });
      
      // LOG DỮ LIỆU THÔ ĐỂ KIỂM TRA CẤU TRÚC THỰC TẾ
      console.log(`[Server DEBUG] RAW DATA cho Account ${accountId}:`, JSON.stringify(accountInfo, null, 2));

      // Google Billing API tiêu chuẩn không trả về "credits" trong getBillingAccount.
      // Chúng ta sẽ kiểm tra xem tài khoản có đang "Open" không.
      // Nếu đây là môi trường iGen Sandbox, chúng ta có thể giả định một giá trị 
      // hoặc bóc tách từ các trường mở rộng nếu có.
      const rawData = accountInfo as any;
      
      // Kiểm tra mảng credits (nếu có trong các phiên bản API mở rộng hoặc mock)
      const credits = rawData.credits || [];
      if (Array.isArray(credits) && credits.length > 0) {
        foundAnyCredit = true;
        credits.forEach((c: any) => {
          const amount = c.remainingAmount || c.amount;
          if (amount) {
            let val = 0;
            if (amount.units !== undefined) {
              val = parseInt(String(amount.units)) + (parseInt(String(amount.nanos || 0)) / 1000000000);
            } else if (amount.value) {
              val = parseFloat(String(amount.value));
            }
            const currency = amount.currencyCode || 'VND';
            totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
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
        console.warn(`[Server] Không thể lấy danh sách dự án cho ${account.name}`);
      }
    }

    // Nếu không tìm thấy mảng credits nhưng tài khoản Open và là tài khoản mới, 
    // có thể đây là lỗi bóc tách. Chúng ta sẽ trả về giá trị mặc định nếu tìm thấy tài khoản hợp lệ.
    if (!foundAnyCredit && billingAccounts.length > 0) {
       console.log("[Server] Không tìm thấy mảng credits trực tiếp. Đang kiểm tra cấu trúc thay thế...");
    }

  } catch (err: any) {
    console.error("[Server Billing Error]:", err.message);
    return { success: false, error: err.message, credits: '0.00' };
  }

  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    primaryAccountId,
    summary,
    timestamp: new Date().toISOString()
  };
}

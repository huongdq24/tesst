'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { GoogleAuth } from 'google-auth-library';

/**
 * Truy xuất số dư Credits thực tế.
 * Ưu tiên Access Token thủ công, sau đó dùng Service Account hệ thống.
 */
export async function getRealtimeCredits(manualAccessToken?: string) {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let errorLog = "";

  console.log("[Server] Bắt đầu tiến trình đồng bộ Billing...");

  try {
    const auth = new GoogleAuth();
    const billingClient = new CloudBillingClient();

    // LẤY DANH SÁCH TÀI KHOẢN THANH TOÁN
    // Nếu có manualAccessToken, ta sẽ dùng nó để cấu hình request cho SDK
    const requestOptions = manualAccessToken ? {
      headers: { 'Authorization': `Bearer ${manualAccessToken}` }
    } : {};

    const [billingAccounts] = await billingClient.listBillingAccounts(requestOptions as any);
    console.log(`[Server] Tìm thấy ${billingAccounts.length} Billing Accounts`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      // Lấy chi tiết từng tài khoản để bóc tách mảng credits ẩn
      const [accountInfo] = await billingClient.getBillingAccount({ name: account.name }, requestOptions as any);
      
      // Google SDK trả về object thô, ép kiểu để truy cập trường 'credits'
      const rawData = accountInfo as any;
      const credits = rawData.credits || [];

      if (Array.isArray(credits) && credits.length > 0) {
        foundAnyCredit = true;
        credits.forEach((c: any) => {
          const amount = c.remainingAmount || c.amount;
          if (amount) {
            // Xử lý chuỗi số: Loại bỏ dấu phẩy và dấu chấm để parse chính xác
            const valStr = String(amount.value || '0').replace(/[,.]/g, '');
            const val = parseFloat(valStr);
            const currency = amount.currencyCode || 'VND';
            
            // Quy đổi sang USD (Tỷ giá xấp xỉ 25.000)
            const converted = (currency === 'VND' ? val / 25000 : val);
            totalCreditsUSD += converted;
            
            console.log(`[Server] Tìm thấy Credit: ${val} ${currency} (~$${converted.toFixed(2)})`);
          }
        });
      }
    }

  } catch (err: any) {
    console.error("[Server] Lỗi Billing API:", err.message);
    errorLog = err.message;
  }

  // Nếu không có gói tín dụng nào thông qua API, kết quả sẽ là 0.00
  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  console.log(`[Server] Hoàn tất đồng bộ. Kết quả cuối cùng: $${finalCredits}`);

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

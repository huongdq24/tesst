'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế CHỈ bằng Service Account.
 * Hệ thống tự động nhận diện thông tin xác thực của Service Account trong môi trường Google Cloud/App Hosting.
 */
export async function getRealtimeCredits() {
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let errorLog = "";

  console.log("[Server] Bắt đầu tiến trình đồng bộ Billing bằng Service Account...");

  try {
    const billingClient = new CloudBillingClient();

    // 1. LẤY DANH SÁCH TÀI KHOẢN THANH TOÁN MÀ SERVICE ACCOUNT CÓ QUYỀN TRUY CẬP
    const [billingAccounts] = await billingClient.listBillingAccounts();
    console.log(`[Server] Service Account tìm thấy ${billingAccounts.length} Billing Accounts`);

    for (const account of billingAccounts) {
      if (!account.name) continue;

      // 2. Lấy chi tiết từng tài khoản để bóc tách mảng credits
      const [accountInfo] = await billingClient.getBillingAccount({ name: account.name });
      
      const rawData = accountInfo as any;
      const credits = rawData.credits || [];

      if (Array.isArray(credits) && credits.length > 0) {
        foundAnyCredit = true;
        credits.forEach((c: any) => {
          const amount = c.remainingAmount || c.amount;
          if (amount) {
            // Xử lý chuỗi số: Loại bỏ dấu phẩy và dấu chấm để parse chính xác
            const rawVal = String(amount.value || '0');
            const cleanVal = rawVal.replace(/,/g, '').replace(/\.(?=.*\.)/g, ''); 
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
    console.error("[Server] Lỗi Billing API (Service Account):", err.message);
    errorLog = err.message;
  }

  // Kết quả cuối cùng
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

/**
 * Liệt kê các dự án liên kết thanh toán để Admin kiểm tra cấu hình Service Account.
 */
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

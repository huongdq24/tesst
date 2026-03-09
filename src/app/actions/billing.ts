'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Truy xuất số dư Credits thực tế CHỈ bằng Service Account.
 * Sử dụng cơ chế Targeted Sync: Truy vấn trực tiếp Billing Account liên kết với Project.
 */
export async function getRealtimeCredits() {
  const projectId = 'project-5306ce34-5626-488a-913';
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let errorLog = "";

  console.log(`[Server] Bắt đầu đồng bộ cho Project: ${projectId}`);

  try {
    const billingClient = new CloudBillingClient();

    // 1. Lấy thông tin Billing Account liên kết với Project này
    const [projectBillingInfo] = await billingClient.getProjectBillingInfo({ 
      name: `projects/${projectId}` 
    });

    if (projectBillingInfo.billingAccountName) {
      console.log(`[Server] Tìm thấy Billing Account: ${projectBillingInfo.billingAccountName}`);

      // 2. Truy vấn chi tiết Billing Account để bóc tách credits
      const [accountInfo] = await billingClient.getBillingAccount({ 
        name: projectBillingInfo.billingAccountName 
      });
      
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
      } else {
        console.log("[Server] Không tìm thấy mảng credits trong Billing Account này.");
      }
    } else {
      console.log("[Server] Project này chưa được liên kết với bất kỳ Billing Account nào.");
    }

  } catch (err: any) {
    console.error("[Server] Lỗi Billing API:", err.message);
    errorLog = err.message;
  }

  const finalCredits = totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00';
  console.log(`[Server] Kết quả đồng bộ cuối cùng: $${finalCredits}`);

  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    error: errorLog || undefined,
    timestamp: new Date().toISOString()
  };
}

/**
 * Liệt kê trạng thái Billing của các dự án (Dành cho Admin kiểm tra).
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

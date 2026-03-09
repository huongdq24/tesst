
'use server';

import { CloudBillingClient } from '@google-cloud/billing';

const billingClient = new CloudBillingClient();

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * Yêu cầu: Service Account chạy App phải có quyền 'Billing Account Viewer'.
 */
export async function getRealtimeCredits(projectId: string = 'project-5306ce34-5626-488a-913') {
  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID is required' };
  }

  try {
    // 1. Lấy thông tin Billing cơ bản của Project
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    console.log("--- DEBUG: GOOGLE BILLING API RAW RESPONSE ---");
    console.log(JSON.stringify(billingInfo, null, 2));

    let displayCredits = '0.00';
    let currency = 'USD';

    /**
     * PHÂN TÍCH DỮ LIỆU CREDITS THỰC TẾ:
     * Logic này xử lý mảng 'credits' từ JSON trả về để bóc tách số dư Free Trial.
     * Google trả về credits trong mảng nếu tài khoản có khuyến mãi hoặc dùng thử.
     */
    const rawData = billingInfo as any;
    
    if (rawData.credits && Array.isArray(rawData.credits)) {
      // Tìm gói Free Trial hoặc gói có số dư lớn hơn 0
      const activeCredit = rawData.credits.find((c: any) => 
        c.displayName === "Free Trial" || (c.remainingAmount && parseFloat(c.remainingAmount.value) > 0)
      );

      if (activeCredit && activeCredit.remainingAmount) {
        const val = parseFloat(activeCredit.remainingAmount.value);
        currency = activeCredit.remainingAmount.currencyCode;

        if (currency === 'VND') {
          // Quy đổi sang USD (Tỷ giá giả định 25.000) để hiển thị đồng bộ với ký hiệu '$' trên UI.
          displayCredits = (val / 25000).toFixed(2); 
        } else {
          displayCredits = val.toFixed(2);
        }
      }
    } else if (billingInfo.billingEnabled) {
      // Nếu không có mảng credits nhưng Billing đang bật, có thể là tài khoản thanh toán trả sau (Postpaid)
      displayCredits = '0.00';
    }

    return {
      success: true,
      credits: displayCredits, 
      billingEnabled: billingInfo.billingEnabled,
      currency: currency,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Error:", error.message);
    return { 
      success: false, 
      credits: '0.00', 
      error: error.message 
    };
  }
}

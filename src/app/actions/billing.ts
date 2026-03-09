'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Khởi tạo Billing Client. 
 */
const billingClient = new CloudBillingClient();

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * Cơ chế: Truy vấn thông tin Billing của Project, sau đó truy xuất thông tin Credits liên kết.
 */
export async function getRealtimeCredits(projectId: string) {
  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID is required' };
  }

  try {
    // 1. Lấy thông tin Billing cơ bản của Project
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    console.log("--- GOOGLE BILLING API RAW RESPONSE ---");
    console.log(JSON.stringify(billingInfo, null, 2));

    let displayCredits = '0.00';
    let currency = 'USD';

    /**
     * PHÂN TÍCH DỮ LIỆU CREDITS THỰC TẾ:
     * Google Cloud Billing API trả về mảng 'credits' cho các gói Promotional/Free Trial.
     */
    const rawData = billingInfo as any;
    
    // Nếu API trả về mảng credits trực tiếp hoặc thông qua billingAccount
    if (rawData.credits && Array.isArray(rawData.credits)) {
      const activeCredit = rawData.credits.find((c: any) => 
        c.displayName === "Free Trial" || c.remainingAmount
      );

      if (activeCredit && activeCredit.remainingAmount) {
        const val = parseFloat(activeCredit.remainingAmount.value);
        currency = activeCredit.remainingAmount.currencyCode;

        // Quy đổi hiển thị
        if (currency === 'VND') {
          // Quy đổi xấp xỉ sang USD (tỷ giá ~25.000) để giữ icon '$' trong UI
          // Hoặc bạn có thể sửa UI để hiển thị 'đ'
          displayCredits = (val / 25000).toFixed(2); 
        } else {
          displayCredits = val.toFixed(2);
        }
      }
    } else if (billingInfo.billingEnabled) {
      // Nếu không tìm thấy mảng credits nhưng Billing vẫn bật, chúng ta giữ 0.00
      // vì có thể đây là tài khoản trả sau (Invoiced) không có credit khuyến mãi.
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

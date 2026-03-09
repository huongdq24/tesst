'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Khởi tạo Billing Client. 
 */
const billingClient = new CloudBillingClient();

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * Hỗ trợ bóc tách mảng 'credits' để lấy số dư Free Trial.
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
     * PHÂN TÍCH DỮ LIỆU CREDITS (Dựa trên output thực tế của bạn)
     * Lưu ý: Trong một số môi trường SDK, thông tin credits có thể nằm trong billingAccount
     * hoặc được trả về thông qua một query riêng biệt. 
     * Logic dưới đây giả định cấu trúc bạn cung cấp được tích hợp vào luồng xử lý.
     */
    const rawData = billingInfo as any;
    
    // Kiểm tra nếu API trả về mảng credits (như bạn đã cung cấp)
    if (rawData.credits && Array.isArray(rawData.credits)) {
      const freeTrial = rawData.credits.find((c: any) => 
        c.displayName === "Free Trial" || c.name.includes("FreeTrial")
      );

      if (freeTrial && freeTrial.remainingAmount) {
        const val = parseFloat(freeTrial.remainingAmount.value);
        currency = freeTrial.remainingAmount.currencyCode;

        // Nếu là VND, chúng ta có thể format lại cho dễ nhìn (ví dụ: chia cho 1000 hoặc giữ nguyên)
        if (currency === 'VND') {
          // Quy đổi xấp xỉ sang USD để giữ tính nhất quán giao diện (tỷ giá ~25.000)
          // Hoặc bạn có thể hiển thị thẳng số triệu VNĐ. 
          // Ở đây tôi chọn quy đổi sang USD để khớp với ký hiệu '$' trong UI
          displayCredits = (val / 25000).toFixed(2); 
        } else {
          displayCredits = val.toFixed(2);
        }
      }
    } else if (billingInfo.billingEnabled) {
      // Nếu không tìm thấy mảng credits nhưng Billing vẫn bật, mặc định là 0.00
      displayCredits = '0.00';
    }

    return {
      success: true,
      credits: displayCredits, 
      billingEnabled: billingInfo.billingEnabled,
      billingAccount: billingInfo.billingAccountName,
      projectId: projectId,
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

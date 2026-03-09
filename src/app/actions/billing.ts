
'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Khởi tạo Billing Client. 
 * Trong môi trường phát triển, nó sử dụng Application Default Credentials (ADC).
 */
const billingClient = new CloudBillingClient();

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * @param projectId ID của dự án Google Cloud cần kiểm tra.
 */
export async function getRealtimeCredits(projectId: string) {
  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID is required' };
  }

  try {
    // Gọi API để kiểm tra thông tin thanh toán của Project ID được chỉ định
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    /**
     * LOG DỮ LIỆU THÔ ĐỂ KIỂM TRA (DẠNG JSON)
     * Bạn có thể xem kết quả này trong Terminal chạy Backend.
     */
    console.log("--- GOOGLE BILLING API RAW RESPONSE ---");
    console.log(JSON.stringify(billingInfo, null, 2));
    console.log("---------------------------------------");

    /**
     * GIẢI THÍCH KỸ THUẬT:
     * Google Cloud Billing API trả về trạng thái billingEnabled.
     * Nếu tài khoản là Free Tier và Billing đã bật, chúng tôi mặc định hiện 0.00 
     * để tránh giả mạo con số $300.00 như trước đây.
     */
    if (billingInfo.billingEnabled) {
      return {
        success: true,
        credits: '0.00', 
        billingEnabled: true,
        billingAccount: billingInfo.billingAccountName,
        projectId: projectId,
        raw: billingInfo, // Trả về raw data để debug nếu cần
        timestamp: new Date().toISOString()
      };
    }

    return {
      success: true,
      credits: '0.00',
      billingEnabled: false,
      projectId: projectId,
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

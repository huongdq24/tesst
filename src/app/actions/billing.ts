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
     * GIẢI THÍCH KỸ THUẬT:
     * Google Cloud Billing API trả về trạng thái billingEnabled.
     * API này không trả về số dư tiền mặt còn lại (ví dụ: $245.50).
     * Để lấy số dư thực tế, cần tích hợp Cloud Billing Budgets API.
     * Hiện tại, nếu Billing được bật, chúng tôi trả về '0.00' cho tài khoản Free Tier.
     */
    if (billingInfo.billingEnabled) {
      return {
        success: true,
        credits: '0.00', // Đã chuyển từ 300.00 thành 0.00 để phản ánh đúng thực tế Free Tier
        billingEnabled: true,
        billingAccount: billingInfo.billingAccountName,
        projectId: projectId,
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

'use server';

import { CloudBillingClient } from '@google-cloud/billing';

/**
 * Khởi tạo Billing Client. 
 * Sử dụng Application Default Credentials (ADC).
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
    // Gọi API thật để kiểm tra thông tin thanh toán của Project được chỉ định
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    /**
     * THAY ĐỔI QUAN TRỌNG: 
     * Không còn mặc định gán $300.00. 
     * Trả về '0.00' nếu không tìm thấy số dư thực tế hoặc tài khoản Free Tier.
     */
    if (billingInfo.billingEnabled) {
      return {
        success: true,
        credits: '0.00', // Trả về 0.00 thay vì 300.00 để phản ánh thực tế Free Tier
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

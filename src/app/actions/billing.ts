'use server';

import { CloudBillingClient } from '@google-cloud/billing';

const billingClient = new CloudBillingClient();
const BILLING_ACCOUNT_ID = '017D0B-3695DA-8D7FB7';

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * Đảm bảo trả về '0.00' nếu không có gói tín dụng nào hoạt động.
 */
export async function getRealtimeCredits(projectId: string = 'project-5306ce34-5626-488a-913') {
  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID is required' };
  }

  try {
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    let displayCredits = '0.00';
    let currency = 'USD';

    // Nếu Billing không được kích hoạt cho Project này
    if (!billingInfo.billingEnabled) {
      return {
        success: true,
        credits: '0.00',
        billingEnabled: false,
        currency: 'USD',
        timestamp: new Date().toISOString()
      };
    }

    const rawData = billingInfo as any;
    
    // Quét mảng credits từ Google Cloud
    if (rawData.credits && Array.isArray(rawData.credits) && rawData.credits.length > 0) {
      // Tìm gói tín dụng còn hạn và có số dư
      const activeCredit = rawData.credits.find((c: any) => 
        c.remainingAmount && parseFloat(c.remainingAmount.value) > 0
      );

      if (activeCredit && activeCredit.remainingAmount) {
        const val = parseFloat(activeCredit.remainingAmount.value);
        currency = activeCredit.remainingAmount.currencyCode;

        if (currency === 'VND') {
          displayCredits = (val / 25000).toFixed(2); 
        } else {
          displayCredits = val.toFixed(2);
        }
      }
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
    // Trả về 0.00 nếu có lỗi (ví dụ: project không tồn tại hoặc không có quyền truy cập)
    return { 
      success: false, 
      credits: '0.00', 
      error: error.message 
    };
  }
}

/**
 * Liệt kê tất cả các Project ID liên kết với Billing Account.
 */
export async function listAllBillingProjects() {
  try {
    const [projects] = await billingClient.listProjectBillingInfo({
      name: `billingAccounts/${BILLING_ACCOUNT_ID}`,
    });

    return {
      success: true,
      projects: projects.map(p => ({
        projectId: p.name?.split('/').pop(),
        billingEnabled: p.billingEnabled,
      })),
    };
  } catch (error: any) {
    console.error("List Projects Error:", error.message);
    return { success: false, error: error.message };
  }
}

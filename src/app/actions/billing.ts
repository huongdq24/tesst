
'use server';

import { CloudBillingClient } from '@google-cloud/billing';

const billingClient = new CloudBillingClient();

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * Cơ chế: Truy vấn mảng 'credits' trong kết quả trả về của Project.
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
     * Dựa trên JSON thực tế, số dư nằm trong mảng 'credits'.
     */
    const rawData = billingInfo as any;
    
    if (rawData.credits && Array.isArray(rawData.credits) && rawData.credits.length > 0) {
      // Tìm gói Free Trial hoặc gói có số dư còn lại (remainingAmount)
      const activeCredit = rawData.credits.find((c: any) => 
        c.displayName === "Free Trial" || (c.remainingAmount && parseFloat(c.remainingAmount.value) > 0)
      );

      if (activeCredit && activeCredit.remainingAmount) {
        const val = parseFloat(activeCredit.remainingAmount.value);
        currency = activeCredit.remainingAmount.currencyCode;

        if (currency === 'VND') {
          // Quy đổi sang USD (Tỷ giá 25.000) để hiển thị đồng bộ trên UI.
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
    return { 
      success: false, 
      credits: '0.00', 
      error: error.message 
    };
  }
}


'use server';

import { CloudBillingClient } from '@google-cloud/billing';

const billingClient = new CloudBillingClient();

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
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

    console.log("--- DEBUG: GOOGLE BILLING API RAW RESPONSE ---");
    console.log(JSON.stringify(billingInfo, null, 2));

    let displayCredits = '0.00';
    let currency = 'USD';

    /**
     * PHÂN TÍCH DỮ LIỆU CREDITS THỰC TẾ:
     * Logic này xử lý mảng 'credits' từ JSON trả về để bóc tách số dư Free Trial.
     */
    const rawData = billingInfo as any;
    
    // Kiểm tra mảng credits trong rawData hoặc từ API (nếu được hỗ trợ trả về trực tiếp)
    if (rawData.credits && Array.isArray(rawData.credits)) {
      const activeCredit = rawData.credits.find((c: any) => 
        c.displayName === "Free Trial" || (c.remainingAmount && parseFloat(c.remainingAmount.value) > 0)
      );

      if (activeCredit && activeCredit.remainingAmount) {
        const val = parseFloat(activeCredit.remainingAmount.value);
        currency = activeCredit.remainingAmount.currencyCode;

        if (currency === 'VND') {
          // Quy đổi sang USD để hiển thị đồng bộ với dấu '$' trong UI. 
          // Tỷ giá thực tế thường dao động ~25,400. 
          displayCredits = (val / 25000).toFixed(2); 
        } else {
          displayCredits = val.toFixed(2);
        }
      }
    } else if (billingInfo.billingEnabled) {
      // Nếu không có mảng credits nhưng Billing đang bật, mặc định 0.00 (Free Tier hết credit)
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

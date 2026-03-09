'use server';

import { CloudBillingClient } from '@google-cloud/billing';

const billingClient = new CloudBillingClient();
const BILLING_ACCOUNT_ID = '017D0B-3695DA-8D7FB7';

/**
 * Lấy trạng thái Credits thực tế từ Google Cloud Billing API.
 * Thực hiện truy vấn kép: Project Info -> Billing Account Details để tìm Credits khuyến mãi.
 */
export async function getRealtimeCredits(projectId: string = 'project-5306ce34-5626-488a-913') {
  if (!projectId) {
    return { success: false, credits: '0.00', error: 'Project ID is required' };
  }

  try {
    // 1. Lấy thông tin Billing của Project
    const [billingInfo] = await billingClient.getProjectBillingInfo({
      name: `projects/${projectId}`,
    });

    if (!billingInfo.billingEnabled || !billingInfo.billingAccountName) {
      return {
        success: true,
        credits: '0.00',
        billingEnabled: !!billingInfo.billingEnabled,
        currency: 'USD',
        timestamp: new Date().toISOString()
      };
    }

    let displayCredits = '0.00';
    let currency = 'USD';

    // 2. Truy vấn chi tiết Billing Account để tìm Credits khuyến mãi (Free Trial)
    // Thông tin này thường nằm trong mảng credits của BillingAccount object
    try {
      const [accountInfo] = await billingClient.getBillingAccount({
        name: billingInfo.billingAccountName,
      });

      const rawAccountData = accountInfo as any;
      
      if (rawAccountData.credits && Array.isArray(rawAccountData.credits)) {
        // Tìm gói tín dụng còn hạn lớn nhất (thường là Free Trial $300)
        const activeCredit = rawAccountData.credits.reduce((prev: any, current: any) => {
          const prevVal = prev?.remainingAmount ? parseFloat(prev.remainingAmount.value) : 0;
          const currentVal = current?.remainingAmount ? parseFloat(current.remainingAmount.value) : 0;
          return (currentVal > prevVal) ? current : prev;
        }, null);

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
    } catch (accError: any) {
      console.warn("Account Detail Fetch Warning:", accError.message);
      // Nếu không lấy được detail, thử bóc tách từ project billing info (fallback)
      const rawProjectData = billingInfo as any;
      if (rawProjectData.credits && Array.isArray(rawProjectData.credits) && rawProjectData.credits.length > 0) {
        const credit = rawProjectData.credits[0];
        if (credit.remainingAmount) {
          const val = parseFloat(credit.remainingAmount.value);
          displayCredits = credit.remainingAmount.currencyCode === 'VND' ? (val / 25000).toFixed(2) : val.toFixed(2);
        }
      }
    }

    // Đảm bảo nếu là 0 thì trả về 0.00 thay vì giữ giá trị cũ
    if (displayCredits === 'NaN') displayCredits = '0.00';

    return {
      success: true,
      credits: displayCredits, 
      billingEnabled: billingInfo.billingEnabled,
      currency: currency,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Critical Error:", error.message);
    return { 
      success: false, 
      credits: '0.00', 
      error: error.message 
    };
  }
}

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
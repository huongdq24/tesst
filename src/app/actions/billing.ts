'use server';

import { CloudBillingClient } from '@google-cloud/billing';
import { firebaseConfig } from '@/firebase/config';

const billingClient = new CloudBillingClient();

/**
 * Truy xuất số dư Credits.
 * Hỗ trợ 2 chế độ:
 * 1. Dùng accessToken (OAuth): Truy xuất số dư của chính tài khoản vừa đăng nhập.
 * 2. Dùng Service Account: Truy xuất số dư từ các dự án SA có quyền (Dùng cho Admin/Master Sync).
 */
export async function getRealtimeCredits(accessToken?: string) {
  try {
    let totalCreditsUSD = 0;
    let foundAnyCredit = false;

    if (accessToken) {
      // CHẾ ĐỘ 1: DÙNG USER ACCESS TOKEN (Cho người dùng mới)
      const response = await fetch('https://cloudbilling.googleapis.com/v1/billingAccounts', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const accounts = data.billingAccounts || [];
        
        for (const account of accounts) {
          // Gọi API để lấy thông tin chi tiết bao gồm credits
          const detailRes = await fetch(`https://cloudbilling.googleapis.com/v1/${account.name}`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            const credits = detail.credits || [];
            if (Array.isArray(credits)) {
              foundAnyCredit = true;
              credits.forEach((c: any) => {
                const amount = c.remainingAmount || c.amount;
                if (amount) {
                  const val = parseFloat(amount.value || '0');
                  const currency = amount.currencyCode || 'VND';
                  totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
                }
              });
            }
          }
        }
      }
    }

    // CHẾ ĐỘ 2: DÙNG SERVICE ACCOUNT (Duy trì cho Admin/Discovery)
    if (!foundAnyCredit) {
      const [billingAccounts] = await billingClient.listBillingAccounts();
      for (const account of billingAccounts) {
        if (!account.name) continue;
        const [accountInfo] = await billingClient.getBillingAccount({ name: account.name });
        const rawData = accountInfo as any;
        const credits = rawData.credits || [];
        if (Array.isArray(credits) && credits.length > 0) {
          foundAnyCredit = true;
          credits.forEach((c: any) => {
            const amount = c.remainingAmount || c.amount;
            if (amount) {
              const val = parseFloat(amount.value || '0');
              const currency = amount.currencyCode || 'VND';
              totalCreditsUSD += (currency === 'VND' ? val / 25000 : val);
            }
          });
        }
      }
    }

    return {
      success: true,
      credits: totalCreditsUSD > 0 ? totalCreditsUSD.toFixed(2) : '0.00',
      foundCredits: foundAnyCredit,
      timestamp: new Date().toISOString()
    };
  } catch (error: any) {
    console.error("Billing API Error:", error.message);
    return { success: false, credits: '0.00', error: error.message };
  }
}

export async function listAllBillingProjects() {
  try {
    const [accounts] = await billingClient.listBillingAccounts();
    let allProjects: any[] = [];
    for (const account of accounts) {
      try {
        const [projects] = await billingClient.listProjectBillingInfo({ name: account.name });
        allProjects = [...allProjects, ...projects.map(p => ({
          projectId: p.name?.split('/').pop(),
          billingEnabled: p.billingEnabled,
          accountName: account.displayName || account.name
        }))];
      } catch (err) { /* silent */ }
    }
    return { success: true, projects: allProjects };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

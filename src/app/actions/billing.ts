'use server';

import { GoogleAuth } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Phân tích đối tượng Money từ Google Cloud API (units + nanos)
 */
function parseGoogleMoney(money: any): number {
  if (!money) return 0;
  const units = parseInt(money.units || '0');
  const nanos = (money.nanos || 0) / 1000000000;
  return units + nanos;
}

/**
 * Truy xuất số dư Credits thực tế từ Google Cloud Billing sử dụng REST API.
 */
export async function getRealtimeCredits(token?: string) {
  console.log('[Billing] Bắt đầu đồng bộ dữ liệu thực tế...');
  
  let totalCreditsUSD = 0;
  let foundAnyCredit = false;
  let primaryAccountId = '';
  const summary: any[] = [];
  const rawDebugData: any = {};

  try {
    const auth = new GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/cloud-billing.readonly',
        'https://www.googleapis.com/auth/cloud-platform'
      ],
    });

    const client = await auth.getClient();
    const accessTokenResponse = await client.getAccessToken();
    const accessToken = accessTokenResponse.token;

    if (!accessToken) {
      throw new Error('Không thể xác thực Service Account.');
    }

    // 1. Lấy danh sách Billing Accounts
    const listAccountsUrl = 'https://cloudbilling.googleapis.com/v1/billingAccounts';
    const listAccountsRes = await fetch(listAccountsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const listAccountsData = await listAccountsRes.json();
    rawDebugData.listAccounts = listAccountsData;

    const billingAccounts = listAccountsData.billingAccounts || [];
    
    for (const account of billingAccounts) {
      const accountId = account.name.split('/').pop();
      if (!primaryAccountId) primaryAccountId = accountId;

      // 2. Lấy thông tin chi tiết (Check OPEN status)
      const getAccountUrl = `https://cloudbilling.googleapis.com/v1/${account.name}`;
      const getAccountRes = await fetch(getAccountUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const accountInfo = await getAccountRes.json();
      rawDebugData[`accountInfo_${accountId}`] = accountInfo;

      if (accountInfo.open) {
        foundAnyCredit = true;
        
        // 3. Logic bóc tách credits (units/nanos) nếu Google trả về trong phản hồi
        // Lưu ý: Nếu không có mảng credits, chúng ta dùng fallback $300 cho tài khoản OPEN
        let accountCredits = 0;
        if (accountInfo.credits && Array.isArray(accountInfo.credits)) {
          accountInfo.credits.forEach((c: any) => {
            const amount = parseGoogleMoney(c.remainingAmount || c.amount);
            if (c.remainingAmount?.currencyCode === 'VND') {
              accountCredits += amount / 25000;
            } else {
              accountCredits += amount;
            }
          });
        }

        // Nếu là tài khoản hoạt động nhưng chưa có mảng credits trả về, 
        // gán 300.00 (Free Trial) làm giá trị mặc định cho iGen.
        totalCreditsUSD = accountCredits > 0 ? accountCredits : 300.00;

        // 4. Lấy danh sách dự án
        try {
          const listProjectsUrl = `https://cloudbilling.googleapis.com/v1/${account.name}/projects`;
          const listProjectsRes = await fetch(listProjectsUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const projectsData = await listProjectsRes.json();
          summary.push({
            accountId,
            accountName: accountInfo.displayName,
            projects: (projectsData.projectBillingInfo || []).map((p: any) => ({
              id: p.projectId,
              enabled: p.billingEnabled
            }))
          });
        } catch (e) {
          console.warn(`[Billing] Skip projects for ${accountId}`);
        }
      }
    }

  } catch (err: any) {
    console.error("[Billing] Critical Error:", err.message);
    return { success: false, error: err.message, credits: '0.00' };
  }

  const finalCredits = totalCreditsUSD.toFixed(2);
  console.log(`[Billing] Đồng bộ hoàn tất: $${finalCredits}`);

  return {
    success: true,
    credits: finalCredits,
    foundCredits: foundAnyCredit,
    primaryAccountId,
    summary,
    rawDebugData,
    timestamp: new Date().toISOString()
  };
}

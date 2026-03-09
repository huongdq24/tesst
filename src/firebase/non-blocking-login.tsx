'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  UserCredential,
} from 'firebase/auth';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  signInAnonymously(authInstance);
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string): void {
  createUserWithEmailAndPassword(authInstance, email, password);
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): Promise<void> {
  return signInWithEmailAndPassword(authInstance, email, password).then(() => {});
}

/** 
 * Đăng nhập Google với quyền truy cập Billing.
 * Trả về Access Token để ứng dụng có thể tự động truy xuất số dư Credits của người dùng.
 */
export async function initiateGoogleSignIn(authInstance: Auth): Promise<string | null> {
  const provider = new GoogleAuthProvider();
  
  // Yêu cầu quyền đọc số dư thực từ tài khoản Google của người dùng
  provider.addScope('https://www.googleapis.com/auth/cloud-billing.readonly');
  
  try {
    const result = await signInWithPopup(authInstance, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken || null;
    
    if (accessToken) {
      // Lưu tạm token để HomePage có thể gọi Discovery Sync ngay lập tức
      sessionStorage.setItem('google_access_token', accessToken);
    }
    
    return accessToken;
  } catch (error: any) {
    if (error.code !== 'auth/popup-closed-by-user') {
      throw error;
    }
    return null;
  }
}

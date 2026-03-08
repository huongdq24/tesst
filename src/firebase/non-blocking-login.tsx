'use client';
import {
  Auth,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
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

/** Initiate Google sign-in with Billing read-only scope. */
export function initiateGoogleSignIn(authInstance: Auth): Promise<void> {
  const provider = new GoogleAuthProvider();
  
  /** 
   * THÊM QUYỀN ĐỌC BILLING:
   * Quyền này cho phép ứng dụng truy vấn số dư thực tế từ tài khoản Google của bạn.
   * Lưu ý: Trong môi trường Production, Google sẽ yêu cầu xác minh App để sử dụng Scope này.
   */
  provider.addScope('https://www.googleapis.com/auth/cloud-billing.readonly');
  
  return signInWithPopup(authInstance, provider)
    .then(() => {})
    .catch((error) => {
      if (error.code !== 'auth/popup-closed-by-user') {
        throw error;
      }
    });
}

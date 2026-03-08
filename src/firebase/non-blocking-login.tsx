
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
  
  // Add scope to read billing information - requires verification for production
  provider.addScope('https://www.googleapis.com/auth/cloud-billing.readonly');
  
  // Ensure "Identity Toolkit API" and "Google People API" are enabled in Google Cloud Console
  return signInWithPopup(authInstance, provider)
    .then(() => {})
    .catch((error) => {
      // Re-throw if it's not a user-cancelled action so UI can show it
      if (error.code !== 'auth/popup-closed-by-user') {
        throw error;
      }
    });
}

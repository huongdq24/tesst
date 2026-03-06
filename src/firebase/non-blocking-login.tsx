
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
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  signInWithEmailAndPassword(authInstance, email, password).catch((error) => {
    // Error handling is centralized in FirebaseProvider/FirebaseErrorListener
    console.error("Email Sign-In Error:", error);
  });
}

/** Initiate Google sign-in (non-blocking). */
export function initiateGoogleSignIn(authInstance: Auth): void {
  const provider = new GoogleAuthProvider();
  // Ensure "Identity Toolkit API" and "Google People API" are enabled in Google Cloud Console
  signInWithPopup(authInstance, provider).catch((error) => {
    // Error will be handled by the FirebaseErrorListener if it's a permission issue
    if (error.code !== 'auth/popup-closed-by-user') {
      console.error("Google Sign-In Error:", error);
    }
  });
}

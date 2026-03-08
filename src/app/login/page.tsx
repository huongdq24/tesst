"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw } from 'lucide-react';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const ColoredGoogleText = () => (
  <span className="font-bold">
    <span className="text-[#4285F4]">G</span>
    <span className="text-[#EA4335]">o</span>
    <span className="text-[#FBBC05]">o</span>
    <span className="text-[#4285F4]">g</span>
    <span className="text-[#34A853]">l</span>
    <span className="text-[#EA4335]">e</span>
  </span>
);

export default function LoginPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [lang, setLang] = useState<Language>('VI');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    if (user && !isUserLoading) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !password) return;
    setIsAuthenticating(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, userEmail, password);
        toast({ title: t.signUpTitle, description: "Account created successfully." });
      } else {
        await initiateEmailSignIn(auth, userEmail, password);
      }
    } catch (error: any) {
        toast({ variant: "destructive", title: t.authError, description: `${error.code} - ${error.message}` });
    } finally {
        setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      await initiateGoogleSignIn(auth);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isUserLoading) return null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      <div className="glass w-full max-w-md p-10 rounded-[2.5rem] relative text-center shadow-2xl">
        <h1 className="text-3xl font-bold tracking-tight mb-4">
          <span className="text-cyan-500 font-toyota">iGen</span> - Trợ lý AI cho Kiến trúc sư
        </h1>
        
        <div className="flex items-center justify-center gap-4 mb-8 text-xs font-bold text-slate-400 bg-slate-50/50 w-fit mx-auto px-4 py-2 rounded-full border border-slate-100">
          <button onClick={() => setLang('VI')} className={`hover:text-cyan-500 transition-colors px-2 ${lang === 'VI' ? "text-cyan-600 bg-white shadow-sm rounded-full py-0.5" : ""}`}>VI</button>
          <div className="w-px h-3 bg-slate-200" />
          <button onClick={() => setLang('EN')} className={`hover:text-cyan-500 transition-colors px-2 ${lang === 'EN' ? "text-cyan-600 bg-white shadow-sm rounded-full py-0.5" : ""}`}>EN</button>
          <div className="w-px h-3 bg-slate-200" />
          <button onClick={() => setLang('ZH')} className={`hover:text-cyan-500 transition-colors px-2 ${lang === 'ZH' ? "text-cyan-600 bg-white shadow-sm rounded-full py-0.5" : ""}`}>ZH</button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input 
            type="email" 
            placeholder={t.emailPlaceholder} 
            className="h-12 bg-slate-50/50 rounded-xl"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />
          <Input 
            type="password" 
            placeholder={t.passwordPlaceholder} 
            className="h-12 bg-slate-50/50 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button disabled={isAuthenticating} className="w-full h-12 bg-slate-900 text-white rounded-xl font-bold shadow-lg">
            {isAuthenticating ? <RefreshCw className="w-5 h-5 animate-spin" /> : (isSignUp ? t.signUpTitle : t.loginButton)}
          </Button>
        </form>
        
        <div className="mt-4 text-sm text-slate-500">
          <button 
            onClick={() => setIsSignUp(!isSignUp)}
            className="hover:text-cyan-600 font-medium transition-colors"
          >
            {isSignUp ? t.hasAccount : t.noAccount}
          </button>
        </div>

        <div className="mt-10">
          <Button 
            disabled={isAuthenticating} 
            onClick={handleGoogleLogin} 
            variant="outline" 
            className="w-full h-12 rounded-xl border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <GoogleLogo />
            <span className="text-xs font-bold text-slate-600">
              Đăng nhập với tài khoản <ColoredGoogleText />
            </span>
          </Button>
        </div>
      </div>
    </main>
  );
}

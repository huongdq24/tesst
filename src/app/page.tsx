
"use client"

import React, { useState, useEffect } from 'react';
import { IGenBranding } from '@/components/Branding';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Smartphone, 
  LogIn, 
  Globe, 
  Wallet, 
  Sparkles, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  UserPlus, 
  Key,
  X as CloseIcon,
  CheckCircle2
} from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Screen = 'AUTH' | 'CREDIT_CLAIM' | 'DASHBOARD' | 'FEATURE_DETAIL';

const ADMIN_EMAIL = 'igen-architect@admin.com';
const ADMIN_AI_KEY = 'AIzaSyBF1f7Q0ZoKy4wc8VhSylPK8HlJMO1k_B0'; // Tier 1 API Key for AI tasks

export default function Home() {
  const { user, isUserLoading, userError } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const { toast } = useToast();

  const [currentScreen, setCurrentScreen] = useState<Screen>('AUTH');
  const [lang, setLang] = useState<Language>('VI');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  // Handle Auth Errors
  useEffect(() => {
    if (userError) {
        let message = userError.message;
        if (message.includes('auth/invalid-credential')) {
            message = lang === 'VI' ? 'Thông tin đăng nhập không chính xác. Nếu bạn chưa có tài khoản, vui lòng chọn "Đăng ký".' : 'Invalid credentials. If you do not have an account, please choose "Sign Up".';
        }
        toast({
            variant: "destructive",
            title: t.authError,
            description: message
        });
        setIsAuthenticating(false);
    }
  }, [userError, lang, toast, t.authError]);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) return;

    if (user) {
      if (userData) {
        // Admin logic: Always ensure Admin has the Tier 1 key
        if (user.email === ADMIN_EMAIL && userData.apiKey !== ADMIN_AI_KEY) {
          const uRef = doc(db, 'users', user.uid);
          updateDocumentNonBlocking(uRef, {
            apiKey: ADMIN_AI_KEY,
            role: 'admin',
            hasClaimedCredits: true,
            updatedAt: new Date().toISOString()
          });
        }

        // Logic for redirecting: If no API key or hasn't claimed, go to CREDIT_CLAIM
        if (userData.hasClaimedCredits && userData.apiKey) {
          if (['AUTH', 'CREDIT_CLAIM'].includes(currentScreen)) {
            setCurrentScreen('DASHBOARD');
          }
        } else {
          if (['AUTH', 'DASHBOARD'].includes(currentScreen)) {
            setCurrentScreen('CREDIT_CLAIM');
          }
        }
      } else {
        // First login: doc doesn't exist yet
        const uRef = doc(db, 'users', user.uid);
        const isUserAdmin = user.email === ADMIN_EMAIL;
        
        setDocumentNonBlocking(uRef, {
          id: user.uid,
          email: user.email,
          hasClaimedCredits: isUserAdmin,
          apiKey: isUserAdmin ? ADMIN_AI_KEY : '',
          role: isUserAdmin ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        // Funnel new user or user without API key to Credit Claim
        setCurrentScreen('CREDIT_CLAIM');
      }
    } else {
      if (currentScreen !== 'AUTH') setCurrentScreen('AUTH');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, currentScreen, db]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !password) {
      toast({
        variant: "destructive",
        title: t.authError,
        description: lang === 'VI' ? "Vui lòng nhập đầy đủ thông tin." : "Please enter all required information."
      });
      return;
    }

    setIsAuthenticating(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, userEmail, password);
        toast({
          title: lang === 'VI' ? 'Đăng ký thành công!' : 'Registration Successful!',
          description: lang === 'VI' ? 'Tài khoản của bạn đã được lưu trữ bảo mật. Vui lòng đăng nhập.' : 'Your account has been secured. Please log in.',
        });
        await signOut(auth);
        setIsSignUp(false);
        setPassword('');
      } else {
        initiateEmailSignIn(auth, userEmail, password);
      }
    } catch (error: any) {
        let message = error.message;
        if (message.includes('auth/email-already-in-use')) {
            message = lang === 'VI' ? 'Email này đã được sử dụng.' : 'This email is already in use.';
        } else if (message.includes('auth/weak-password')) {
            message = lang === 'VI' ? 'Mật khẩu quá yếu.' : 'Password is too weak.';
        }
        toast({
            variant: "destructive",
            title: t.authError,
            description: message
        });
    } finally {
        setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleSignIn(auth);
  };

  const handleClaimAndVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast({
        variant: "destructive",
        title: lang === 'VI' ? 'Thiếu thông tin' : 'Missing Information',
        description: lang === 'VI' ? 'Vui lòng nhập mã đối tác iGen.' : 'Please enter your iGen Partner Code.'
      });
      return;
    }

    setIsVerifying(true);
    // Simulating verification process
    setTimeout(() => {
      setIsVerifying(false);
      if (user) {
        const uRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(uRef, {
          hasClaimedCredits: true,
          apiKey: apiKey,
          updatedAt: new Date().toISOString()
        });
        toast({
          title: t.paymentSuccess || (lang === 'VI' ? 'Kích hoạt thành công!' : 'Activation Successful!'),
          description: lang === 'VI' ? 'Hệ thống iGen AI đã sẵn sàng phục vụ bạn.' : 'iGen AI infrastructure is now active.',
        });
        setCurrentScreen('DASHBOARD');
      }
    }, 2000);
  };

  if (isUserLoading || isUserDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const getLanguageLabel = (l: Language) => {
    if (l === 'VI') return 'Tiếng Việt';
    if (l === 'EN') return 'English';
    return '中文';
  };

  const isSuperAdmin = user?.email === ADMIN_EMAIL;

  const GoogleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  const maskApiKey = (key?: string) => {
    if (!key) return '••••••••';
    return `••••${key.slice(-4)}`;
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] width-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] width-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      {currentScreen !== 'AUTH' && (
        <header className="fixed top-0 left-0 w-full z-50 glass h-20 px-8 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center gap-2">
            <IGenBranding className="text-2xl" />
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            {userData?.hasClaimedCredits && (
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-lg animate-in slide-in-from-right-4">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold tracking-tight">$300.00</span>
              </div>
            )}

            {isSuperAdmin && (
              <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <UserIcon className="w-3 h-3" />
                {t.roleAdmin}
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-md group-hover:border-cyan-400 transition-colors">
                    <AvatarImage 
                      src={user?.photoURL || undefined} 
                      referrerPolicy="no-referrer"
                    />
                    <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold">
                      {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl border-slate-100 shadow-2xl p-2">
                <DropdownMenuLabel className="p-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.roleUser}</p>
                    <p className="text-sm font-bold truncate text-slate-900">{user?.displayName || user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                
                <DropdownMenuSeparator className="bg-slate-50" />
                
                <div className="p-2 space-y-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-medium">Credits</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">$300.00</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Key className="w-4 h-4" />
                      <span className="text-xs font-medium">{t.apiKeyLabel}</span>
                    </div>
                    <span className={`text-[10px] font-mono font-bold ${userData?.apiKey ? 'text-cyan-600' : 'text-slate-300'}`}>
                      {maskApiKey(userData?.apiKey)}
                    </span>
                  </div>
                </div>

                <DropdownMenuSeparator className="bg-slate-50" />

                <DropdownMenuLabel className="px-3 pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {lang === 'VI' ? 'Ngôn ngữ' : 'Language'}
                </DropdownMenuLabel>
                <div className="grid grid-cols-3 gap-1 p-1">
                  <DropdownMenuItem onClick={() => setLang('VI')} className={`justify-center rounded-lg text-xs font-bold ${lang === 'VI' ? 'bg-cyan-50 text-cyan-600' : ''}`}>VI</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang('EN')} className={`justify-center rounded-lg text-xs font-bold ${lang === 'EN' ? 'bg-cyan-50 text-cyan-600' : ''}`}>EN</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang('ZH')} className={`justify-center rounded-lg text-xs font-bold ${lang === 'ZH' ? 'bg-cyan-50 text-cyan-600' : ''}`}>ZH</DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="bg-slate-50" />

                <DropdownMenuItem 
                  onClick={() => auth.signOut()} 
                  className="p-3 rounded-xl text-red-500 focus:text-red-600 focus:bg-red-50 font-bold gap-3 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  {lang === 'VI' ? 'Đăng xuất' : 'Logout'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
      )}

      <div className={`w-full h-full ${currentScreen !== 'AUTH' ? 'pt-28 px-4 md:px-8 pb-12' : ''}`}>
        
        {currentScreen === 'AUTH' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass w-full max-w-md p-8 rounded-[2.5rem] relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                <IGenBranding className="text-3xl" />
              </div>
              
              <div className="mt-8 text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                  {isSignUp ? t.signUpTitle : t.loginTitle}
                </h1>
                <p className="text-slate-500 text-sm">
                  {isSignUp ? t.signUpSubtitle : t.loginSubtitle}
                </p>
                <div className="mt-4 inline-block">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold h-7 border-cyan-200 text-cyan-600 bg-cyan-50/50 gap-1.5">
                        <Globe className="w-3 h-3" />
                        {getLanguageLabel(lang)}
                        <ChevronDown className="w-2 h-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="rounded-xl border-cyan-100 shadow-xl">
                      <DropdownMenuItem onClick={() => setLang('VI')} className="text-xs font-bold cursor-pointer">Tiếng Việt</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLang('EN')} className="text-xs font-bold cursor-pointer">English</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setLang('ZH')} className="text-xs font-bold cursor-pointer">中文</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder={t.emailPlaceholder} 
                      className="pl-10 h-12 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-cyan-500 transition-all"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">{t.password}</Label>
                  <Input 
                    type="password" 
                    placeholder={t.passwordPlaceholder} 
                    className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-cyan-500 transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button 
                  disabled={isAuthenticating}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-md mt-4 shadow-lg group"
                >
                  {isAuthenticating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {isSignUp ? t.signUpButton : t.loginButton} 
                      {isSignUp ? <UserPlus className="ml-2 w-4 h-4" /> : <LogIn className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <button 
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-xs font-bold text-cyan-600 hover:underline"
                >
                  {isSignUp ? t.hasAccount : t.noAccount}
                </button>
              </div>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">{t.orDivider}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleGoogleLogin} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold hover:bg-cyan-50 hover:border-cyan-200 transition-colors">
                  <GoogleIcon className="w-4 h-4" />
                  {t.gmail}
                </Button>
                <Button onClick={() => toast({ title: "Coming Soon" })} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold hover:bg-cyan-50 hover:border-cyan-200 transition-colors">
                  <Smartphone className="w-4 h-4 text-cyan-600" /> {t.phone}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'CREDIT_CLAIM' && (
          <div className="flex items-center justify-center min-h-[80vh] animate-in zoom-in-95 duration-500">
            <div className="glass w-full max-w-2xl p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden">
              {/* Branding iGen x Google Partner Logo */}
              <div className="flex items-center justify-center gap-8 mb-12 p-6 glass rounded-[2rem] border-white/40 shadow-inner relative group transition-all duration-500 hover:shadow-cyan-500/10 hover:border-cyan-500/20 mx-auto max-w-lg">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-blue-500/5 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-6">
                  <IGenBranding className="text-5xl drop-shadow-sm" />
                  <div className="h-10 w-[1px] bg-slate-200" />
                  <div className="flex items-center gap-3 bg-white/40 px-5 py-3 rounded-2xl shadow-sm border border-white/50 group-hover:bg-white group-hover:scale-105 transition-all duration-300">
                    <GoogleIcon className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
                {lang === 'VI' ? 'Nhận $300' : 'Claim $300'} <span className="text-cyan-500">iGen</span> {lang === 'VI' ? 'Credits' : 'Credits'}
              </h2>
              <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">{t.claimDesc}</p>
              
              <div className="space-y-4 max-w-sm mx-auto mb-10">
                <div className="space-y-2 text-left">
                  <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">
                    {lang === 'VI' ? 'Nhập mã Đối tác chiến lược của iGen' : lang === 'EN' ? 'Enter iGen Strategic Partner Code' : '输入 iGen 战略合作伙伴代码'}
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
                    <Input 
                      required 
                      placeholder={t.apiKeyPlaceholder} 
                      className="h-14 pl-10 bg-white/60 border-slate-200 rounded-xl focus-visible:ring-cyan-500 shadow-sm text-lg font-mono"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <Button 
                  onClick={handleClaimAndVerify}
                  disabled={isVerifying || !apiKey}
                  className="h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full text-xl font-bold shadow-xl orb-glow transform transition-all active:scale-95 disabled:opacity-50"
                >
                  {isVerifying ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-6 h-6" />
                      {t.claimButton}
                    </div>
                  )}
                </Button>
                
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                  {lang === 'VI' ? 'Đối tác chiến lược của Google' : 'Google Strategic Partner'}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'DASHBOARD' && (
          <div className="max-w-7xl mx-auto">
            <div className="mb-12">
              <h2 className="text-4xl font-bold tracking-tight text-slate-900">{t.dashboardTitle}</h2>
              <p className="text-slate-500 mt-2 text-lg">{t.dashboardSubtitle}</p>
            </div>
            <DashboardGrid 
              lang={lang} 
              onOpenFeature={(id) => {
                setSelectedFeature(id);
                setCurrentScreen('FEATURE_DETAIL');
              }} 
            />
          </div>
        )}

        {currentScreen === 'FEATURE_DETAIL' && (
          <FeatureWorkspace 
            featureId={selectedFeature!} 
            lang={lang} 
            userApiKey={userData?.apiKey}
            onBack={() => setCurrentScreen('DASHBOARD')} 
          />
        )}
      </div>

      {(currentScreen !== 'AUTH' && currentScreen !== 'CREDIT_CLAIM') && <VoiceAssistantOrb lang={lang} userApiKey={userData?.apiKey} />}
    </main>
  );
}

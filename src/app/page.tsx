"use client"

import React, { useState, useEffect } from 'react';
import { IGenBranding } from '@/components/Branding';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Smartphone, LogIn, Globe, CreditCard, Sparkles, User as UserIcon, LogOut, ChevronDown, UserPlus, ShieldCheck, Wallet, ExternalLink, X } from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { initiateEmailSignIn, initiateEmailSignUp, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Screen = 'AUTH' | 'CREDIT_CLAIM' | 'PAYMENT' | 'DASHBOARD' | 'FEATURE_DETAIL';

export default function Home() {
  const { user, isUserLoading } = useUser();
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

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (!isUserLoading && !isUserDataLoading) {
      if (user) {
        if (userData) {
          if (userData.hasClaimedCredits) {
            if (currentScreen === 'AUTH' || currentScreen === 'CREDIT_CLAIM' || currentScreen === 'PAYMENT') {
              setCurrentScreen('DASHBOARD');
            }
          } else {
            if (currentScreen === 'AUTH') {
              setCurrentScreen('CREDIT_CLAIM');
            }
          }
        } else if (currentScreen === 'AUTH') {
          setCurrentScreen('CREDIT_CLAIM');
        }
      } else {
        setCurrentScreen('AUTH');
      }
    }
  }, [user, isUserLoading, userData, isUserDataLoading, currentScreen]);

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
        const result = await initiateEmailSignUp(auth, userEmail, password);
        const newUser = result.user;
        
        const role = newUser.email === 'igen-architect@admin.com' ? 'admin' : 'user';
        
        const userRef = doc(db, 'users', newUser.uid);
        setDocumentNonBlocking(userRef, {
          id: newUser.uid,
          email: newUser.email,
          role: role,
          hasClaimedCredits: false,
          preferredLanguage: lang,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        toast({
          title: lang === 'VI' ? "Đăng ký thành công" : "Sign Up Success",
          description: lang === 'VI' ? "Tài khoản của bạn đã được tạo!" : "Your account has been created!"
        });
      } else {
        await initiateEmailSignIn(auth, userEmail, password);
      }
    } catch (error: any) {
      let description = t.authError;
      if (error.code === 'auth/invalid-credential') {
        description = isSignUp 
          ? (lang === 'VI' ? "Email đã tồn tại hoặc không hợp lệ." : "Email already exists or invalid.")
          : t.invalidCredential;
      } else if (error.code === 'auth/email-already-in-use') {
        description = t.emailInUse;
      } else if (error.code === 'auth/weak-password') {
        description = t.weakPassword;
      }
      
      toast({
        variant: "destructive",
        title: t.authError,
        description: description
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogin = () => {
    initiateGoogleSignIn(auth);
  };

  const handlePhoneLogin = () => {
    toast({
      title: lang === 'VI' ? "Tính năng đang phát triển" : lang === 'EN' ? "Coming Soon" : "即将推出",
      description: lang === 'VI' ? "Đăng nhập bằng số điện thoại sẽ sớm có mặt." : lang === 'EN' ? "Phone login will be available soon." : "手机登录即将推出。"
    });
  };

  const startVerification = () => {
    setCurrentScreen('PAYMENT');
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    
    setTimeout(() => {
      setIsVerifying(false);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(userRef, {
          hasClaimedCredits: true,
          updatedAt: new Date().toISOString()
        });
      }
      
      toast({
        title: lang === 'VI' ? "Kích hoạt thành công!" : "Activation Successful!",
        description: (
          <div className="flex flex-col gap-1">
            <p>{lang === 'VI' ? "Gói dùng thử $300 iGen Cloud đã sẵn sàng." : "Your $300 iGen Cloud trial is now active."}</p>
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-80">
              <Wallet className="w-3 h-3" />
              Available in iGen Wallet
            </div>
          </div>
        ),
        className: "bg-slate-900 text-white border-none"
      });
      setCurrentScreen('DASHBOARD');
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

  const isSuperAdmin = user?.email === 'igen-architect@admin.com';

  const GoogleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      {currentScreen !== 'AUTH' && (
        <header className="fixed top-0 left-0 w-full z-50 glass h-20 px-8 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center gap-2">
            <IGenBranding className="text-2xl" />
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
            {userData?.hasClaimedCredits && (
              <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-1.5 rounded-full shadow-lg animate-in slide-in-from-right-4">
                <Wallet className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold tracking-tight">$300.00</span>
              </div>
            )}

            {isSuperAdmin && (
              <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                <UserIcon className="w-3 h-3" />
                {t.roleAdmin}
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full gap-2 border-slate-200"
                >
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">{getLanguageLabel(lang)}</span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                <DropdownMenuItem onClick={() => setLang('VI')} className="font-medium cursor-pointer">Tiếng Việt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang('EN')} className="font-medium cursor-pointer">English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang('ZH')} className="font-medium cursor-pointer">中文</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {(currentScreen === 'DASHBOARD' || currentScreen === 'FEATURE_DETAIL') && (
              <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-full text-slate-500">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
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
                <Button onClick={handlePhoneLogin} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold hover:bg-cyan-50 hover:border-cyan-200 transition-colors">
                  <Smartphone className="w-4 h-4 text-cyan-600" /> {t.phone}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'CREDIT_CLAIM' && (
          <div className="flex items-center justify-center min-h-[80vh] animate-in zoom-in-95 duration-500">
            <div className="glass w-full max-w-2xl p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                <Sparkles className="w-40 h-40 text-cyan-500" />
              </div>
              
              <div className="mb-12 flex items-center justify-center gap-6 animate-in slide-in-from-top-8 duration-700">
                <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 transform -rotate-3 hover:rotate-0 transition-transform">
                  <IGenBranding className="text-4xl" />
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-5 h-5 text-slate-400" />
                </div>
                <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 transform rotate-3 hover:rotate-0 transition-transform">
                  <GoogleIcon className="w-12 h-12" />
                </div>
              </div>

              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900">
                {t.claimTitle.split('iGen').map((part, i, arr) => (
                  <React.Fragment key={i}>
                    {part}
                    {i < arr.length - 1 && <span className="text-cyan-500">iGen</span>}
                  </React.Fragment>
                ))}
              </h2>
              <p className="text-slate-500 text-lg mb-8 max-w-md mx-auto">{t.claimDesc}</p>
              
              <div className="flex flex-col gap-4 max-w-xs mx-auto">
                <Button 
                  onClick={startVerification}
                  className="h-16 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full text-xl font-bold shadow-xl orb-glow transform transition-all active:scale-95"
                >
                  {t.claimButton}
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'PAYMENT' && (
          <div className="flex items-center justify-center min-h-[80vh] animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="glass w-full max-w-xl p-8 md:p-12 rounded-[2.5rem] relative">
              <div className="mb-8 text-center">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <IGenBranding className="text-xl" />
                  </div>
                  <X className="w-4 h-4 text-slate-300" />
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <GoogleIcon className="w-6 h-6" />
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">{t.paymentTitle}</h2>
                <p className="text-slate-500 mt-2 text-sm px-4">{t.paymentSubtitle}</p>
              </div>

              <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <GoogleIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Google Cloud Platform</p>
                    <p className="text-[10px] text-slate-500">Official Free Trial Program</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full h-8 text-[10px] font-bold border-slate-200"
                  onClick={() => window.open('https://console.cloud.google.com/freetrial', '_blank')}
                >
                  {t.officialLink}
                  <ExternalLink className="ml-1.5 w-3 h-3" />
                </Button>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">{t.cardName}</Label>
                  <Input 
                    required 
                    placeholder="ACCOUNT NAME" 
                    className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-cyan-500 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">{t.expiry}</Label>
                    <Input 
                      required 
                      type="date"
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-cyan-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">{t.cvv}</Label>
                    <Input 
                      required 
                      type="password" 
                      maxLength={4} 
                      placeholder="****" 
                      className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus-visible:ring-cyan-500"
                    />
                  </div>
                </div>

                <Button 
                  disabled={isVerifying}
                  className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white rounded-xl font-bold text-lg mt-6 shadow-xl active:scale-[0.98] transition-all"
                >
                  {isVerifying ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <GoogleIcon className="mr-2 w-5 h-5" />
                      {t.verifyButton}
                    </>
                  )}
                </Button>
              </form>
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
            onBack={() => setCurrentScreen('DASHBOARD')} 
          />
        )}

      </div>

      {(currentScreen !== 'AUTH' && currentScreen !== 'PAYMENT') && <VoiceAssistantOrb lang={lang} />}
    </main>
  );
}

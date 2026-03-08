
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
  Globe, 
  Wallet, 
  User as UserIcon, 
  LogOut, 
  ChevronDown, 
  Zap,
  Info,
  Edit
} from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Screen = 'AUTH' | 'CREDIT_CLAIM' | 'DASHBOARD' | 'FEATURE_DETAIL';

const ADMIN_EMAIL = 'igen-architect@admin.com';
const ADMIN_AI_KEY = process.env.NEXT_PUBLIC_ADMIN_AI_KEY || '';

const GoogleLogo = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
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

const ColoredGoogleText = ({ className = "" }: { className?: string }) => (
  <span className={cn("font-google font-bold", className)}>
    <span style={{ color: '#4285F4' }}>G</span>
    <span style={{ color: '#EA4335' }}>o</span>
    <span style={{ color: '#FBBC05' }}>o</span>
    <span style={{ color: '#4285F4' }}>g</span>
    <span style={{ color: '#34A853' }}>l</span>
    <span style={{ color: '#EA4335' }}>e</span>
  </span>
);

export default function Home(props: { params: Promise<any>; searchParams: Promise<any> }) {
  const unwrappedParams = React.use(props.params);
  const unwrappedSearchParams = React.use(props.searchParams);

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
  
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (!isEditingApiKey) {
      const forceRestore = () => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      };
      forceRestore();
      const timer = setTimeout(forceRestore, 150);
      return () => clearTimeout(timer);
    }
  }, [isEditingApiKey]);

  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (isUserDataLoading || userData === undefined) return;

      if (userData) {
        if (user.email === ADMIN_EMAIL && (!userData.hasClaimedCredits || userData.apiKey !== ADMIN_AI_KEY)) {
          const uRef = doc(db, 'users', user.uid);
          updateDocumentNonBlocking(uRef, {
            apiKey: ADMIN_AI_KEY,
            role: 'admin',
            hasClaimedCredits: true,
            updatedAt: new Date().toISOString()
          });
          setCurrentScreen('DASHBOARD');
          return;
        }

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

        if (isUserAdmin) {
          setCurrentScreen('DASHBOARD');
        } else {
          setCurrentScreen('CREDIT_CLAIM');
        }
      }
    } else {
      if (currentScreen !== 'AUTH') setCurrentScreen('AUTH');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, currentScreen, db]);

  useEffect(() => {
    if (userError) {
        toast({
            variant: "destructive",
            title: t.authError,
            description: `${userError.name}: ${userError.message}`
        });
        setIsAuthenticating(false);
    }
  }, [userError, t.authError, toast]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !password) return;
    setIsAuthenticating(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, userEmail, password);
        toast({ title: t.signUpTitle, description: "Account created successfully. Welcome to iGen!" });
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
      console.error("Google Login Error:", error);
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: `Code: ${error.code} - ${error.message}`
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleClaimAndVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || !apiKey) return;

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (user) {
        const uRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(uRef, {
          hasClaimedCredits: true,
          apiKey: apiKey,
          updatedAt: new Date().toISOString()
        });
        toast({ title: t.paymentSuccess, description: "iGen AI active." });
      }
    }, 2000);
  };

  const handleUpdateApiKey = () => {
    if (!tempApiKey || !user) return;
    const uRef = doc(db, 'users', user.uid);
    updateDocumentNonBlocking(uRef, {
      apiKey: tempApiKey,
      updatedAt: new Date().toISOString()
    });
    setIsEditingApiKey(false);
    toast({ title: t.paymentSuccess, description: "Mã iGen đã được cập nhật." });
  };

  if (isUserLoading || (user && (isUserDataLoading || userData === undefined))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const maskApiKey = (key?: string) => key ? `••••${key.slice(-4)}` : '••••••••';

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      {currentScreen !== 'AUTH' && (
        <header className="fixed top-0 left-0 w-full z-50 glass h-20 px-8 flex items-center justify-between border-b border-slate-200/50">
          <IGenBranding className="text-2xl" withTagline={true} />
          
          <div className="flex items-center gap-4 md:gap-6">
            {(userData?.hasClaimedCredits && userData?.apiKey) && (
              <div className="hidden sm:flex items-center gap-2 bg-white text-slate-900 px-4 py-1.5 rounded-full shadow-lg border border-slate-100 animate-in slide-in-from-right-4">
                <Wallet className="w-4 h-4 text-cyan-500" />
                <span className="text-sm font-bold tracking-tight">$300.00</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full hover:bg-slate-100 transition-colors">
                    <Globe className="w-5 h-5 text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2 shadow-2xl border-slate-100">
                  <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {lang === 'VI' ? 'Ngôn ngữ' : lang === 'EN' ? 'Language' : '语言'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setLang('VI')} className={cn("rounded-xl cursor-pointer p-3", lang === 'VI' && "bg-slate-50 font-bold text-cyan-600")}>
                    Tiếng Việt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang('EN')} className={cn("rounded-xl cursor-pointer p-3", lang === 'EN' && "bg-slate-50 font-bold text-cyan-600")}>
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang('ZH')} className={cn("rounded-xl cursor-pointer p-3", lang === 'ZH' && "bg-slate-50 font-bold text-cyan-600")}>
                    中文
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer group">
                    <Avatar className="w-10 h-10 border-2 border-white shadow-md group-hover:border-cyan-400 transition-colors">
                      <AvatarImage src={user?.photoURL || undefined} referrerPolicy="no-referrer" />
                      <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold">
                        {user?.email?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-cyan-500" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl border-slate-100">
                  <DropdownMenuLabel className="p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.roleUser}</p>
                    <p className="text-sm font-bold truncate text-slate-900">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="p-2 space-y-1">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                      <span className="text-xs font-medium text-slate-600">Credits</span>
                      <span className="text-xs font-bold text-slate-900">
                        {userData?.hasClaimedCredits && userData?.apiKey ? '$300.00' : '$0.00'}
                      </span>
                    </div>
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault();
                        setTempApiKey('');
                        setTimeout(() => setIsEditingApiKey(true), 150);
                      }}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 cursor-pointer transition-colors group/key border-none hover:bg-slate-50 focus:bg-slate-50"
                    >
                      <span className="text-xs font-medium text-slate-600 flex items-center gap-2">
                        {lang === 'VI' ? (
                          <>Mã <span className="text-cyan-500 font-bold">iGen</span></>
                        ) : lang === 'EN' ? (
                          <><span className="text-cyan-500 font-bold">iGen</span> Code</>
                        ) : (
                          <><span className="text-cyan-500 font-bold">iGen</span> 代码</>
                        )}
                        <Edit className="w-3 h-3 text-slate-300 group-hover/key:text-cyan-500 transition-colors" />
                      </span>
                      <span className="text-[10px] font-mono font-bold text-cyan-600">{maskApiKey(userData?.apiKey)}</span>
                    </DropdownMenuItem>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => auth.signOut()} className="p-3 rounded-xl text-red-500 font-bold gap-3 cursor-pointer">
                    <LogOut className="w-4 h-4" /> {lang === 'VI' ? 'Đăng xuất' : lang === 'EN' ? 'Logout' : '登出'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
      )}

      <Dialog 
        open={isEditingApiKey} 
        onOpenChange={(open) => {
          setIsEditingApiKey(open);
        }}
      >
        <DialogContent className="max-w-md rounded-3xl" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{t.editApiKey}</DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">{t.paymentSubtitle}</div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder={t.apiKeyPlaceholder}
              className="h-12 rounded-xl"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsEditingApiKey(false)}>{t.cancel}</Button>
              <Button onClick={handleUpdateApiKey} className="bg-slate-900 text-white rounded-xl px-6">{t.saveChanges}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className={`w-full h-full ${currentScreen !== 'AUTH' ? 'pt-28 px-4 md:px-8 pb-12' : ''}`}>
        {currentScreen === 'AUTH' && (
          <div className="flex items-center justify-center min-h-screen p-4 pt-20">
            <div className="glass w-full max-w-md p-8 rounded-[2.5rem] relative mt-8 sm:mt-0">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white p-4 rounded-3xl shadow-2xl border border-slate-100 ring-8 ring-slate-50/50">
                <IGenBranding className="text-xl sm:text-3xl" withTagline={true} />
              </div>
              <div className="mt-12 text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{isSignUp ? t.signUpTitle : t.loginTitle}</h1>
                <p className="text-slate-500 text-sm">{isSignUp ? t.signUpSubtitle : t.loginSubtitle}</p>
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
                  {isAuthenticating ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isSignUp ? t.signUpButton : t.loginButton)}
                </Button>
              </form>
              <div className="mt-6 text-center">
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-xs font-bold text-cyan-600 hover:underline">
                  {isSignUp ? t.hasAccount : t.noAccount}
                </button>
              </div>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">{t.orDivider}</span></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button disabled={isAuthenticating} onClick={handleGoogleLogin} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <GoogleLogo />
                  </div>
                  Gmail
                </Button>
                <Button onClick={() => toast({ title: "Coming Soon" })} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold">
                  <Smartphone className="w-4 h-4" /> Phone
                </Button>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex justify-center">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="link" className="text-xs text-slate-400 gap-2 hover:text-cyan-600">
                      <Info className="w-3.5 h-3.5" /> Khắc phục lỗi đăng nhập
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-cyan-500" /> Khắc phục lỗi đăng nhập
                      </DialogTitle>
                      <DialogDescription asChild>
                        <div className="pt-4 text-slate-600 text-left space-y-4">
                          <div className="font-bold text-slate-900">Nếu bạn dùng Safari trên Mac/iPhone:</div>
                          <ol className="list-decimal pl-4 space-y-2 text-sm">
                            <li>Vào <b>Cài đặt Safari</b> (Settings).</li>
                            <li>Chọn tab <b>Bảo mật</b> (Privacy).</li>
                            <li><b>BỎ CHỌN</b> mục "Ngăn chặn theo dõi chéo trang" (Prevent Cross-Site Tracking).</li>
                          </ol>
                          <div className="text-sm font-bold text-cyan-600 bg-cyan-50 p-3 rounded-xl">
                            Mẹo: Gắn Domain riêng cho Web App sẽ khắc phục triệt để lỗi này.
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'CREDIT_CLAIM' && (
          <div className="flex items-center justify-center min-h-[80vh] animate-in zoom-in-95 duration-500">
            <div className="glass w-full max-w-2xl p-10 md:p-16 rounded-[3rem] text-center relative">
              <div className="flex flex-col items-center gap-6 mb-12 p-8 bg-white/80 backdrop-blur-2xl rounded-[3rem] border-2 border-white shadow-2xl shadow-cyan-500/10 max-w-xl mx-auto transition-all duration-700 hover:scale-[1.02] hover:shadow-cyan-500/20">
                <div className="flex items-center justify-center gap-8">
                  <IGenBranding className="text-5xl" />
                  <div className="h-12 w-[1.5px] bg-slate-200" />
                  <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 flex items-center justify-center">
                    <GoogleLogo />
                  </div>
                </div>
                <div className="bg-slate-50 px-6 py-2 rounded-full border border-slate-100 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Đối tác chiến lược</span>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full shadow-sm">
                    <GoogleLogo />
                    <span className="font-google text-sm font-bold">Google</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  <span className="font-google block">
                    {lang === 'VI' ? (
                      <>Chương trình hợp tác cùng <ColoredGoogleText /></>
                    ) : lang === 'EN' ? (
                      <>Collaboration program with <ColoredGoogleText /></>
                    ) : (
                      <>与 <ColoredGoogleText /> 的合作项目</>
                    )}
                  </span>
                </h2>
                <p className="text-slate-500 text-xs md:text-sm font-normal leading-relaxed max-w-lg mx-auto">
                  {lang === 'VI' ? (
                    <>Vui lòng nhập Mã đối tác của bạn để kích hoạt <span className="text-cyan-500 font-bold">iGen AI</span></>
                  ) : lang === 'EN' ? (
                    <>Please enter your Partner Code to activate <span className="text-cyan-500 font-bold">iGen AI</span></>
                  ) : (
                    <>请输入您的合作伙伴代码以激活 <span className="text-cyan-500 font-bold">iGen AI</span></>
                  )}
                </p>
              </div>
              
              <div className="space-y-4 max-w-sm mx-auto mb-10">
                <div className="relative">
                  <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500 z-10" />
                  <Input 
                    className="h-14 pl-10 bg-white/60 border-slate-200 rounded-xl focus-visible:ring-cyan-500 shadow-sm text-lg font-mono relative z-0"
                    value={apiKey}
                    placeholder={t.apiKeyPlaceholder}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-md mx-auto">
                <Button 
                  onClick={handleClaimAndVerify}
                  className={cn(
                    "h-16 px-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-lg font-bold shadow-xl transition-all hover:scale-105 active:scale-95 orb-glow flex items-center gap-3",
                    isVerifying ? "opacity-60 cursor-not-allowed" : ""
                  )}
                >
                  {isVerifying ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                  ) : (
                    <>
                      <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center p-1.5 shadow-sm">
                        <GoogleLogo />
                      </div>
                      <span>{t.claimButton}</span>
                    </>
                  )}
                </Button>
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
              onOpenFeature={(id) => { setSelectedFeature(id); setCurrentScreen('FEATURE_DETAIL'); }} 
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

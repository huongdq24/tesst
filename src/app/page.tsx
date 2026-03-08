
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
  Edit,
  ExternalLink,
  RefreshCw,
  Users,
  ShieldCheck,
  LayoutDashboard,
  Search,
  Calendar,
  Key
} from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import { setDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection, query, orderBy } from 'firebase/firestore';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getRealtimeCredits } from '@/app/actions/billing';

type Screen = 'AUTH' | 'CREDIT_CLAIM' | 'DASHBOARD' | 'FEATURE_DETAIL' | 'ADMIN_PANEL';

const ADMIN_EMAIL = 'igen-architect@admin.com';
const ADMIN_AI_KEY = process.env.NEXT_PUBLIC_ADMIN_AI_KEY || 'ADMIN_SYSTEM_KEY';

const GOOGLE_BILLING_URL = "https://console.cloud.google.com/billing/017D0B-3695DA-8D7FB7/credits/all?authuser=3&chat=true&hl=en-US&organizationId=501548273108&project=project-5306ce34-5626-488a-913";

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
  const [apiKey, setApiKey] = useState('');
  
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  
  const [realtimeCredits, setRealtimeCredits] = useState<string>('300.00');
  const [isRefreshingCredits, setIsRefreshingCredits] = useState(false);

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const usersCollectionRef = useMemoFirebase(() => {
    if (userData?.role === 'admin') return collection(db, 'users');
    return null;
  }, [db, userData]);
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection(usersCollectionRef);
  const [searchTerm, setSearchTerm] = useState('');

  // Fix freezing pointer events issue when closing dialogs
  useEffect(() => {
    if (!isEditingApiKey) {
      const timer = setTimeout(() => {
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditingApiKey]);

  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (isUserDataLoading || userData === undefined) return;

      if (userData) {
        // Strict Admin Enforcement: Only igen-architect@admin.com can be an admin
        if (user.email === ADMIN_EMAIL && userData.role !== 'admin') {
          const uRef = doc(db, 'users', user.uid);
          updateDocumentNonBlocking(uRef, {
            role: 'admin',
            apiKey: ADMIN_AI_KEY,
            hasClaimedCredits: true,
            updatedAt: new Date().toISOString()
          });
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

  const refreshCredits = async () => {
    setIsRefreshingCredits(true);
    try {
      const result = await getRealtimeCredits();
      if (result.success && result.credits) {
        setRealtimeCredits(result.credits);
        toast({
          title: "Đồng bộ thành công",
          description: `Số dư hiện tại: $${result.credits} (Cập nhật từ Google Cloud API)`
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi đồng bộ",
        description: "Không thể kết nối với Google Cloud Billing API."
      });
    } finally {
      setIsRefreshingCredits(false);
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

  const handleUpdateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey || !user) return;
    
    const uRef = doc(db, 'users', user.uid);
    updateDocumentNonBlocking(uRef, {
      apiKey: tempApiKey,
      updatedAt: new Date().toISOString()
    });
    
    setIsEditingApiKey(false);
    toast({
      title: t.paymentSuccess,
      description: "API Key updated successfully."
    });
  };

  if (isUserLoading || (user && (isUserDataLoading || userData === undefined))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const maskApiKey = (key?: string) => key ? `••••${key.slice(-4)}` : '••••••••';

  const filteredUsers = allUsers?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      {currentScreen !== 'AUTH' && (
        <header className="fixed top-0 left-0 w-full z-50 glass h-20 border-b border-slate-200/50">
          <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <IGenBranding className="text-xl md:text-2xl" withTagline={true} />
              
              {/* Only show Admin Switcher if account is the system admin email */}
              {user?.email === ADMIN_EMAIL && userData?.role === 'admin' && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                  <Button 
                    variant={currentScreen !== 'ADMIN_PANEL' ? 'default' : 'ghost'} 
                    onClick={() => setCurrentScreen('DASHBOARD')}
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all", 
                      (currentScreen !== 'ADMIN_PANEL') ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
                    title={t.rendering}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={currentScreen === 'ADMIN_PANEL' ? 'default' : 'ghost'} 
                    onClick={() => setCurrentScreen('ADMIN_PANEL')}
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all", 
                      currentScreen === 'ADMIN_PANEL' ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
                    title={t.adminPanel}
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              {(userData?.hasClaimedCredits && userData?.apiKey) && (
                <div className="hidden sm:flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={refreshCredits}
                    className="w-8 h-8 rounded-full text-slate-400 hover:text-cyan-500 hover:bg-cyan-50"
                    disabled={isRefreshingCredits}
                  >
                    <RefreshCw className={cn("w-4 h-4", isRefreshingCredits && "animate-spin")} />
                  </Button>
                  <a 
                    href={GOOGLE_BILLING_URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-white text-slate-900 px-3 md:px-4 py-1.5 rounded-full shadow-lg border border-slate-100 hover:border-cyan-300 transition-all group"
                  >
                    <Wallet className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      ${realtimeCredits}
                      <ExternalLink className="w-3 h-3 text-slate-300" />
                    </span>
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-9 h-9 md:w-10 md:h-10 rounded-full hover:bg-slate-100 transition-colors">
                      <Globe className="w-5 h-5 text-slate-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2 shadow-2xl border-slate-100">
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
                    <div className="flex items-center gap-2 md:gap-3 cursor-pointer group">
                      <Avatar className="w-9 h-9 md:w-10 md:h-10 border-2 border-white shadow-md group-hover:border-cyan-400 transition-colors">
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
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userData?.role === 'admin' ? t.roleAdmin : t.roleUser}</p>
                      <p className="text-sm font-bold truncate text-slate-900">{user?.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {user?.email === ADMIN_EMAIL && userData?.role === 'admin' && (
                      <>
                        <DropdownMenuItem 
                          onClick={() => setCurrentScreen('ADMIN_PANEL')}
                          className="p-3 rounded-xl font-bold gap-3 cursor-pointer text-cyan-600 hover:bg-cyan-50"
                        >
                          <ShieldCheck className="w-4 h-4" /> {t.adminPanel}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <div className="p-2 space-y-1">
                      <div className="flex flex-col gap-1">
                        <Button 
                          variant="ghost" 
                          onClick={refreshCredits}
                          disabled={isRefreshingCredits}
                          className="w-full justify-start text-[10px] h-8 gap-2 text-slate-500 hover:text-cyan-600"
                        >
                          <RefreshCw className={cn("w-3 h-3", isRefreshingCredits && "animate-spin")} />
                          {t.syncCloud}
                        </Button>
                        <a 
                          href={GOOGLE_BILLING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-cyan-50 transition-colors group/item"
                        >
                          <span className="text-xs font-medium text-slate-600">Credits (Real-time)</span>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover/item:text-cyan-600">
                            ${realtimeCredits}
                            <ExternalLink className="w-3 h-3" />
                          </span>
                        </a>
                        
                        <Dialog open={isEditingApiKey} onOpenChange={setIsEditingApiKey}>
                          <DropdownMenuItem 
                            onSelect={(e) => {
                              e.preventDefault();
                              setTempApiKey(userData?.apiKey || '');
                              setIsEditingApiKey(true);
                            }}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group/key focus:bg-slate-100"
                          >
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{t.apiKeyLabel}</span>
                              <span className="text-xs font-mono font-bold text-cyan-600">{maskApiKey(userData?.apiKey)}</span>
                            </div>
                            <Edit className="w-3 h-3 text-slate-300 group-hover/key:text-cyan-500" />
                          </DropdownMenuItem>
                          <DialogContent className="rounded-[2rem] sm:max-w-md border-none shadow-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-bold">{t.editApiKey}</DialogTitle>
                              <DialogDescription>{t.paymentSubtitle}</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdateApiKey} className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-400">{t.apiKeyLabel}</Label>
                                <Input 
                                  value={tempApiKey}
                                  onChange={(e) => setTempApiKey(e.target.value)}
                                  className="h-12 bg-slate-50 border-none rounded-xl font-mono"
                                  placeholder={t.apiKeyPlaceholder}
                                />
                              </div>
                              <div className="flex gap-3 pt-2">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  onClick={() => setIsEditingApiKey(false)}
                                  className="flex-1 h-12 rounded-xl font-bold"
                                >
                                  {t.cancel}
                                </Button>
                                <Button 
                                  type="submit" 
                                  className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold shadow-lg"
                                >
                                  {t.saveChanges}
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => auth.signOut()} className="p-3 rounded-xl text-red-500 font-bold gap-3 cursor-pointer">
                      <LogOut className="w-4 h-4" /> Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>
      )}

      <div className={`w-full h-full ${currentScreen !== 'AUTH' ? 'pt-28 px-4 md:px-8 pb-12' : ''}`}>
        {currentScreen === 'AUTH' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass w-full max-w-md p-10 rounded-[2.5rem] relative text-center shadow-2xl">
              <h1 className="text-3xl font-bold tracking-tight mb-4">
                <span className="text-cyan-500">iGen</span> - Trợ lý AI cho Kiến trúc sư
              </h1>
              
              <div className="flex items-center justify-center gap-4 mb-8 text-xs font-bold text-slate-400 bg-slate-50/50 w-fit mx-auto px-4 py-2 rounded-full border border-slate-100">
                <button onClick={() => setLang('VI')} className={cn("hover:text-cyan-500 transition-colors px-2", lang === 'VI' && "text-cyan-600 bg-white shadow-sm rounded-full py-0.5")}>VI</button>
                <div className="w-px h-3 bg-slate-200" />
                <button onClick={() => setLang('EN')} className={cn("hover:text-cyan-500 transition-colors px-2", lang === 'EN' && "text-cyan-600 bg-white shadow-sm rounded-full py-0.5")}>EN</button>
                <div className="w-px h-3 bg-slate-200" />
                <button onClick={() => setLang('ZH')} className={cn("hover:text-cyan-500 transition-colors px-2", lang === 'ZH' && "text-cyan-600 bg-white shadow-sm rounded-full py-0.5")}>ZH</button>
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
                  {isAuthenticating ? <RefreshCw className="w-5 h-5 animate-spin" /> : (isSignUp ? t.signUpButton : t.loginButton)}
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

              <div className="relative mt-10 mb-6">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t.orDivider}</span>
                </div>
              </div>

              <div className="mt-4">
                <Button 
                  disabled={isAuthenticating} 
                  onClick={handleGoogleLogin} 
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-slate-200 shadow-sm hover:shadow-md hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <GoogleLogo />
                  <span className="text-xs font-bold text-slate-600">
                    {lang === 'VI' ? 'Tiếp tục với ' : 'Continue with '}
                    <ColoredGoogleText />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'CREDIT_CLAIM' && (
          <div className="flex items-center justify-center min-[80vh]">
            <div className="glass w-full max-w-2xl p-10 rounded-[3rem] text-center shadow-2xl">
              <h2 className="text-3xl font-bold mb-6">Kích hoạt iGen AI</h2>
              <Input 
                className="h-14 mb-4 text-center text-xl font-mono border-2 border-slate-100 focus:border-cyan-500 transition-colors"
                value={apiKey}
                placeholder="Nhập mã đối tác của bạn..."
                onChange={(e) => setApiKey(e.target.value)}
              />
              
              <div className="mb-8 p-6 bg-blue-50/50 rounded-2xl text-left flex gap-4 border border-blue-100">
                <div className="bg-blue-100 p-3 h-fit rounded-xl shadow-sm"><Info className="w-6 h-6 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-bold text-blue-900 mb-1">Quy tắc credits từ Google:</p>
                  <ul className="text-xs text-blue-800/80 space-y-1 list-disc pl-4">
                    <li>Free trial $300 áp dụng cho tài khoản Gmail mới đăng ký Google Cloud.</li>
                    <li>Credits dùng chung cho mọi Project trong tài khoản Gmail đó.</li>
                    <li>Tài khoản cần có thẻ Visa/Mastercard để định danh (không bị trừ tiền).</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={handleClaimAndVerify}
                className="h-16 px-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-transform"
              >
                {isVerifying ? <RefreshCw className="w-6 h-6 animate-spin" /> : "Kích hoạt & Đồng bộ Google Billing"}
              </Button>
            </div>
          </div>
        )}

        {currentScreen === 'DASHBOARD' && (
          <div className="max-w-7xl mx-auto">
            <DashboardGrid 
              lang={lang} 
              onOpenFeature={(id) => { setSelectedFeature(id); setCurrentScreen('FEATURE_DETAIL'); }} 
            />
          </div>
        )}

        {currentScreen === 'ADMIN_PANEL' && (
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-cyan-500" />
                  {t.adminPanel}
                </h2>
                <p className="text-slate-500">{t.userList} • {allUsers?.length || 0} {t.totalUsers}</p>
              </div>
              <div className="flex gap-4">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Tìm kiếm user..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm focus:ring-2 ring-cyan-500/20"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-white shadow-sm text-slate-400 hover:text-cyan-500">
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] overflow-hidden border-none shadow-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold py-6 pl-8 text-slate-500 uppercase tracking-widest text-[10px]">{t.userEmail}</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t.userRole}</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t.apiKeyLabel}</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t.userStatus}</TableHead>
                    <TableHead className="font-bold text-right pr-8 text-slate-500 uppercase tracking-widest text-[10px]">Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAllUsersLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-60 text-center">
                        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers?.length ? (
                    filteredUsers.map((u) => (
                      <TableRow key={u.id} className="hover:bg-slate-50/50 border-slate-100 transition-colors">
                        <TableCell className="py-6 pl-8">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-white shadow-sm">
                              <AvatarFallback className="bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-600 text-xs font-bold">
                                {u.email?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900">{u.email}</span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '---'}
                              </span>
                            </div>
                            {u.email === user?.email && <Badge variant="secondary" className="text-[10px] h-4 bg-cyan-50 text-cyan-600 border-cyan-100">You</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={cn("rounded-lg px-2", u.role === 'admin' ? "bg-slate-900" : "bg-slate-100 text-slate-600 border-none")}>
                            {u.role === 'admin' ? t.roleAdmin : t.roleUser}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 group">
                            <code className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">
                              {u.apiKey ? maskApiKey(u.apiKey) : '---'}
                            </code>
                            {u.apiKey && <Key className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.hasClaimedCredits ? (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 w-fit px-3 py-1 rounded-full border border-emerald-100">
                              <Zap className="w-3 h-3 fill-emerald-600" />
                              {t.active}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 font-medium text-xs bg-slate-50 w-fit px-3 py-1 rounded-full border border-slate-200">
                              <Info className="w-3 h-3" />
                              {t.inactive}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                           <div className="flex flex-col items-end">
                             <span className="text-[10px] font-mono text-slate-400">UID: {u.id.substring(0, 12)}...</span>
                           </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-40 text-center text-slate-400">
                        Không tìm thấy người dùng nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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

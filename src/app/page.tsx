
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { IGenBranding } from '@/components/Branding';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, 
  Wallet, 
  LogOut, 
  ChevronDown, 
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  Search,
  Calendar,
  Key,
  Globe,
  Edit,
  Info
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

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

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

const IGenCodeBranded = () => (
  <span className="font-toyota font-bold">
    <span className="text-cyan-500">iGen</span> Code
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
  const [isSyncing, setIsSyncing] = useState(false);

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const usersCollectionRef = useMemoFirebase(() => {
    if (userData?.role === 'admin' || (user && ADMIN_EMAILS.includes(user.email || ''))) return collection(db, 'users');
    return null;
  }, [db, userData, user]);
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection(usersCollectionRef);
  const [searchTerm, setSearchTerm] = useState('');

  const performBillingSync = useCallback(async () => {
    if (!user || !userData || !userData.hasClaimedCredits || isSyncing) return;
    
    setIsSyncing(true);
    try {
      const result = await getRealtimeCredits();
      if (result.success && result.credits) {
        if (userData.credits !== result.credits) {
          const uRef = doc(db, 'users', user.uid);
          updateDocumentNonBlocking(uRef, {
            credits: result.credits,
            updatedAt: new Date().toISOString()
          });
        }
        
        if (userData.role === 'admin' || ADMIN_EMAILS.includes(user.email || '')) {
          if (allUsers && allUsers.length > 0) {
            allUsers.forEach(u => {
              if (u.credits !== result.credits) {
                const otherURef = doc(db, 'users', u.id);
                updateDocumentNonBlocking(otherURef, {
                  credits: result.credits,
                  updatedAt: new Date().toISOString()
                });
              }
            });
          }
        }
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, userData, db, allUsers, isSyncing]);

  useEffect(() => {
    if (user && userData?.hasClaimedCredits && !isUserDataLoading) {
      performBillingSync();
    }
  }, [user, userData?.hasClaimedCredits, isUserDataLoading, !!allUsers, performBillingSync]);

  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (isUserDataLoading || userData === undefined) return;

      if (userData) {
        if (ADMIN_EMAILS.includes(user.email || '') && userData.role !== 'admin') {
          const uRef = doc(db, 'users', user.uid);
          updateDocumentNonBlocking(uRef, {
            role: 'admin',
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
        const isUserAdmin = ADMIN_EMAILS.includes(user.email || '');
        const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
        
        setDocumentNonBlocking(uRef, {
          id: user.uid,
          email: user.email,
          hasClaimedCredits: isUserAdmin || isGoogleUser,
          apiKey: '',
          role: isUserAdmin ? 'admin' : 'user',
          credits: '300.00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, { merge: true });

        if (isUserAdmin || isGoogleUser) {
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
      description: <div className="flex items-center gap-1"><IGenCodeBranded /> updated successfully.</div>
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
              
              {user && (userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '')) && (
                <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                  <Button 
                    variant={currentScreen !== 'ADMIN_PANEL' ? 'default' : 'ghost'} 
                    onClick={() => setCurrentScreen('DASHBOARD')}
                    className={cn(
                      "h-9 w-9 p-0 rounded-lg transition-all", 
                      (currentScreen !== 'ADMIN_PANEL') ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                    )}
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
                  >
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              {(userData?.hasClaimedCredits && userData?.apiKey) && (
                <div className="hidden sm:flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white text-slate-900 px-3 md:px-4 py-1.5 rounded-full shadow-lg border border-slate-100 hover:border-cyan-300 transition-all group">
                    <Wallet className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                      ${userData?.credits || '300.00'}
                    </span>
                    {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400 ml-1" />}
                  </div>
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
                    
                    {user && (userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '')) && (
                      <>
                        <DropdownMenuItem 
                          onSelect={() => setCurrentScreen('ADMIN_PANEL')}
                          className="p-3 rounded-xl font-bold gap-3 cursor-pointer text-cyan-600 hover:bg-cyan-50"
                        >
                          <ShieldCheck className="w-4 h-4" /> {t.adminPanel}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}

                    <div className="p-2 space-y-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                          <span className="text-xs font-medium text-slate-600">Credits</span>
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                            ${userData?.credits || '300.00'}
                          </span>
                        </div>
                        
                        <DropdownMenuItem 
                          onSelect={(e) => {
                            e.preventDefault();
                            setTimeout(() => {
                              setTempApiKey('');
                              setIsEditingApiKey(true);
                            }, 100);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors group/key focus:bg-slate-100"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight"><IGenCodeBranded /></span>
                            <span className="text-xs font-mono font-bold text-cyan-600">{maskApiKey(userData?.apiKey)}</span>
                          </div>
                          <Edit className="w-3 h-3 text-slate-300 group-hover/key:text-cyan-500" />
                        </DropdownMenuItem>
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
                    Hoặc đăng nhập với <ColoredGoogleText />
                  </span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'CREDIT_CLAIM' && (
          <div className="flex items-center justify-center min-h-[80vh]">
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
                onClick={(e) => {
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
                        credits: '300.00',
                        updatedAt: new Date().toISOString()
                      });
                      toast({ title: t.paymentSuccess, description: "iGen AI active." });
                    }
                  }, 2000);
                }}
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
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-600 border-cyan-100 font-bold px-3 py-1 rounded-full text-xs">
                    {allUsers?.length || 0} {lang === 'VI' ? 'Tổng số người dùng' : 'Total Users'}
                  </Badge>
                  {isSyncing && (
                    <div className="flex items-center gap-2 text-[10px] text-cyan-500 font-bold animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Auto-syncing...
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Tìm kiếm user..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm focus:ring-2 ring-cyan-500/20"
                  />
                </div>
              </div>
            </div>

            <div className="glass-card rounded-[2rem] overflow-hidden border-none shadow-2xl">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent border-slate-100">
                    <TableHead className="font-bold py-6 pl-8 text-slate-500 uppercase tracking-widest text-[10px]">{t.userEmail}</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t.userRole}</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]"><IGenCodeBranded /></TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t.userCredits}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAllUsersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-60 text-center">
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
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <Wallet className="w-3.5 h-3.5 text-cyan-500" />
                            ${u.credits || '300.00'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-40 text-center text-slate-400">
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
            currentCredits={userData?.credits}
            onBack={() => setCurrentScreen('DASHBOARD')} 
          />
        )}
      </div>

      {(currentScreen !== 'AUTH' && currentScreen !== 'CREDIT_CLAIM') && <VoiceAssistantOrb lang={lang} userApiKey={userData?.apiKey} currentCredits={userData?.credits} />}

      <Dialog open={isEditingApiKey} onOpenChange={setIsEditingApiKey}>
        <DialogContent className="rounded-[2rem] sm:max-w-md border-none shadow-2xl z-[160]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <IGenCodeBranded /> {lang === 'VI' ? 'Mới' : 'Update'}
            </DialogTitle>
            <DialogDescription>{t.paymentSubtitle}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateApiKey} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-400"><IGenCodeBranded /></Label>
              <Input 
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="h-12 bg-slate-50 border-none rounded-xl font-mono focus-visible:ring-cyan-500"
                placeholder={t.apiKeyPlaceholder}
                autoFocus
                autoComplete="off"
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
                disabled={!tempApiKey}
                className="flex-1 h-12 bg-slate-900 text-white rounded-xl font-bold shadow-lg"
              >
                {t.saveChanges}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}

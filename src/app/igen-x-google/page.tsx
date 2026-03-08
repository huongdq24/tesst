
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Globe, Wallet, ChevronDown, LogOut, Edit } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { IGenBranding } from '@/components/Branding';
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
import { cn } from "@/lib/utils";
import { Language, translations } from '@/lib/i18n';

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

const DEFAULT_PROJECT_ID = 'gen-lang-client-0683922819';

export default function CreditClaimPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [lang, setLang] = useState<Language>('VI');
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) return;
    if (!user) {
      router.push('/login');
    } else if (userData?.hasClaimedCredits && userData?.apiKey) {
      router.push('/home');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || !apiKey || !user) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const uRef = doc(db, 'users', user.uid);
      updateDocumentNonBlocking(uRef, {
        hasClaimedCredits: true,
        apiKey: apiKey,
        projectId: DEFAULT_PROJECT_ID,
        credits: '300.00',
        updatedAt: new Date().toISOString()
      });
      toast({ 
        title: <div className="flex items-center gap-1"><IGenCodeBranded /> updated.</div>, 
        description: "iGen AI active. Credits synchronized." 
      });
      router.push('/home');
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
      title: <div className="flex items-center gap-1"><IGenCodeBranded /> updated.</div>,
      description: "Settings have been updated."
    });
  };

  const maskApiKey = (key?: string) => key ? `••••${key.slice(-4)}` : '••••••••';

  if (isUserLoading || isUserDataLoading) return null;

  const displayCredits = (userData?.hasClaimedCredits && userData?.apiKey) ? (userData?.credits || '0.00') : '0.00';

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col items-center pt-28 p-4">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      <header className="fixed top-0 left-0 w-full z-50 glass h-20 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <IGenBranding className="text-xl md:text-2xl" withTagline={true} />

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white text-slate-900 px-3 md:px-4 py-1.5 rounded-full shadow-lg border border-slate-100 hover:border-cyan-300 transition-all group">
                <Wallet className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  ${displayCredits}
                </span>
              </div>
            </div>

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
                  
                  <div className="p-2 space-y-1">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50">
                        <span className="text-xs font-medium text-slate-600">Credits</span>
                        <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                          ${displayCredits}
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
                  <DropdownMenuItem onClick={() => { auth.signOut(); router.push('/login'); }} className="p-3 rounded-xl text-red-500 font-bold gap-3 cursor-pointer">
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="glass w-full max-w-xl p-10 rounded-[3rem] text-center shadow-2xl relative z-10">
        <h2 className="text-3xl font-bold mb-2">Chương trình hợp tác cùng <ColoredGoogleText /></h2>
        <p className="text-slate-500 mb-8 font-medium">
          Nhập mã đối tác của <span className="text-cyan-500 font-bold">iGen</span> do <ColoredGoogleText /> cung cấp để nhận $300 Credits
        </p>
        <div className="mb-8">
          <Input 
            className="h-16 text-lg bg-white border-2 border-slate-100 focus:border-cyan-500 transition-colors font-mono rounded-2xl px-6"
            value={apiKey}
            placeholder="Dán mã đối tác của bạn tại đây..."
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        <Button 
          onClick={handleVerify}
          className="mx-auto h-16 px-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-transform flex items-center gap-3"
        >
          {isVerifying ? <RefreshCw className="w-6 h-6 animate-spin" /> : (
            <>
              <div className="bg-white p-1 rounded-full flex items-center justify-center">
                <GoogleLogo />
              </div>
              Xác nhận mã và nhận $300 Credits
            </>
          )}
        </Button>
      </div>

      <Dialog open={isEditingApiKey} onOpenChange={setIsEditingApiKey}>
        <DialogContent className="rounded-[2rem] sm:max-w-md border-none shadow-2xl z-[160]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <IGenCodeBranded /> settings
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

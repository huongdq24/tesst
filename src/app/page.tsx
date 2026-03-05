"use client"

import React, { useState, useEffect } from 'react';
import { IGenBranding } from '@/components/Branding';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Smartphone, LogIn, Globe, CreditCard, Sparkles, User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn, initiateGoogleSignIn } from '@/firebase/non-blocking-login';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Screen = 'AUTH' | 'CREDIT_CLAIM' | 'DASHBOARD' | 'FEATURE_DETAIL';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('AUTH');
  const [lang, setLang] = useState<Language>('VI');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { toast } = useToast();

  const t = translations[lang];

  // Sync screen state with auth state
  useEffect(() => {
    if (!isUserLoading) {
      if (user) {
        if (currentScreen === 'AUTH') {
          setCurrentScreen('CREDIT_CLAIM');
        }
      } else {
        setCurrentScreen('AUTH');
      }
    }
  }, [user, isUserLoading, currentScreen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail && password) {
      initiateEmailSignIn(auth, userEmail, password);
    } else {
      toast({
        variant: "destructive",
        title: t.loginButton,
        description: lang === 'VI' ? "Vui lòng nhập đầy đủ thông tin." : lang === 'EN' ? "Please enter all required information." : "请输入所有必填信息。"
      });
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

  const claimCredits = () => {
    toast({
      title: t.claimSuccess,
      description: <div className="flex items-center gap-1">Available in your <IGenBranding /> Cloud wallet.</div>,
      className: "bg-cyan-500 text-white font-bold border-none"
    });
    setCurrentScreen('DASHBOARD');
  };

  if (isUserLoading) {
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

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      {/* Navigation Header */}
      {currentScreen !== 'AUTH' && (
        <header className="fixed top-0 left-0 w-full z-50 glass h-20 px-8 flex items-center justify-between border-b border-slate-200/50">
          <div className="flex items-center gap-2">
            <IGenBranding className="text-2xl" />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <UserIcon className="w-3 h-3" />
              {user?.email?.includes('admin') ? t.roleAdmin : t.roleUser}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full gap-2 border-slate-200"
                >
                  <Globe className="w-4 h-4" />
                  {getLanguageLabel(lang)}
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-slate-100">
                <DropdownMenuItem onClick={() => setLang('VI')} className="font-medium cursor-pointer">Tiếng Việt</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang('EN')} className="font-medium cursor-pointer">English</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLang('ZH')} className="font-medium cursor-pointer">中文</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {currentScreen === 'DASHBOARD' && (
              <Button variant="ghost" size="sm" onClick={() => auth.signOut()} className="rounded-full text-slate-500">
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>
        </header>
      )}

      {/* Screen Routing */}
      <div className={`w-full h-full ${currentScreen !== 'AUTH' ? 'pt-28 px-4 md:px-8 pb-12' : ''}`}>
        
        {/* AUTH SCREEN */}
        {currentScreen === 'AUTH' && (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="glass w-full max-w-md p-8 rounded-[2.5rem] relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                <IGenBranding className="text-3xl" />
              </div>
              
              <div className="mt-8 text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight mb-2">{t.loginTitle}</h1>
                <p className="text-slate-500 text-sm">{t.loginSubtitle}</p>
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

              <form onSubmit={handleLogin} className="space-y-4">
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

                <Button className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-md mt-4 shadow-lg group">
                  {t.loginButton} <LogIn className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">{t.orDivider}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleGoogleLogin} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold hover:bg-cyan-50 hover:border-cyan-200 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.25.81-.59z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {t.gmail}
                </Button>
                <Button onClick={handlePhoneLogin} variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold hover:bg-cyan-50 hover:border-cyan-200 transition-colors">
                  <Smartphone className="w-4 h-4 text-cyan-600" /> {t.phone}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* CREDIT CLAIM SCREEN */}
        {currentScreen === 'CREDIT_CLAIM' && (
          <div className="flex items-center justify-center min-h-[80vh] animate-in zoom-in-95 duration-500">
            <div className="glass w-full max-w-2xl p-10 md:p-16 rounded-[3rem] text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                <Sparkles className="w-40 h-40 text-cyan-500" />
              </div>
              <div className="mb-8 inline-flex p-4 bg-cyan-50 rounded-3xl text-cyan-500">
                <CreditCard className="w-12 h-12" />
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-4 text-slate-900">{t.claimTitle}</h2>
              <p className="text-slate-500 text-lg mb-12 max-w-md mx-auto">{t.claimDesc}</p>
              
              <Button 
                onClick={claimCredits}
                className="h-16 px-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full text-xl font-bold shadow-xl orb-glow transform transition-all active:scale-95"
              >
                {t.claimButton}
              </Button>
            </div>
          </div>
        )}

        {/* DASHBOARD SCREEN */}
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

        {/* FEATURE DETAIL SCREEN */}
        {currentScreen === 'FEATURE_DETAIL' && (
          <FeatureWorkspace 
            featureId={selectedFeature!} 
            lang={lang} 
            onBack={() => setCurrentScreen('DASHBOARD')} 
          />
        )}

      </div>

      {/* Voice Assistant Orb */}
      {currentScreen !== 'AUTH' && <VoiceAssistantOrb lang={lang} />}
    </main>
  );
}

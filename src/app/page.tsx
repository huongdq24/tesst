"use client"

import React, { useState, useEffect } from 'react';
import { IGenBranding } from '@/components/Branding';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Mail, Smartphone, Github, LogIn, Globe, CreditCard, Sparkles, User as UserIcon, LogOut } from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';

type Screen = 'AUTH' | 'CREDIT_CLAIM' | 'DASHBOARD' | 'FEATURE_DETAIL';
type Role = 'Admin' | 'User';

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('AUTH');
  const [lang, setLang] = useState<Language>('VI');
  const [role, setRole] = useState<Role>('User');
  const [userEmail, setUserEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { toast } = useToast();

  const t = translations[lang];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userEmail === 'igen-architect@admin.com' && password === '123456') {
      setRole('Admin');
      setCurrentScreen('CREDIT_CLAIM');
    } else if (userEmail && password) {
      setRole('User');
      setCurrentScreen('CREDIT_CLAIM');
    } else {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Please enter valid credentials."
      });
    }
  };

  const claimCredits = () => {
    toast({
      title: t.claimSuccess,
      description: "Available in your iGen Cloud wallet.",
      className: "bg-cyan-500 text-white font-bold border-none"
    });
    setCurrentScreen('DASHBOARD');
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
              {role === 'Admin' ? t.roleAdmin : t.roleUser}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full gap-2 border-slate-200"
              onClick={() => setLang(lang === 'VI' ? 'EN' : 'VI')}
            >
              <Globe className="w-4 h-4" />
              {lang}
            </Button>

            {currentScreen === 'DASHBOARD' && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentScreen('AUTH')} className="rounded-full text-slate-500">
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
                  <Button variant="outline" size="sm" className="rounded-full text-[10px] font-bold h-7 border-cyan-200 text-cyan-600 bg-cyan-50/50" onClick={() => setLang(lang === 'VI' ? 'EN' : 'VI')}>
                    {lang === 'VI' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
                  </Button>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">{t.email}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="email" 
                      placeholder="igen-architect@admin.com" 
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
                    placeholder="123456" 
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
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold">Or</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold">
                  <Github className="w-4 h-4" /> Google
                </Button>
                <Button variant="outline" className="h-12 rounded-xl border-slate-200 gap-2 font-semibold">
                  <Smartphone className="w-4 h-4" /> Phone
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

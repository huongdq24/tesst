"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { IGenBranding } from '@/components/Branding';
import { Language, translations } from '@/lib/i18n';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  LogOut, 
  ChevronDown, 
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  Layers,
  Settings,
  Key,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection } from 'firebase/firestore';
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
import { getRealtimeCredits } from '@/app/actions/billing';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [lang, setLang] = useState<Language>('VI');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isEditingApiKey, setIsEditingApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);
  const [billingSummary, setBillingSummary] = useState<any[]>([]);
  const syncLock = useRef(false);

  const t = translations[lang];

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  const usersCollectionRef = useMemoFirebase(() => {
    if (user && (userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || ''))) {
      return collection(db, 'users');
    }
    return null;
  }, [db, userData, user]);
  const { data: allUsers } = useCollection(usersCollectionRef);

  const performBillingSync = useCallback(async () => {
    if (!user || syncLock.current) return;
    
    syncLock.current = true;
    setIsSyncing(true);
    
    console.log("[Client] Đang yêu cầu đồng bộ Credits Động (Service Account)...");
    
    try {
      const result = await getRealtimeCredits();
      
      if (result.success) {
        const latestCredits = String(result.credits);
        const selfRef = doc(db, 'users', user.uid);
        
        updateDocumentNonBlocking(selfRef, {
          credits: latestCredits,
          updatedAt: new Date().toISOString()
        });
        
        // Master Sync cho Admin
        const isAdminUser = userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '');
        if (isAdminUser && allUsers) {
          allUsers.forEach(u => {
            updateDocumentNonBlocking(doc(db, 'users', u.id), {
              credits: latestCredits,
              updatedAt: new Date().toISOString()
            });
          });
          if (result.summary) setBillingSummary(result.summary);
        }
        
        if (result.foundCredits) {
          toast({ title: "Đồng bộ thành công", description: `Hệ thống đã nhận diện Credits: $${latestCredits}` });
        }
      } else {
        console.error("[Client] Lỗi Server Action:", result.error);
      }
    } catch (error) {
      console.error("[Client] Sync error:", error);
    } finally {
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [user, userData, db, allUsers, toast]);

  useEffect(() => {
    if (user && userData?.hasClaimedCredits && !isUserDataLoading) {
      performBillingSync();
    }
  }, [user, userData?.hasClaimedCredits, isUserDataLoading, performBillingSync]);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) return;
    if (!user) {
      router.push('/login');
    } else {
      const isAdmin = userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '');
      if (isAdmin) return;
      if (!userData?.hasClaimedCredits) router.push('/igen-x-google');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  const handleUpdateApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey || !user) return;
    
    updateDocumentNonBlocking(doc(db, 'users', user.uid), { 
      apiKey: tempApiKey, 
      updatedAt: new Date().toISOString() 
    });

    setIsEditingApiKey(false);
    toast({ title: "Đã lưu", description: "Đang đồng bộ lại số dư hệ thống..." });
    performBillingSync();
  };

  if (isUserLoading || isUserDataLoading || !user) return null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 pt-28 px-4 md:px-8 pb-12">
      <header className="fixed top-0 left-0 w-full z-50 glass h-20 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IGenBranding className="text-xl md:text-2xl" withTagline={true} />
            {user && (userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '')) && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <Button variant={!isAdminView ? 'default' : 'ghost'} onClick={() => setIsAdminView(false)} className="h-9 w-9 p-0"><LayoutDashboard className="w-4 h-4" /></Button>
                <Button variant={isAdminView ? 'default' : 'ghost'} onClick={() => setIsAdminView(true)} className="h-9 w-9 p-0"><ShieldCheck className="w-4 h-4 text-cyan-400" /></Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors" onClick={performBillingSync}>
              <Wallet className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold text-slate-900">${userData?.credits || '0.00'}</span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400 ml-1" />}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-md group-hover:border-cyan-400 transition-all">
                    <AvatarImage src={user?.photoURL || undefined} referrerPolicy="no-referrer" />
                    <AvatarFallback className="bg-cyan-500 text-white font-bold">{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl">
                <DropdownMenuLabel className="p-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">{userData?.role === 'admin' ? t.roleAdmin : t.roleUser}</p>
                  <p className="text-sm font-bold truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { setTempApiKey(userData?.apiKey || ''); setIsEditingApiKey(true); }} className="p-3 rounded-xl gap-3 cursor-pointer">
                  <Settings className="w-4 h-4 text-slate-400" /> {t.editApiKey}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { auth.signOut(); router.push('/login'); }} className="p-3 rounded-xl text-red-500 font-bold gap-3 cursor-pointer">
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto">
        {selectedFeature ? (
          <FeatureWorkspace featureId={selectedFeature} lang={lang} userApiKey={userData?.apiKey} onBack={() => setSelectedFeature(null)} />
        ) : isAdminView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <h2 className="text-3xl font-bold flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-cyan-500" /> {t.adminPanel}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="glass-card rounded-[2rem] overflow-hidden bg-white shadow-2xl border border-slate-100">
                  <Table>
                    <TableHeader className="bg-slate-50/50"><TableRow><TableHead className="py-6 pl-8">EMAIL</TableHead><TableHead>VAI TRÒ</TableHead><TableHead className="text-right pr-8">SỐ DƯ CREDITS</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {allUsers?.map((u) => (
                        <TableRow key={u.id} className="border-slate-100">
                          <TableCell className="py-6 pl-8 font-bold">{u.email}</TableCell>
                          <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role === 'admin' ? 'Admin' : 'User'}</Badge></TableCell>
                          <TableCell className="text-right pr-8 font-bold">${u.credits || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="glass-card rounded-[2rem] p-6 bg-white shadow-2xl border border-slate-100">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-6"><Layers className="w-5 h-5 text-cyan-500" /> Billing Infrastructure</h3>
                  <div className="space-y-4">
                    {billingSummary.map((acc, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <p className="text-xs font-bold text-slate-900">{acc.accountName}</p>
                        {acc.projects.map((p: any, pIdx: number) => (
                          <div key={pIdx} className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate max-w-[120px]">{p.id}</span>
                            <Badge className="h-4 text-[8px]" variant={p.enabled ? "default" : "destructive"}>
                              {p.enabled ? "Active" : "Disabled"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DashboardGrid lang={lang} onOpenFeature={setSelectedFeature} />
        )}
      </div>

      <VoiceAssistantOrb lang={lang} userApiKey={userData?.apiKey} />

      <Dialog open={isEditingApiKey} onOpenChange={setIsEditingApiKey}>
        <DialogContent className="rounded-[2.5rem] p-8 max-w-md border-none shadow-2xl bg-white">
          <DialogHeader><DialogTitle className="text-2xl font-bold flex items-center gap-2 text-slate-900"><Settings className="w-6 h-6 text-cyan-500" /> {t.editApiKey}</DialogTitle></DialogHeader>
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Tín dụng hệ thống (Service Account)</p>
              <p className="text-2xl font-bold text-slate-900">${userData?.credits || '0.00'}</p>
            </div>
            <form onSubmit={handleUpdateApiKey} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                  <Key className="w-3 h-3" /> {t.apiKeyLabel}
                </Label>
                <div className="relative">
                  <Input 
                    type={showApiKey ? 'text' : 'password'} 
                    value={tempApiKey} 
                    onChange={(e) => setTempApiKey(e.target.value)} 
                    className="h-14 rounded-2xl pr-12 font-mono bg-slate-50 border-none focus-visible:ring-cyan-500" 
                    placeholder={t.apiKeyPlaceholder}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowApiKey(!showApiKey)} 
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl hover:bg-slate-200"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditingApiKey(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-500">{t.cancel}</Button>
                <Button type="submit" className="flex-1 h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg transition-all">{t.saveChanges}</Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

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
  Search,
  Layers,
  Settings,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';
import { VoiceAssistantOrb } from '@/components/VoiceAssistantOrb';
import { DashboardGrid } from '@/components/DashboardGrid';
import { FeatureWorkspace } from '@/components/FeatureWorkspace';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc, collection } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
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
import { getRealtimeCredits, listAllBillingProjects } from '@/app/actions/billing';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [billingProjects, setBillingProjects] = useState<any[]>([]);
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

  /**
   * ĐỒNG BỘ THEO SỰ KIỆN: Kích hoạt khi vào trang hoặc hành động AI.
   */
  const performBillingSync = useCallback(async () => {
    if (!user || !userData || !userData.hasClaimedCredits || syncLock.current) return;
    
    syncLock.current = true;
    setIsSyncing(true);
    
    try {
      // Gọi Discovery Sync: Quét toàn bộ Credits mà SA có quyền
      const result = await getRealtimeCredits();
      const latestCredits = result.success ? String(result.credits) : '0.00';
      const isAdminUser = userData.role === 'admin' || ADMIN_EMAILS.includes(user.email || '');
      
      // 1. Cập nhật cho chính mình
      const selfRef = doc(db, 'users', user.uid);
      updateDocumentNonBlocking(selfRef, {
        credits: latestCredits,
        updatedAt: new Date().toISOString()
      });
      
      // 2. ADMIN MASTER SYNC: Ép đồng bộ cho toàn bộ User khác dựa trên Discovery
      if (isAdminUser && allUsers && allUsers.length > 0) {
        allUsers.forEach(u => {
          const targetRef = doc(db, 'users', u.id);
          updateDocumentNonBlocking(targetRef, {
            credits: latestCredits,
            updatedAt: new Date().toISOString()
          });
        });
      }
      
      setLastSynced(new Date().toLocaleTimeString());

      if (isAdminUser) {
        const projResult = await listAllBillingProjects();
        if (projResult.success) {
          setBillingProjects(projResult.projects || []);
        }
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [user, userData, db, allUsers]);

  useEffect(() => {
    if (user && userData?.hasClaimedCredits && !isUserDataLoading && allUsers !== undefined) {
      performBillingSync();
    }
  }, [user, userData?.hasClaimedCredits, isUserDataLoading, !!allUsers, performBillingSync]);

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
    const uRef = doc(db, 'users', user.uid);
    updateDocumentNonBlocking(uRef, { apiKey: tempApiKey, updatedAt: new Date().toISOString() });
    setIsEditingApiKey(false);
    toast({ title: "Đã cập nhật", description: "Cài đặt iGen Code đã được lưu." });
    // Kích hoạt đồng bộ lại sau khi đổi Key
    performBillingSync();
  };

  const filteredUsers = allUsers?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isUserLoading || isUserDataLoading || !user) return null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 pt-28 px-4 md:px-8 pb-12">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/30 blur-[120px] rounded-full" />
      </div>

      <header className="fixed top-0 left-0 w-full z-50 glass h-20 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <IGenBranding className="text-xl md:text-2xl" withTagline={true} />
            {user && (userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '')) && (
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <Button variant={!isAdminView ? 'default' : 'ghost'} onClick={() => setIsAdminView(false)} className="h-9 w-9 p-0 rounded-lg">
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
                <Button variant={isAdminView ? 'default' : 'ghost'} onClick={() => setIsAdminView(true)} className="h-9 w-9 p-0 rounded-lg">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full shadow-lg border border-slate-100 group cursor-pointer" onClick={performBillingSync}>
              <Wallet className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold text-slate-900">${userData?.credits || '0.00'}</span>
              {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400 ml-1" />}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <Avatar className="w-10 h-10 border-2 border-white shadow-md group-hover:border-cyan-400 transition-colors">
                    <AvatarImage src={user?.photoURL || undefined} referrerPolicy="no-referrer" />
                    <AvatarFallback className="bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-bold">
                      {user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-2 shadow-2xl border-slate-100">
                <DropdownMenuLabel className="p-3">
                  <p className="text-xs font-bold text-slate-400 uppercase">{userData?.role === 'admin' ? t.roleAdmin : t.roleUser}</p>
                  <p className="text-sm font-bold truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => { setTempApiKey(userData?.apiKey || ''); setIsEditingApiKey(true); }} 
                  className="p-3 rounded-xl gap-3 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-slate-400" /> Cài đặt mã iGen
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
          <FeatureWorkspace 
            featureId={selectedFeature} 
            lang={lang} 
            userApiKey={userData?.apiKey}
            onBack={() => setSelectedFeature(null)} 
          />
        ) : isAdminView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-cyan-500" /> {t.adminPanel}
                </h2>
                <div className="mt-1 flex items-center gap-2">
                  <Badge className="bg-cyan-50 text-cyan-600 border-cyan-100 font-bold">
                    {allUsers?.length || 0} Users
                  </Badge>
                  <span className="text-[10px] text-slate-400">Đồng bộ: {lastSynced || '...'}</span>
                </div>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Tìm user..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-11 bg-white border-none rounded-xl shadow-sm" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="glass-card rounded-[2rem] overflow-hidden bg-white shadow-2xl">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="py-6 pl-8">EMAIL</TableHead>
                        <TableHead>VAI TRÒ</TableHead>
                        <TableHead className="text-right pr-8">SỐ DƯ CREDITS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers?.map((u) => (
                        <TableRow key={u.id} className="border-slate-100">
                          <TableCell className="py-6 pl-8 font-bold">{u.email}</TableCell>
                          <TableCell>
                            <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="rounded-lg">
                              {u.role === 'admin' ? 'Admin' : 'User'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 font-bold">${u.credits || '0.00'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="glass-card rounded-[2rem] p-6 bg-white shadow-2xl sticky top-28">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <Layers className="w-5 h-5 text-cyan-500" /> Billing Discovery
                  </h3>
                  <div className="space-y-4">
                    {billingProjects.length > 0 ? billingProjects.map((p, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase">Project ID</p>
                        <p className="text-sm font-mono font-bold truncate">{p.projectId}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Account: {p.accountName}</p>
                      </div>
                    )) : <p className="text-center py-12 text-slate-400">Đang khám phá dữ liệu...</p>}
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
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl z-[160] p-8 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Settings className="w-6 h-6 text-cyan-500" /> Cài đặt mã iGen
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Số dư hiện tại</p>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-slate-900">${userData?.credits || '0.00'}</p>
                {isSyncing && <RefreshCw className="w-4 h-4 animate-spin text-cyan-500" />}
              </div>
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
                    className="h-14 bg-white border-2 border-slate-100 focus:border-cyan-500 rounded-2xl px-4 pr-12 font-mono" 
                    placeholder={t.apiKeyPlaceholder} 
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 rounded-xl"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-[10px] text-slate-400 italic mt-1">Mã iGen được sử dụng để xác thực các dịch vụ AI chuyên sâu.</p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditingApiKey(false)} className="flex-1 h-14 rounded-2xl font-bold">
                  {t.cancel}
                </Button>
                <Button type="submit" className="flex-1 h-14 bg-slate-900 text-white rounded-2xl shadow-lg font-bold hover:bg-slate-800 transition-all">
                  Lưu thay đổi
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

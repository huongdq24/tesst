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
  Calendar,
  Globe,
  Edit,
  Layers
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
import { getRealtimeCredits, listAllBillingProjects } from '@/app/actions/billing';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];
const DEFAULT_PROJECT_ID = 'project-5306ce34-5626-488a-913';

const IGenCodeBranded = () => (
  <span className="font-bold">
    <span className="text-cyan-500">iGen</span> Code
  </span>
);

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
  const { data: allUsers, isLoading: isAllUsersLoading } = useCollection(usersCollectionRef);

  /**
   * Đồng bộ dữ liệu Credits Master.
   * Cập nhật cho chính mình và đẩy cho toàn bộ Users nếu là Admin.
   * Được kích hoạt khi vào Home (Login event).
   */
  const performBillingSync = useCallback(async () => {
    if (!user || !userData || !userData.hasClaimedCredits || syncLock.current) return;
    
    syncLock.current = true;
    setIsSyncing(true);
    
    try {
      const result = await getRealtimeCredits(DEFAULT_PROJECT_ID);
      const latestCredits = result.success ? String(result.credits) : '0.00';
      const isAdminUser = userData.role === 'admin' || ADMIN_EMAILS.includes(user.email || '');
      
      // 1. Cập nhật cho chính mình
      const selfRef = doc(db, 'users', user.uid);
      updateDocumentNonBlocking(selfRef, {
        credits: latestCredits,
        updatedAt: new Date().toISOString()
      });
      
      // 2. Nếu là Admin, ÉP BUỘC cập nhật cho toàn bộ Users khác ngay lập tức (Master Sync)
      if (isAdminUser && allUsers && allUsers.length > 0) {
        allUsers.forEach(u => {
          if (String(u.credits) !== latestCredits) {
            const targetRef = doc(db, 'users', u.id);
            updateDocumentNonBlocking(targetRef, {
              credits: latestCredits,
              updatedAt: new Date().toISOString()
            });
          }
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
      console.error("Billing Sync Error:", error);
    } finally {
      setIsSyncing(false);
      syncLock.current = false;
    }
  }, [user, userData, db, allUsers]);

  // CHỈ ĐỒNG BỘ 1 LẦN KHI VÀO TRANG HOME (Sự kiện Đăng nhập)
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

      if (!userData?.hasClaimedCredits || !userData?.apiKey) {
        router.push('/igen-x-google');
      }
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

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

  const filteredUsers = allUsers?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
                <Button 
                  variant={!isAdminView ? 'default' : 'ghost'} 
                  onClick={() => { setIsAdminView(false); setSelectedFeature(null); }}
                  className={cn(
                    "h-9 w-9 p-0 rounded-lg transition-all", 
                    !isAdminView ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <LayoutDashboard className="w-4 h-4" />
                </Button>
                <Button 
                  variant={isAdminView ? 'default' : 'ghost'} 
                  onClick={() => { setIsAdminView(true); setSelectedFeature(null); }}
                  className={cn(
                    "h-9 w-9 p-0 rounded-lg transition-all", 
                    isAdminView ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-white text-slate-900 px-3 md:px-4 py-1.5 rounded-full shadow-lg border border-slate-100 group">
                <Wallet className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  ${userData?.credits || '0.00'}
                </span>
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-cyan-400 ml-1" />}
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
                        onSelect={() => { setIsAdminView(true); setSelectedFeature(null); }}
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
                          ${userData?.credits || '0.00'}
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

      <div className="max-w-7xl mx-auto">
        {selectedFeature ? (
          <FeatureWorkspace 
            featureId={selectedFeature} 
            lang={lang} 
            userApiKey={userData?.apiKey}
            currentCredits={userData?.credits}
            onBack={() => setSelectedFeature(null)} 
          />
        ) : isAdminView ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="w-8 h-8 text-cyan-500" />
                  {t.adminPanel}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="secondary" className="bg-cyan-50 text-cyan-600 border-cyan-100 font-bold px-3 py-1 rounded-full text-xs">
                    {allUsers?.length || 0} {lang === 'VI' ? 'Người dùng' : 'Users'}
                  </Badge>
                  <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    <RefreshCw className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[10px] text-slate-600 font-bold">
                      {lang === 'VI' ? 'Tự động đồng bộ' : 'Auto-synced'}: {lastSynced || '...'}
                    </span>
                    {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-cyan-500 ml-1" />}
                  </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <div className="glass-card rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="font-bold py-6 pl-8 text-slate-500 uppercase tracking-widest text-[10px]">{t.userEmail}</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t.userRole}</TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px]"><IGenCodeBranded /></TableHead>
                        <TableHead className="font-bold text-slate-500 uppercase tracking-widest text-[10px] text-right pr-8">{t.userCredits}</TableHead>
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
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className={cn("rounded-lg px-2", u.role === 'admin' ? "bg-slate-900" : "bg-slate-100 text-slate-600 border-none")}>
                                {u.role === 'admin' ? t.roleAdmin : t.roleUser}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <code className="text-[11px] font-mono bg-slate-100 px-2 py-1 rounded-md text-slate-600 border border-slate-200">
                                {u.apiKey ? maskApiKey(u.apiKey) : '---'}
                              </code>
                            </TableCell>
                            <TableCell className="text-right pr-8">
                              <div className="flex items-center justify-end gap-1.5 font-bold text-slate-900">
                                <Wallet className="w-3.5 h-3.5 text-cyan-500" />
                                ${u.credits || '0.00'}
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

              <div className="lg:col-span-4">
                <div className="glass-card rounded-[2rem] p-6 border-none shadow-2xl bg-white sticky top-28">
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                    <Layers className="w-5 h-5 text-cyan-500" />
                    Billing Insights
                  </h3>
                  <div className="space-y-4">
                    {billingProjects.length > 0 ? (
                      billingProjects.map((p, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Project ID</span>
                            <Badge variant={p.billingEnabled ? 'default' : 'secondary'} className="text-[9px] h-4">
                              {p.billingEnabled ? 'Billing Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm font-mono font-bold text-slate-900 truncate">{p.projectId}</p>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Current Balance</span>
                            <span className="font-bold text-cyan-600">${userData?.credits || '0.00'}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs font-medium">Đang tải dữ liệu từ Google Cloud...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DashboardGrid 
            lang={lang} 
            onOpenFeature={setSelectedFeature} 
          />
        )}
      </div>

      <VoiceAssistantOrb lang={lang} userApiKey={userData?.apiKey} currentCredits={userData?.credits} />

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

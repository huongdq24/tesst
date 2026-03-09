
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, X, Lock } from 'lucide-react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { IGenBranding } from '@/components/Branding';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRealtimeCredits } from '@/app/actions/billing';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

const GoogleLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

export default function CreditClaimPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (isUserLoading || isUserDataLoading) return;
    if (!user) {
      router.push('/login');
    } else {
      const isAdmin = userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '');
      if (isAdmin) return; 
      if (userData?.hasClaimedCredits && userData?.apiKey) router.push('/home');
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying || !apiKey || !user) return;
    setIsVerifying(true);
    
    try {
      // Ưu tiên dùng Access Token thủ công nếu có
      const oauthToken = manualToken || sessionStorage.getItem('google_access_token') || undefined;
      const result = await getRealtimeCredits(oauthToken);
      const latestCredits = result.success ? String(result.credits) : '0.00';
      
      const uRef = doc(db, 'users', user.uid);
      updateDocumentNonBlocking(uRef, {
        hasClaimedCredits: true,
        apiKey: apiKey,
        credits: latestCredits,
        updatedAt: new Date().toISOString()
      });

      if (manualToken) {
        sessionStorage.setItem('google_access_token', manualToken);
      }
      
      toast({ title: "Kích hoạt thành công", description: `Chào mừng bạn. Số dư hiện tại: $${latestCredits}` });
      router.push('/home');
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể kết nối với Google Billing." });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isUserLoading || isUserDataLoading) return null;

  return (
    <main className="min-h-screen relative overflow-hidden bg-slate-50 flex flex-col items-center pt-28 p-4">
      <header className="fixed top-0 left-0 w-full z-50 glass h-20 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between">
          <IGenBranding className="text-xl md:text-2xl" withTagline={true} />
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10 border-2 border-white shadow-md">
              <AvatarImage src={user?.photoURL || undefined} referrerPolicy="no-referrer" />
              <AvatarFallback>{user?.email?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="glass w-full max-w-xl p-10 rounded-[2.5rem] text-center shadow-2xl relative z-10">
        <div className="glass-card inline-flex flex-col items-center gap-6 px-12 py-6 rounded-[1.5rem] shadow-xl border-white/40 mb-10 group hover:scale-[1.02] transition-all bg-white/40">
          <div className="flex items-center gap-8">
            <IGenBranding className="text-2xl" />
            <X className="w-4 h-4 text-slate-300" />
            <GoogleLogo className="w-8 h-8" />
          </div>
          <div className="px-4 py-1 bg-slate-50/50 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Đối tác chiến lược của Google
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-2">Chương trình hợp tác cùng Google</h2>
        <p className="text-sm text-slate-500 mb-8">Nhập mã đối tác và Access Token (tùy chọn) để kích hoạt.</p>
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Mã iGen (Bắt buộc)</Label>
            <Input 
              className="h-16 text-lg bg-white border-2 border-slate-100 focus:border-cyan-500 font-mono rounded-2xl px-6 text-center"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Dán iGen Code tại đây..."
            />
          </div>

          <div className="space-y-2 text-left">
            <Label className="text-[10px] font-bold text-slate-400 uppercase ml-4 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Access Token (Tùy chọn - Dùng để đồng bộ $300)
            </Label>
            <Input 
              className="h-14 bg-white border-2 border-slate-100 focus:border-cyan-500 font-mono rounded-2xl px-6"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="ya29.xxxx..."
            />
            <p className="text-[10px] text-slate-400 italic px-4">Lấy từ Network tab trong Google AI Studio (Authorization Header).</p>
          </div>

          <Button 
            type="submit"
            className="w-full h-16 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full text-lg font-bold shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3"
          >
            {isVerifying ? <RefreshCw className="animate-spin" /> : "Xác nhận & Kích hoạt"}
          </Button>
        </form>
      </div>
    </main>
  );
}

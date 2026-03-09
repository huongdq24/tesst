
"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      // 1. Chưa đăng nhập -> Luôn vào Login
      router.push('/login');
    } else {
      if (isUserDataLoading || userData === undefined) return;
      
      const isAdmin = userData?.role === 'admin' || ADMIN_EMAILS.includes(user.email || '');

      if (isAdmin) {
        // Đặc quyền Admin: Mặc định vào Home nhưng không chặn vào các trang khác
        router.push('/home');
      } else if (userData?.hasClaimedCredits && userData?.apiKey) {
        // User đã có key -> Vào Home
        router.push('/home');
      } else {
        // User chưa có key -> Vào trang kích hoạt
        router.push('/igen-x-google');
      }
    }
  }, [user, isUserLoading, userData, isUserDataLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );
}

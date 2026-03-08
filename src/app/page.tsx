"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function RootPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const userRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userRef);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/login');
    } else {
      if (isUserDataLoading || userData === undefined) return;
      if (userData?.hasClaimedCredits && userData?.apiKey) {
        router.push('/home');
      } else {
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

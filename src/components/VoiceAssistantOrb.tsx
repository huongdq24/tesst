"use client"

import React, { useState } from 'react';
import { Mic, RefreshCw } from 'lucide-react';
import { voiceArchitecturalAssistant } from '@/ai/flows/voice-architectural-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IGenBranding } from './Branding';
import { Language } from '@/lib/i18n';
import { getRealtimeCredits } from '@/app/actions/billing';
import { useUser, useFirestore } from '@/firebase';
import { firebaseConfig } from '@/firebase/config';
import { doc, collection, getDocs } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

export const VoiceAssistantOrb = ({ 
  lang, 
  userApiKey 
}: { 
  lang: Language, 
  userApiKey?: string 
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleOrbClick = async () => {
    if (isProcessing || !user || !db) return;
    setIsListening(true);
    setTimeout(async () => {
      setIsListening(false);
      setIsProcessing(true);
      try {
        const queryText = lang === 'VI' ? 'Thiết kế biệt thự hiện đại' : 'Design a modern villa';
        const result = await voiceArchitecturalAssistant({ query: queryText, apiKey: userApiKey });
        if (result.responseAudio) new Audio(result.responseAudio).play();
        
        toast({ title: "iGen Assistant", description: result.responseText });

        // ĐỒNG BỘ THEO SỰ KIỆN: Ngay sau Voice AI
        const res = await getRealtimeCredits(firebaseConfig.projectId);
        if (res.success) {
          const latestCredits = String(res.credits);
          updateDocumentNonBlocking(doc(db, 'users', user.uid), { credits: latestCredits, updatedAt: new Date().toISOString() });
          if (ADMIN_EMAILS.includes(user.email || '')) {
            const usersSnap = await getDocs(collection(db, 'users'));
            usersSnap.forEach(uDoc => {
               updateDocumentNonBlocking(doc(db, 'users', uDoc.id), { credits: latestCredits, updatedAt: new Date().toISOString() });
            });
          }
        }
      } catch (error) { console.error(error); }
      finally { setIsProcessing(false); }
    }, 2000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleOrbClick}
              className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-2xl transition-all ${isListening ? 'animate-orb' : 'hover:scale-110'} ${isProcessing ? 'opacity-50' : ''}`}
            >
              {isProcessing ? <RefreshCw className="animate-spin" /> : <Mic className="w-8 h-8" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white text-slate-900 border-none shadow-xl">
            Chạm để nói chuyện với iGen...
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

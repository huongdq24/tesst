
"use client"

import React, { useState } from 'react';
import { Mic, X } from 'lucide-react';
import { voiceArchitecturalAssistant } from '@/ai/flows/voice-architectural-assistant-flow';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IGenBranding } from './Branding';
import { Language } from '@/lib/i18n';
import { getRealtimeCredits } from '@/app/actions/billing';
import { useUser, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export const VoiceAssistantOrb = ({ 
  lang, 
  userApiKey, 
  currentCredits 
}: { 
  lang: Language, 
  userApiKey?: string, 
  currentCredits?: string 
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleOrbClick = async () => {
    if (isProcessing || !user) return;
    
    setIsListening(true);
    // Simulating voice capture...
    setTimeout(async () => {
      setIsListening(false);
      setIsProcessing(true);
      try {
        const queryText = lang === 'VI' ? 'Thiết kế một biệt thự hiện đại' : 'Design a modern villa';
        const result = await voiceArchitecturalAssistant({ query: queryText, apiKey: userApiKey });
        
        if (result.responseAudio) {
          const audio = new Audio(result.responseAudio);
          audio.play();
        }
        
        toast({
          title: <div className="flex items-center gap-1"><IGenBranding /> Assistant</div>,
          description: result.responseText,
        });

        // ĐỒNG BỘ THỰC TẾ TỪ GOOGLE CLOUD BILLING API NGAY LẬP TỨC
        const resultCredits = await getRealtimeCredits();
        if (resultCredits.success && resultCredits.credits) {
          const uRef = doc(db, 'users', user.uid);
          updateDocumentNonBlocking(uRef, {
            credits: resultCredits.credits,
            updatedAt: new Date().toISOString()
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Assistant is temporarily unavailable.",
        });
      } finally {
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleOrbClick}
              disabled={isProcessing}
              className={`relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-2xl transition-all duration-500 active:scale-90 ${isListening ? 'animate-orb' : 'hover:scale-110'} ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'orb-glow'}`}
            >
              {isListening ? (
                <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
              ) : null}
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="bg-white text-slate-900 border-none shadow-xl font-medium">
            {lang === 'VI' ? 'Chạm để nói chuyện với iGen...' : 'Tap to speak to iGen...'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  RefreshCw
} from 'lucide-react';
import { translations, Language } from '@/lib/i18n';
import { IGenBranding } from './Branding';
import { aiVideoWalkthroughGenerator } from '@/ai/flows/ai-video-walkthrough-generator';
import { aiDesignConceptGenerator } from '@/ai/flows/ai-design-concept-generator';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { getRealtimeCredits } from '@/app/actions/billing';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

export const FeatureWorkspace = ({ 
  featureId, 
  lang, 
  onBack, 
  userApiKey 
}: { 
  featureId: string, 
  lang: Language, 
  onBack: () => void, 
  userApiKey?: string 
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultMedia, setResultMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const { toast } = useToast();
  const t = translations[lang];

  const [filterDate, setFilterDate] = useState<string | null>(null);

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setFilterDate(thirtyDaysAgo.toISOString());
    if (featureId === 'videoCreator') setMediaType('VIDEO');
    else setMediaType('IMAGE');
  }, [featureId]);

  const projectsQuery = useMemoFirebase(() => {
    if (!user || !db || !filterDate) return null;
    return query(
      collection(db, 'users', user.uid, 'projects'),
      where('featureId', '==', featureId),
      where('createdAt', '>=', filterDate),
      orderBy('createdAt', 'desc')
    );
  }, [db, user, featureId, filterDate]);

  const { data: history } = useCollection(projectsQuery);

  const syncCreditsAfterAI = async () => {
    if (!user || !db) return;
    try {
      const resultCredits = await getRealtimeCredits();
      if (resultCredits.success) {
        const latestCredits = String(resultCredits.credits);
        
        const uRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(uRef, { credits: latestCredits, updatedAt: new Date().toISOString() });

        if (ADMIN_EMAILS.includes(user.email || '')) {
          const usersSnap = await getDocs(collection(db, 'users'));
          usersSnap.forEach(uDoc => {
             updateDocumentNonBlocking(doc(db, 'users', uDoc.id), { credits: latestCredits, updatedAt: new Date().toISOString() });
          });
        }
      }
    } catch (e) { console.error(e); }
  };

  const handleGenerate = async () => {
    if (!prompt || !user) return;
    setIsGenerating(true);
    setResultMedia(null);
    try {
      let outputUrl = '';
      if (featureId === 'videoCreator') {
        const result = await aiVideoWalkthroughGenerator({ description: prompt, cinematicPan: true, aiVideoExtend: false, apiKey: userApiKey });
        outputUrl = result.videoDataUri;
      } else {
        const result = await aiDesignConceptGenerator({ designPrompt: prompt });
        outputUrl = result.moodboardImage;
      }
      setResultMedia(outputUrl);
      
      addDocumentNonBlocking(collection(db, 'users', user.uid, 'projects'), {
        userId: user.uid, featureId, name: prompt.substring(0, 30), status: 'completed', outputUrl, createdAt: new Date().toISOString()
      });
      
      await syncCreditsAfterAI();
      
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể khởi tạo AI." });
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="rounded-full h-10 w-10 p-0"><ChevronLeft className="w-6 h-6" /></Button>
          <div>
            <h2 className="text-2xl font-bold">{t[featureId as keyof typeof t] || featureId}</h2>
            <p className="text-slate-500 text-sm">Powered by <IGenBranding className="text-sm" /> Engine</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <Label className="text-sm font-semibold mb-3 block">Ý tưởng của bạn</Label>
            <Textarea 
              className="min-h-[150px] bg-slate-50 border-none rounded-xl"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Mô tả thiết kế..."
            />
            <Button className="w-full mt-6 bg-slate-900 text-white rounded-xl h-12 font-bold" onClick={handleGenerate} disabled={isGenerating || !prompt}>
              {isGenerating ? <RefreshCw className="animate-spin" /> : "Khởi tạo thiết kế"}
            </Button>
          </div>
          <div className="glass-card p-6 rounded-2xl">
            <h3 className="text-sm font-bold mb-4">LỊCH SỬ DỰ ÁN</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {history?.map((item) => (
                <div key={item.id} className="p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-all" onClick={() => setResultMedia(item.outputUrl)}>
                  <p className="text-xs font-bold truncate">{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-8">
          <div className="glass h-[600px] rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 shadow-2xl border-4 border-white">
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                <p className="text-cyan-400 font-medium animate-pulse">iGen Engine is thinking...</p>
              </div>
            ) : resultMedia ? (
              mediaType === 'VIDEO' ? <video src={resultMedia} controls autoPlay loop className="w-full h-full object-contain" /> : <img src={resultMedia} className="w-full h-full object-contain" alt="AI result" />
            ) : (
              <p className="text-white/30 italic">Sẵn sàng khởi tạo ý tưởng</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

"use client"

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ChevronLeft, 
  Zap, 
  Settings, 
  Play, 
  Download, 
  Sparkles, 
  Clock, 
  History as HistoryIcon,
  Calendar,
  ImageIcon,
  Video
} from 'lucide-react';
import { translations, Language } from '@/lib/i18n';
import { IGenBranding } from './Branding';
import { aiVideoWalkthroughGenerator } from '@/ai/flows/ai-video-walkthrough-generator';
import { aiDesignConceptGenerator } from '@/ai/flows/ai-design-concept-generator';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, getDocs } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { getRealtimeCredits } from '@/app/actions/billing';

const ADMIN_EMAILS = ['igen-architect@admin.com', 'igentech1@gmail.com'];

export const FeatureWorkspace = ({ 
  featureId, 
  lang, 
  onBack, 
  userApiKey,
  currentCredits 
}: { 
  featureId: string, 
  lang: Language, 
  onBack: () => void, 
  userApiKey?: string,
  currentCredits?: string
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const [isProMode, setIsProMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultMedia, setResultMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const { toast } = useToast();
  const t = translations[lang];

  // Settings
  const [cinematicPan, setCinematicPan] = useState(true);
  const [extendVideo, setExtendVideo] = useState(false);

  // Hydration-safe date
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

  const { data: history, isLoading: isHistoryLoading } = useCollection(projectsQuery);

  /**
   * Đồng bộ Credits tức thì sau tác vụ AI.
   */
  const syncCreditsAfterAI = async () => {
    if (!user || !db) return;
    try {
      const resultCredits = await getRealtimeCredits();
      if (resultCredits.success && resultCredits.credits) {
        const latestCredits = String(resultCredits.credits);
        
        // 1. Cập nhật chính mình
        const uRef = doc(db, 'users', user.uid);
        updateDocumentNonBlocking(uRef, {
          credits: latestCredits,
          updatedAt: new Date().toISOString()
        });

        // 2. Nếu là Admin, ép cập nhật toàn bộ Users (Master Sync)
        if (ADMIN_EMAILS.includes(user.email || '')) {
          const usersCol = collection(db, 'users');
          const usersSnap = await getDocs(usersCol);
          usersSnap.forEach(uDoc => {
             const otherURef = doc(db, 'users', uDoc.id);
             updateDocumentNonBlocking(otherURef, {
               credits: latestCredits,
               updatedAt: new Date().toISOString()
             });
          });
        }
      }
    } catch (e) {
      console.error("Post-AI Sync Error:", e);
    }
  };

  const handleGenerate = async () => {
    if (!prompt || !user) return;
    setIsGenerating(true);
    setResultMedia(null);
    try {
      let outputUrl = '';
      
      if (featureId === 'videoCreator') {
        const result = await aiVideoWalkthroughGenerator({
          description: prompt,
          cinematicPan: cinematicPan,
          aiVideoExtend: extendVideo,
          apiKey: userApiKey
        });
        outputUrl = result.videoDataUri;
        setMediaType('VIDEO');
      } else {
        const result = await aiDesignConceptGenerator({
          designPrompt: prompt
        });
        outputUrl = result.moodboardImage;
        setMediaType('IMAGE');
      }
      
      setResultMedia(outputUrl);

      // Lưu lịch sử
      const projectRef = collection(db, 'users', user.uid, 'projects');
      addDocumentNonBlocking(projectRef, {
        userId: user.uid,
        featureId: featureId,
        name: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
        description: prompt,
        mode: isProMode ? 'PRO_MODE' : 'SPEED_MODE',
        status: 'completed',
        outputUrl: outputUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // ĐỒNG BỘ CREDITS TỨC THÌ SAU KHI HOÀN THÀNH
      await syncCreditsAfterAI();

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "The AI engine encountered an error. Please check your API Key."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getLocale = () => {
    if (lang === 'VI') return vi;
    return enUS;
  };

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="rounded-full h-10 w-10 p-0">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{t[featureId as keyof typeof t] || featureId}</h2>
            <p className="text-slate-500 text-sm">Powered by <IGenBranding className="text-sm" /> Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm p-1.5 rounded-full border border-slate-200">
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${!isProMode ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500'}`} onClick={() => setIsProMode(false)}>
            <Zap className="w-4 h-4" />
            <span className="text-xs font-bold whitespace-nowrap">{t.speedMode}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all cursor-pointer ${isProMode ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500'}`} onClick={() => setIsProMode(true)}>
            <Settings className="w-4 h-4" />
            <span className="text-xs font-bold whitespace-nowrap">{t.proMode}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 rounded-2xl">
            <Label className="text-sm font-semibold mb-3 block">{t.promptPlaceholder}</Label>
            <Textarea 
              placeholder={t.promptPlaceholder} 
              className="min-h-[150px] bg-slate-50 border-none focus-visible:ring-cyan-500 rounded-xl"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t.cinematicPan}</Label>
                <Switch checked={cinematicPan} onCheckedChange={setCinematicPan} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{t.aiVideoExtend}</Label>
                <Switch checked={extendVideo} onCheckedChange={setExtendVideo} />
              </div>
            </div>

            <Button 
              className="w-full mt-8 bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 font-bold gap-2"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  {t.generate}
                </>
              )}
            </Button>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <HistoryIcon className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'VI' ? 'Thư viện Project' : 'Project Library'}</h3>
            </div>
            
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {isHistoryLoading ? (
                <div className="flex justify-center p-4">
                  <div className="w-4 h-4 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                </div>
              ) : history && history.length > 0 ? (
                history.map((item) => (
                  <div 
                    key={item.id} 
                    className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group"
                    onClick={() => setResultMedia(item.outputUrl)}
                  >
                    <p className="text-xs font-bold text-slate-900 truncate mb-1 group-hover:text-cyan-600 transition-colors">{item.name}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: getLocale() })}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'VI' ? 'Chưa có tác phẩm nào' : 'Empty gallery'}
                  </p>
                </div>
              )}
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
              <>
                {mediaType === 'VIDEO' ? (
                  <video src={resultMedia} controls autoPlay loop className="w-full h-full object-contain" />
                ) : (
                  <img src={resultMedia} className="w-full h-full object-contain" alt="AI Generated" />
                )}
                <div className="absolute top-6 right-6 flex gap-2">
                  <Button variant="secondary" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none rounded-xl h-11 px-6 font-bold">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 opacity-30">
                {mediaType === 'VIDEO' ? <Video className="w-20 h-20 mx-auto text-white" /> : <ImageIcon className="w-20 h-20 mx-auto text-white" />}
                <p className="text-white font-medium italic">Sẵn sàng khởi tạo ý tưởng</p>
              </div>
            )}
            <div className="absolute bottom-6 left-6">
              <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 text-[10px] text-white font-bold tracking-widest uppercase">
                iGen AI Logic Engine v2.5
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

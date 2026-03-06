
"use client"

import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { translations, Language } from '@/lib/i18n';
import { IGenBranding } from './Branding';
import { aiVideoWalkthroughGenerator } from '@/ai/flows/ai-video-walkthrough-generator';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import { addDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS, zhCN } from 'date-fns/locale';

export const FeatureWorkspace = ({ featureId, lang, onBack, userApiKey }: { featureId: string, lang: Language, onBack: () => void, userApiKey?: string }) => {
  const { user } = useUser();
  const db = useFirestore();
  const [isProMode, setIsProMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const t = translations[lang];

  // Settings
  const [cinematicPan, setCinematicPan] = useState(true);
  const [consistentSync, setConsistentSync] = useState(false);
  const [extendVideo, setExtendVideo] = useState(false);

  // Date for filtering (1 month ago)
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  // Memoized query for history: Only current user's projects for this feature in the last 30 days
  const projectsQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'users', user.uid, 'projects'),
      where('featureId', '==', featureId),
      where('createdAt', '>=', oneMonthAgo.toISOString()),
      orderBy('createdAt', 'desc')
    );
  }, [db, user, featureId]);

  const { data: history, isLoading: isHistoryLoading } = useCollection(projectsQuery);

  const handleGenerate = async () => {
    if (!prompt || !user) return;
    setIsGenerating(true);
    setResultVideo(null);
    try {
      const result = await aiVideoWalkthroughGenerator({
        description: prompt,
        cinematicPan: cinematicPan,
        aiVideoExtend: extendVideo,
        apiKey: userApiKey
      });
      
      setResultVideo(result.videoDataUri);

      // Save to Firestore history
      const projectRef = collection(db, 'users', user.uid, 'projects');
      addDocumentNonBlocking(projectRef, {
        userId: user.uid,
        featureId: featureId,
        name: prompt.substring(0, 30) + (prompt.length > 30 ? '...' : ''),
        description: prompt,
        mode: isProMode ? 'PRO_MODE' : 'SPEED_MODE',
        settings: JSON.stringify({ cinematicPan, consistentSync, extendVideo }),
        status: 'completed',
        outputUrl: result.videoDataUri,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "The iGen Motion engine encountered an error."
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getLocale = () => {
    if (lang === 'VI') return vi;
    if (lang === 'ZH') return zhCN;
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
            <p className="text-slate-500 text-sm">Powered by <IGenBranding className="text-sm" /> Motion</p>
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
        {/* Controls Panel */}
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
                <Label className="text-sm font-medium">{t.consistentSync}</Label>
                <Switch checked={consistentSync} onCheckedChange={setConsistentSync} />
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

          {/* History Panel */}
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 text-slate-900">
              <HistoryIcon className="w-4 h-4" />
              <h3 className="text-sm font-bold uppercase tracking-wider">{lang === 'VI' ? 'Lịch sử (30 ngày)' : 'History (30 days)'}</h3>
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
                    onClick={() => setResultVideo(item.outputUrl)}
                  >
                    <p className="text-xs font-bold text-slate-900 truncate mb-1 group-hover:text-cyan-600 transition-colors">{item.name}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: getLocale() })}</span>
                      </div>
                      <div className="bg-white px-1.5 py-0.5 rounded border border-slate-100 font-bold uppercase">
                        {item.mode === 'PRO_MODE' ? 'PRO' : 'FAST'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-medium">
                    {lang === 'VI' ? 'Chưa có lịch sử trong tháng này' : 'No history in the last 30 days'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          <div className="glass h-[600px] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 shadow-2xl">
            {isGenerating ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mx-auto" />
                <p className="text-cyan-400 font-medium animate-pulse">iGen Motion is calculating path...</p>
              </div>
            ) : resultVideo ? (
              <>
                <video src={resultVideo} controls autoPlay loop className="w-full h-full object-contain" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button variant="secondary" className="bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border-none rounded-lg">
                    <Download className="w-4 h-4 mr-2" /> 4K
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4 opacity-40">
                <Play className="w-20 h-20 mx-auto text-slate-400" />
                <p className="text-slate-400 font-medium italic">Preview will appear here</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] text-white/80 font-bold tracking-widest uppercase">
                iGen Motion V3.1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

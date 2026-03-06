
"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Zap, Settings, Play, Download, Sparkles } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';
import { IGenBranding } from './Branding';
import { aiVideoWalkthroughGenerator } from '@/ai/flows/ai-video-walkthrough-generator';
import { useToast } from '@/hooks/use-toast';

export const FeatureWorkspace = ({ featureId, lang, onBack, userApiKey }: { featureId: string, lang: Language, onBack: () => void, userApiKey?: string }) => {
  const [isProMode, setIsProMode] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const { toast } = useToast();
  const t = translations[lang];

  // Mock settings
  const [cinematicPan, setCinematicPan] = useState(true);
  const [consistentSync, setConsistentSync] = useState(false);
  const [extendVideo, setExtendVideo] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setResultVideo(null);
    try {
      const result = await aiVideoWalkthroughGenerator({
        description: prompt,
        cinematicPan: cinematicPan,
        aiVideoExtend: extendVideo,
        apiKey: userApiKey // Pass the user's fixed API key
      });
      setResultVideo(result.videoDataUri);
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
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-8">
          <div className="glass h-[500px] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden bg-slate-900 shadow-2xl">
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

"use client"

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Palette, Layers, Users, Home, ArrowRight } from 'lucide-react';
import { translations, Language } from '@/lib/i18n';

interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  imageUrl: string;
  onOpen: (id: string) => void;
  lang: Language;
}

const FeatureCard = ({ id, title, description, icon, imageUrl, onOpen, lang }: FeatureCardProps) => (
  <Card className="glass-card group overflow-hidden border-none cursor-pointer" onClick={() => onOpen(id)}>
    <div className="h-40 overflow-hidden relative bg-slate-100">
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
      />
      <div className="absolute top-4 left-4 p-2 bg-white/80 backdrop-blur-sm rounded-lg text-primary shadow-sm">
        {icon}
      </div>
    </div>
    <CardHeader className="p-5">
      <CardTitle className="text-xl font-bold flex items-center justify-between">
        {title}
      </CardTitle>
      <CardDescription className="line-clamp-2 text-slate-500 mt-1">
        {description}
      </CardDescription>
    </CardHeader>
    <CardContent className="px-5 pb-5">
      <Button variant="ghost" className="p-0 text-cyan-600 font-semibold group-hover:translate-x-2 transition-transform">
        {translations[lang].openTool} <ArrowRight className="ml-2 w-4 h-4" />
      </Button>
    </CardContent>
  </Card>
);

export const DashboardGrid = ({ lang, onOpenFeature }: { lang: Language, onOpenFeature: (id: string) => void }) => {
  const t = translations[lang];
  
  const features = [
    { id: 'rendering', title: t.rendering, icon: <ImageIcon className="w-5 h-5" />, desc: 'Photorealistic architectural rendering engine.', img: 'https://picsum.photos/seed/render/600/400' },
    { id: 'videoCreator', title: t.videoCreator, icon: <Video className="w-5 h-5" />, desc: 'Cinematic 3D walkthroughs with iGen Motion.', img: 'https://picsum.photos/seed/video/600/400' },
    { id: 'moodboard', title: t.visualMoodboard, icon: <Palette className="w-5 h-5" />, desc: 'AI-generated visual inspiration and concepts.', img: 'https://picsum.photos/seed/mood/600/400' },
    { id: 'texture', title: t.textureLab, icon: <Layers className="w-5 h-5" />, desc: 'Smart material and texture generation.', img: 'https://picsum.photos/seed/texture/600/400' },
    { id: 'human', title: t.humanEnhancer, icon: <Users className="w-5 h-5" />, desc: 'Scale and populate scenes with AI residents.', img: 'https://picsum.photos/seed/human/600/400' },
    { id: 'staging', title: t.virtualStaging, icon: <Home className="w-5 h-5" />, desc: 'Interior design and virtual furniture staging.', img: 'https://picsum.photos/seed/staging/600/400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {features.map((f) => (
        <FeatureCard 
          key={f.id} 
          id={f.id} 
          title={f.title} 
          description={f.desc} 
          icon={f.icon} 
          imageUrl={f.img} 
          onOpen={onOpenFeature}
          lang={lang}
        />
      ))}
    </div>
  );
};

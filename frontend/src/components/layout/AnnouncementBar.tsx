import React from 'react';
import { Sparkles } from 'lucide-react';

interface AnnouncementBarProps {
  message?: string;
}

export const AnnouncementBar: React.FC<AnnouncementBarProps> = ({
  message = 'Nouvelle Collection Automne-Hiver | Livraison offerte à partir de 180 TND'
}) => {
  return (
    <div className="bg-guven-charcoal text-white text-xs py-2.5 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2">
      <Sparkles className="w-3.5 h-3.5 text-guven-blue flex-shrink-0 animate-pulse" />
      <span>{message}</span>
    </div>
  );
};

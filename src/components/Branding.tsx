import React from 'react';

export const IGenBranding = ({ className = "" }: { className?: string }) => {
  return (
    <span className={`font-headline tracking-tight ${className}`}>
      i<span className="text-cyan-500 font-bold">Gen</span>
    </span>
  );
};

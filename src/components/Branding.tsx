import React from 'react';

export const IGenBranding = ({ className = "" }: { className?: string }) => {
  return (
    <span className={`font-toyota tracking-tight text-accent ${className}`}>
      i<span className="font-bold">Gen</span>
    </span>
  );
};

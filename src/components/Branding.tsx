import React from 'react';

export const IGenBranding = ({ className = "" }: { className?: string }) => {
  return (
    <span className={`font-toyota tracking-tight text-accent flex items-baseline ${className}`}>
      <span className="font-semibold">i</span>
      <span className="font-extrabold">Gen</span>
    </span>
  );
};

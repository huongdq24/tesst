import React from 'react';

interface IGenBrandingProps {
  className?: string;
  withTagline?: boolean;
}

export const IGenBranding = ({ className = "", withTagline = false }: IGenBrandingProps) => {
  return (
    <span className={`font-toyota tracking-tight flex items-baseline gap-2 ${className}`}>
      <span className="text-cyan-500 font-bold">iGen</span>
      {withTagline && (
        <span className="text-slate-900 font-bold tracking-normal whitespace-nowrap">
          - Trợ lý AI cho Kiến trúc sư
        </span>
      )}
    </span>
  );
};

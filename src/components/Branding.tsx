import React from 'react';

interface IGenBrandingProps {
  className?: string;
  withTagline?: boolean;
}

export const IGenBranding = ({ className = "", withTagline = false }: IGenBrandingProps) => {
  return (
    <span className={`font-toyota tracking-tight flex items-baseline gap-2 ${className}`}>
      <div className="flex items-baseline">
        <span className="text-primary font-semibold">i</span>
        <span className="text-cyan-500 font-extrabold">Gen</span>
      </div>
      {withTagline && (
        <span className="text-slate-400 font-medium text-[0.45em] md:text-[0.55em] tracking-normal whitespace-nowrap opacity-80">
          - Trợ lý AI cho Kiến trúc sư
        </span>
      )}
    </span>
  );
};

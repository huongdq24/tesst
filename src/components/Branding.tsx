import React from 'react';

interface IGenBrandingProps {
  className?: string;
  withTagline?: boolean;
}

export const IGenBranding = ({ className = "", withTagline = false }: IGenBrandingProps) => {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <span className="text-cyan-500 font-toyota font-bold">iGen</span>
      {withTagline && (
        <span className="text-slate-900 font-toyota font-bold whitespace-nowrap">
          - Trợ lý AI cho Kiến trúc sư
        </span>
      )}
    </span>
  );
};

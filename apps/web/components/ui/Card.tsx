import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function Card({ className, elevated = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-5 border transition-all duration-200',
        elevated
          ? 'glass-elevated shadow-glass-crdisk hover:border-primary/40'
          : 'glass-crdisk hover:border-border-focus/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

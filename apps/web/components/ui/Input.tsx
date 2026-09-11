import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full bg-surface border border-border focus:border-primary rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all focus:ring-1 focus:ring-primary/40 focus:shadow-glow-green-sm',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

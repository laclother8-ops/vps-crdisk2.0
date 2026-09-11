'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl';

    const variants = {
      primary: 'bg-gradient-to-r from-primary to-secondary text-background hover:from-primary-light hover:to-primary shadow-glow-green hover:shadow-glow-green-lg font-extrabold',
      secondary: 'bg-surface-elevated hover:bg-slate-800 text-primary border border-primary/30 hover:border-primary/60 shadow-glow-green-sm',
      outline: 'bg-transparent hover:bg-surface-elevated text-foreground border border-border hover:border-primary/40',
      ghost: 'bg-transparent hover:bg-surface text-muted-foreground hover:text-foreground',
      destructive: 'bg-destructive/20 hover:bg-destructive/30 text-destructive border border-destructive/40'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2.5 text-xs',
      lg: 'px-6 py-3.5 text-sm',
      icon: 'w-9 h-9 p-0'
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

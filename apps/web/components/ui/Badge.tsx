import React from 'react';
import { cn } from '../../lib/utils';
import { MessageChannel } from '@omnicrm/shared';
import { MessageSquare, Phone, Radio } from 'lucide-react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'neon' | 'secondary' | 'muted' | 'outline' | 'channel' | 'destructive';
  channel?: MessageChannel;
}

export function Badge({ className, variant = 'neon', channel, children, ...props }: BadgeProps) {
  if (channel) {
    switch (channel) {
      case MessageChannel.WHATSAPP:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <MessageSquare className="w-3 h-3" /> WhatsApp
          </span>
        );
      case MessageChannel.CHAT_LIVE:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary border border-primary/30">
            <Radio className="w-3 h-3" /> Chat Live
          </span>
        );
      case MessageChannel.LIGACAO:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/15 text-secondary border border-secondary/30">
            <Phone className="w-3 h-3" /> Ligação
          </span>
        );
    }
  }

  const variants = {
    neon: 'bg-primary/15 text-primary border border-primary/30 shadow-glow-green-sm',
    secondary: 'bg-secondary/15 text-secondary border border-secondary/30',
    muted: 'bg-surface-elevated text-muted-foreground border border-border',
    outline: 'bg-transparent text-foreground border border-border',
    channel: 'bg-surface-elevated text-primary-light border border-border',
    destructive: 'bg-destructive/15 text-destructive border border-destructive/30'
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

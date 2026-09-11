'use client';

import React from 'react';
import { Sparkles, MessageSquare, Zap, X } from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { CannedResponseTemplate } from '@omnicrm/shared';

interface TemplatesPopoverProps {
  onSelectTemplate: (text: string) => void;
  onClose: () => void;
}

export function TemplatesPopover({ onSelectTemplate, onClose }: TemplatesPopoverProps) {
  const { templates } = useChatStore();

  return (
    <div className="absolute bottom-16 left-4 z-40 w-80 sm:w-96 rounded-3xl bg-[#111513] border border-[#26332B] shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150">
      <div className="flex items-center justify-between p-3.5 border-b border-[#26332B] bg-[#18201C]/70">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-foreground">Respostas Rápidas / Templates</h4>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2 max-h-72 overflow-y-auto space-y-1.5 divide-y divide-[#26332B]/40">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            onClick={() => {
              onSelectTemplate(tpl.content);
              onClose();
            }}
            className="p-2.5 rounded-2xl hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3 text-primary shrink-0" />
                {tpl.title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#18201C] text-primary border border-primary/20">
                {tpl.shortcut}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {tpl.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

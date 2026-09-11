'use client';

import React from 'react';
import { 
  Search, 
  MessageSquare, 
  Bot, 
  User, 
  Sparkles, 
  Mic,
  Clock,
  Inbox,
  UserCheck,
  CheckCheck
} from 'lucide-react';
import { useChatStore } from '../../stores/useChatStore';
import { formatPhone } from '../../lib/utils';
import { ConversationFilter, MessageChannel } from '@omnicrm/shared';

function formatRelativeTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin}m`;
  if (diffHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'ontem';
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
}

export function ConversationList() {
  const { 
    conversations, 
    selectedLeadId, 
    selectConversation, 
    activeTabFilter,
    setActiveTabFilter,
    activeChannelFilter, 
    setActiveChannelFilter,
    searchQuery,
    setSearchQuery 
  } = useChatStore();

  const filteredConversations = conversations.filter((conv) => {
    // Channel filter
    if (activeChannelFilter !== 'ALL' && conv.channel !== activeChannelFilter) {
      return false;
    }
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = conv.lead?.name?.toLowerCase().includes(q);
      const matchPhone = conv.lead?.phone?.toLowerCase().includes(q);
      const matchCompany = conv.lead?.company?.toLowerCase().includes(q);
      const matchMsg = conv.lastMessage?.content?.toLowerCase().includes(q);
      return matchName || matchPhone || matchCompany || matchMsg;
    }
    return true;
  });

  const tabCounts = {
    all: conversations.filter(c => c.status !== 'CLOSED').length,
    mine: conversations.filter(c => c.isHumanHandled && c.status !== 'CLOSED').length,
    unassigned: conversations.filter(c => !c.assignedTo && !c.isHumanHandled && c.status !== 'CLOSED').length,
    ai: conversations.filter(c => c.aiHandled && !c.isHumanHandled && c.status !== 'CLOSED').length,
    closed: conversations.filter(c => c.status === 'CLOSED').length,
  };

  return (
    <div className="w-80 sm:w-96 border-r border-[#222924] flex flex-col h-full bg-[#111513] shrink-0">
      {/* Header & Search */}
      <div className="p-4 border-b border-[#222924] space-y-3 bg-[#070908]/40">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-base text-foreground tracking-tight flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#57EF40]" />
            Central de Atendimento
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#18201C] text-muted-foreground border border-[#222924] font-semibold">
            {filteredConversations.length} ativas
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por lead, telefone ou mensagem..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#070908] border border-[#222924] focus:border-[#57EF40] rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none transition-all font-medium"
          />
        </div>

        {/* 4 Primary Filter Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#070908] rounded-xl border border-[#222924]">
          <button
            onClick={() => setActiveTabFilter('mine')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTabFilter === 'mine'
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#141815]'
            }`}
          >
            <UserCheck className="w-3 h-3 text-[#57EF40]" />
            <span>Minhas ({tabCounts.mine})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('unassigned')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTabFilter === 'unassigned'
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#141815]'
            }`}
          >
            <Inbox className="w-3 h-3 text-[#57EF40]" />
            <span>Fila Geral ({tabCounts.unassigned})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('ai')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTabFilter === 'ai'
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#141815]'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Sofia IA ({tabCounts.ai})</span>
          </button>

          <button
            onClick={() => setActiveTabFilter('closed')}
            className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${
              activeTabFilter === 'closed'
                ? 'bg-[#18201C] text-white border border-[#222924] font-bold'
                : 'text-muted-foreground hover:text-foreground hover:bg-[#141815]'
            }`}
          >
            <CheckCheck className="w-3 h-3 text-muted-foreground" />
            <span>Finalizadas ({tabCounts.closed})</span>
          </button>
        </div>
      </div>

      {/* Conversation List Scroll Area */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#222924]">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
            <Inbox className="w-8 h-8 text-muted mx-auto" />
            <p>Nenhuma conversa encontrada neste filtro.</p>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.leadId === selectedLeadId;
            const isAudio = conv.lastMessage?.type === 'audio';

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv.leadId)}
                className={`p-3.5 flex items-start gap-3 cursor-pointer transition-all border-l-2 ${
                  isSelected
                    ? 'bg-[#18201C] border-[#57EF40]'
                    : 'border-transparent hover:bg-[#18201C]/60'
                }`}
              >
                {/* Avatar with Status Dot */}
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-xs ${
                    isSelected 
                      ? 'bg-[#18201C] border border-[#222924] text-[#57EF40]' 
                      : 'bg-[#18201C] border border-[#222924] text-foreground'
                  }`}>
                    {conv.lead?.name ? conv.lead.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  {/* Online/Active Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#57EF40] ring-2 ring-[#111513]" />
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className="font-bold text-xs text-foreground truncate">
                      {conv.lead?.name || 'Cliente'}
                    </h4>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      {formatRelativeTime(conv.lastMessageAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    {isAudio ? (
                      <>
                        <Mic className="w-3 h-3 text-[#57EF40] shrink-0" />
                        <span className="text-[#57EF40] font-medium">Áudio de voz ({conv.lastMessage?.duration || 12}s)</span>
                      </>
                    ) : (
                      conv.lastMessage?.content || 'Inicie a conversa...'
                    )}
                  </p>

                  {/* Channel & Mode Badges */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                        conv.channel === MessageChannel.WHATSAPP
                          ? 'bg-[#25D366]/10 text-[#57EF40] border border-[#25D366]/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {conv.channel === MessageChannel.WHATSAPP ? 'WhatsApp' : 'Chat Live'}
                      </span>

                      {conv.isHumanHandled ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" /> Humano
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#57EF40]/10 text-[#57EF40] border border-[#57EF40]/20 flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 text-[#57EF40]" /> Sofia IA
                        </span>
                      )}
                    </div>

                    {/* Unread Count Badge */}
                    {conv.unreadCount && conv.unreadCount > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-[#57EF40] text-[#070908] font-black text-[10px] flex items-center justify-center shadow-glow-green animate-pulse">
                        {conv.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


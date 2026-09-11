'use client';

import React, { useEffect } from 'react';
import { useChatStore } from '../../stores/useChatStore';
import { ConversationList } from '../../components/chat/ConversationList';
import { ChatWindow } from '../../components/chat/ChatWindow';
import { LeadContextSidebar } from '../../components/chat/LeadContextSidebar';
import { wsClient } from '../../lib/websocket';
import { WSEventType } from '@omnicrm/shared';
import { ShieldAlert, X } from 'lucide-react';

export default function ChatPage() {
  const { 
    fetchConversations, 
    appendIncomingMessage, 
    updateMessageStatus,
    takeoverAlert,
    setTakeoverAlert,
    clearTakeoverAlert
  } = useChatStore();

  useEffect(() => {
    fetchConversations();
    wsClient.connect();

    // Listen to new incoming messages
    const unMsg = wsClient.on(WSEventType.CHAT_MESSAGE_NEW, (msg) => {
      appendIncomingMessage(msg);
    });

    // Listen to message delivery updates
    const unStatus = wsClient.on(WSEventType.CHAT_MESSAGE_STATUS, (data) => {
      if (data?.messageId && data?.status) {
        updateMessageStatus(data.messageId, data.status);
      }
    });

    // Listen to Human Takeover Alerts
    const unAlert = wsClient.on(WSEventType.AGENT_TAKEOVER_ALERT, (alertData) => {
      setTakeoverAlert(alertData);
    });

    // Listen to Transfer events
    const unTransf = wsClient.on(WSEventType.CHAT_CONVERSATION_TRANSFERRED, () => {
      fetchConversations();
    });

    // Listen to Mode Toggle events
    const unMode = wsClient.on(WSEventType.CHAT_HUMAN_MODE_TOGGLED, () => {
      fetchConversations();
    });

    return () => {
      unMsg();
      unStatus();
      unAlert();
      unTransf();
      unMode();
    };
  }, [fetchConversations, appendIncomingMessage, updateMessageStatus, setTakeoverAlert]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] space-y-2">
      {/* Real-time Operator Alert Banner */}
      {takeoverAlert && (
        <div className="px-4 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs flex items-center justify-between shadow-lg animate-bounce">
          <div className="flex items-center gap-2 font-bold">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{takeoverAlert.alert}</span>
          </div>
          <button 
            onClick={clearTakeoverAlert} 
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3-Column Chat Layout */}
      <div className="flex-1 rounded-3xl bg-[#111513] border border-[#222924] overflow-hidden flex shadow-xl divide-x divide-[#222924]">
        {/* Column 1: Conversations List with Channels & Unread badges */}
        <ConversationList />

        {/* Column 2: Main Chat Window with Audio, Attachments & Status */}
        <ChatWindow />

        {/* Column 3: Lead Context Quick Sidebar */}
        <LeadContextSidebar />
      </div>
    </div>
  );
}

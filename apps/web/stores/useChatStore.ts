import { create } from 'zustand';
import { 
  Conversation, 
  ConversationFilter, 
  CannedResponseTemplate, 
  Message, 
  MessageChannel, 
  MessageSender, 
  MessageType, 
  DeliveryStatus 
} from '@omnicrm/shared';
import { api } from '../lib/api';

interface TakeoverAlert {
  leadId: string;
  leadName: string;
  phone: string;
  message?: string;
  timestamp: string;
  alert: string;
}

interface ChatState {
  conversations: Conversation[];
  selectedLeadId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
  activeTabFilter: ConversationFilter;
  activeChannelFilter: 'ALL' | MessageChannel;
  searchQuery: string;
  takeoverAlert: TakeoverAlert | null;
  templates: CannedResponseTemplate[];
  isTransferModalOpen: boolean;
  isTemplatesOpen: boolean;
  typingLeads: Record<string, boolean>;

  // Actions
  fetchConversations: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
  selectConversation: (leadId: string) => Promise<void>;
  sendMessage: (
    content: string, 
    channel?: MessageChannel, 
    type?: MessageType, 
    mediaUrl?: string, 
    duration?: number
  ) => Promise<void>;
  toggleHumanMode: (leadId: string, isHuman: boolean) => Promise<void>;
  transferConversation: (leadId: string, targetUserId?: string, targetDepartment?: string, notes?: string) => Promise<void>;
  notifyTyping: (leadId: string) => Promise<void>;
  setActiveTabFilter: (filter: ConversationFilter) => void;
  setActiveChannelFilter: (filter: 'ALL' | MessageChannel) => void;
  setSearchQuery: (query: string) => void;
  setIsTransferModalOpen: (open: boolean) => void;
  setIsTemplatesOpen: (open: boolean) => void;
  appendIncomingMessage: (msg: Message) => void;
  updateMessageStatus: (messageId: string, status: DeliveryStatus) => void;
  setTakeoverAlert: (alert: TakeoverAlert | null) => void;
  clearTakeoverAlert: () => void;
  setTypingStatus: (leadId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  selectedLeadId: null,
  messages: {},
  isLoading: false,
  activeTabFilter: 'all',
  activeChannelFilter: 'ALL',
  searchQuery: '',
  takeoverAlert: null,
  templates: [],
  isTransferModalOpen: false,
  isTemplatesOpen: false,
  typingLeads: {},

  fetchConversations: async () => {
    set({ isLoading: true });
    try {
      const { activeTabFilter, activeChannelFilter } = get();
      const convs = await api.getConversations(activeTabFilter, activeChannelFilter);
      set({ conversations: convs, isLoading: false });
      
      // Auto-select first conversation if none selected
      const currentSelected = get().selectedLeadId;
      if (convs.length > 0 && (!currentSelected || !convs.some((c: any) => c.leadId === currentSelected))) {
        get().selectConversation(convs[0].leadId);
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  fetchTemplates: async () => {
    try {
      const tpls = await api.getTemplates();
      set({ templates: tpls });
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  },

  selectConversation: async (leadId: string) => {
    set({ selectedLeadId: leadId });
    // Reset unread count locally
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.leadId === leadId ? { ...c, unreadCount: 0 } : c
      )
    }));

    try {
      const msgs = await api.getMessagesByLead(leadId);
      set((s) => ({
        messages: { ...s.messages, [leadId]: msgs }
      }));
    } catch (err) {
      console.error('Failed to load messages for lead:', leadId);
    }
  },

  sendMessage: async (
    content: string, 
    channel = MessageChannel.WHATSAPP, 
    type: MessageType = 'text', 
    mediaUrl?: string, 
    duration?: number
  ) => {
    const { selectedLeadId } = get();
    if (!selectedLeadId || (!content.trim() && !mediaUrl)) return;

    try {
      // Auto-set human mode locally and on server
      get().toggleHumanMode(selectedLeadId, true);

      const newMsg = await api.sendMessage(
        selectedLeadId, 
        content, 
        MessageSender.HUMAN, 
        channel, 
        type, 
        mediaUrl, 
        duration
      );
      get().appendIncomingMessage(newMsg);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  },

  toggleHumanMode: async (leadId: string, isHuman: boolean) => {
    try {
      await api.toggleHumanMode(leadId, isHuman);
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.leadId === leadId
            ? { ...c, isHumanHandled: isHuman, aiHandled: !isHuman }
            : c
        )
      }));
    } catch (err) {
      console.error('Failed to toggle human mode:', err);
    }
  },

  transferConversation: async (leadId: string, targetUserId?: string, targetDepartment?: string, notes?: string) => {
    try {
      await api.transferConversation(leadId, targetUserId, targetDepartment, notes);
      set((s) => ({
        isTransferModalOpen: false,
        conversations: s.conversations.map((c) =>
          c.leadId === leadId
            ? { 
                ...c, 
                assignedTo: targetUserId, 
                assignedDepartment: targetDepartment,
                isHumanHandled: !targetDepartment?.toLowerCase().includes('ia')
              }
            : c
        )
      }));
      // Reload message stream to show system transfer note
      const msgs = await api.getMessagesByLead(leadId);
      set((s) => ({
        messages: { ...s.messages, [leadId]: msgs }
      }));
    } catch (err) {
      console.error('Failed to transfer conversation:', err);
    }
  },

  notifyTyping: async (leadId: string) => {
    try {
      await api.notifyTyping(leadId, 'human');
      // Set human mode locally to immediately reflect in UI
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.leadId === leadId
            ? { ...c, isHumanHandled: true, aiHandled: false }
            : c
        )
      }));
    } catch (err) {
      // Non-critical
    }
  },

  setActiveTabFilter: (filter) => {
    set({ activeTabFilter: filter });
    get().fetchConversations();
  },

  setActiveChannelFilter: (filter) => {
    set({ activeChannelFilter: filter });
    get().fetchConversations();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsTransferModalOpen: (open) => set({ isTransferModalOpen: open }),
  setIsTemplatesOpen: (open) => set({ isTemplatesOpen: open }),

  appendIncomingMessage: (msg: Message) => {
    set((s) => {
      const current = s.messages[msg.leadId] || [];
      if (current.some((m) => m.id === msg.id)) return s;

      const isCurrentChat = s.selectedLeadId === msg.leadId;

      return {
        messages: {
          ...s.messages,
          [msg.leadId]: [...current, msg]
        },
        conversations: s.conversations.map((c) =>
          c.leadId === msg.leadId
            ? { 
                ...c, 
                lastMessageAt: new Date(msg.createdAt), 
                lastMessage: msg,
                unreadCount: isCurrentChat ? 0 : (c.unreadCount || 0) + (msg.sender === MessageSender.LEAD ? 1 : 0)
              }
            : c
        )
      };
    });
  },

  updateMessageStatus: (messageId: string, status: DeliveryStatus) => {
    set((s) => {
      const nextMessages = { ...s.messages };
      for (const leadId of Object.keys(nextMessages)) {
        nextMessages[leadId] = nextMessages[leadId].map((m) =>
          m.id === messageId ? { ...m, status } : m
        );
      }
      return { messages: nextMessages };
    });
  },

  setTakeoverAlert: (alert) => set({ takeoverAlert: alert }),
  clearTakeoverAlert: () => set({ takeoverAlert: null }),

  setTypingStatus: (leadId, isTyping) => {
    set((s) => ({
      typingLeads: { ...s.typingLeads, [leadId]: isTyping }
    }));
  }
}));

import { create } from 'zustand';
import { FunnelStage, Lead, LeadContactStatus } from '@omnicrm/shared';
import { api } from '../lib/api';

interface CRMState {
  leads: Lead[];
  selectedLead: Lead | null;
  selectedLeadTimeline: any[];
  isLoadingTimeline: boolean;
  isLeadDrawerOpen: boolean;
  isCreateDealOpen: boolean;
  isLoading: boolean;
  searchQuery: string;
  selectedResponsible: string;
  selectedTag: string;

  // Actions
  fetchLeads: (search?: string) => Promise<void>;
  fetchLeadTimeline: (leadId: string) => Promise<void>;
  addNoteToLead: (leadId: string, content: string) => Promise<void>;
  moveDeal: (leadId: string, targetStage: FunnelStage) => Promise<void>;
  createLead: (data: any) => Promise<void>;
  updateLead: (leadId: string, data: any) => Promise<void>;
  updateContactStatus: (leadId: string, status: LeadContactStatus, optOut?: boolean) => Promise<void>;
  toggleLeadAI: (leadId: string, isHuman: boolean) => Promise<void>;
  openLeadDrawer: (lead: Lead) => void;
  closeLeadDrawer: () => void;
  openCreateDeal: () => void;
  closeCreateDeal: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedResponsible: (responsible: string) => void;
  setSelectedTag: (tag: string) => void;
}

export const useCRMStore = create<CRMState>((set, get) => ({
  leads: [],
  selectedLead: null,
  selectedLeadTimeline: [],
  isLoadingTimeline: false,
  isLeadDrawerOpen: false,
  isCreateDealOpen: false,
  isLoading: false,
  searchQuery: '',
  selectedResponsible: 'all',
  selectedTag: 'all',

  fetchLeads: async (search) => {
    set({ isLoading: true });
    try {
      const res = await api.getLeads({ search, limit: 100 });
      set({ leads: res.data || [], isLoading: false });
    } catch (err) {
      set({ isLoading: false });
    }
  },

  fetchLeadTimeline: async (leadId: string) => {
    set({ isLoadingTimeline: true });
    try {
      const res = await api.getLeadTimeline(leadId);
      set({ selectedLeadTimeline: res.timeline || [], isLoadingTimeline: false });
    } catch (err) {
      console.warn('Error loading lead timeline:', err);
      set({ selectedLeadTimeline: [], isLoadingTimeline: false });
    }
  },

  addNoteToLead: async (leadId: string, content: string) => {
    try {
      const author = typeof window !== 'undefined' ? localStorage.getItem('crdisk_user_name') || 'Atendente' : 'Atendente';
      const note = await api.addLeadNote(leadId, content, author);
      
      const newTimelineItem = {
        id: note.id || `note-${Date.now()}`,
        type: 'note',
        timestamp: note.createdAt || new Date(),
        title: `Nota interna por ${author}`,
        content,
        author
      };

      set((s) => ({
        selectedLeadTimeline: [newTimelineItem, ...s.selectedLeadTimeline]
      }));
    } catch (err) {
      console.error('Error adding note:', err);
    }
  },

  moveDeal: async (leadId: string, targetStage: FunnelStage) => {
    const { leads } = get();

    // Optimistic update
    set({
      leads: leads.map(l => l.id === leadId ? { ...l, funnelStage: targetStage } : l)
    });

    try {
      await api.moveDealStage(leadId, targetStage);
    } catch (err) {
      get().fetchLeads();
    }
  },

  createLead: async (data) => {
    try {
      const newLead = await api.createLead(data);
      set((s) => ({ leads: [newLead, ...s.leads], isCreateDealOpen: false }));
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  },

  updateLead: async (leadId, data) => {
    try {
      const updated = await api.updateLead(leadId, data);
      set((s) => ({
        leads: s.leads.map(l => l.id === leadId ? { ...l, ...updated } : l),
        selectedLead: s.selectedLead?.id === leadId ? { ...s.selectedLead, ...updated } : s.selectedLead
      }));
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  },

  updateContactStatus: async (leadId, status, optOut) => {
    try {
      const updated = await api.updateContactStatus(leadId, status, optOut);
      set(s => ({
        leads: s.leads.map(l => l.id === leadId ? updated : l),
        selectedLead: s.selectedLead?.id === leadId ? updated : s.selectedLead
      }));
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  },

  toggleLeadAI: async (leadId, isHuman) => {
    try {
      await api.toggleHumanMode(leadId, isHuman);
      const newStatus = isHuman ? ('em_atendimento_humano' as any) : ('contatado' as any);
      set(s => ({
        leads: s.leads.map(l => l.id === leadId ? { ...l, status: newStatus } : l),
        selectedLead: s.selectedLead?.id === leadId ? { ...s.selectedLead, status: newStatus } : s.selectedLead
      }));
    } catch (err) {
      console.error('Failed to toggle AI mode:', err);
    }
  },

  openLeadDrawer: (lead) => {
    set({ selectedLead: lead, isLeadDrawerOpen: true });
    get().fetchLeadTimeline(lead.id);
  },

  closeLeadDrawer: () => set({ isLeadDrawerOpen: false, selectedLead: null, selectedLeadTimeline: [] }),
  openCreateDeal: () => set({ isCreateDealOpen: true }),
  closeCreateDeal: () => set({ isCreateDealOpen: false }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedResponsible: (selectedResponsible) => set({ selectedResponsible }),
  setSelectedTag: (selectedTag) => set({ selectedTag })
}));

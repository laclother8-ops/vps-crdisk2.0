import { create } from 'zustand';
import { Call, CallDispositionOutcome, Lead, PowerDialerSession } from '@omnicrm/shared';
import { api } from '../lib/api';

export type SoftphoneStatus = 'IDLE' | 'DIALING' | 'RINGING' | 'IN_CALL' | 'ENDED';

interface SoftphoneState {
  isOpen: boolean;
  isMuted: boolean;
  isHeld: boolean;
  isTransferOpen: boolean;
  isDTMFOpen: boolean;
  status: SoftphoneStatus;
  activeCall: Call | null;
  activeLead: Lead | null;
  callDuration: number;
  timerInterval: any;
  dialpadInput: string;
  isDispositionOpen: boolean;
  lastCallIdForDisposition: string | null;

  // Power Dialer state
  isPowerDialerActive: boolean;
  powerDialerSession: PowerDialerSession | null;
  countdownSeconds: number | null;
  countdownTimer: any;

  // Actions
  toggleOpen: () => void;
  setDialpadInput: (val: string) => void;
  appendDialpad: (char: string) => void;
  clearDialpad: () => void;
  toggleMute: () => void;
  toggleHold: () => void;
  toggleTransfer: () => void;
  toggleDTMF: () => void;
  sendDTMF: (digit: string) => void;
  startCall: (lead: Lead) => Promise<void>;
  endCall: () => Promise<void>;
  transferCall: (target: string, type?: 'blind' | 'warm') => Promise<void>;
  openDisposition: (callId: string, lead: Lead) => void;
  closeDisposition: () => void;
  submitDisposition: (outcome: CallDispositionOutcome, notes?: string) => Promise<void>;

  // Power Dialer actions
  startPowerDialer: (leadIds: string[]) => Promise<void>;
  startAutoDialCountdown: () => void;
  skipCountdownAndDialNow: () => Promise<void>;
  cancelCountdown: () => void;
  pausePowerDialer: () => Promise<void>;
  stopPowerDialer: () => Promise<void>;
  syncPowerDialerSession: () => Promise<void>;
}

export const useSoftphoneStore = create<SoftphoneState>((set, get) => ({
  isOpen: false,
  isMuted: false,
  isHeld: false,
  isTransferOpen: false,
  isDTMFOpen: false,
  status: 'IDLE',
  activeCall: null,
  activeLead: null,
  callDuration: 0,
  timerInterval: null,
  dialpadInput: '',
  isDispositionOpen: false,
  lastCallIdForDisposition: null,

  isPowerDialerActive: false,
  powerDialerSession: null,
  countdownSeconds: null,
  countdownTimer: null,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setDialpadInput: (val) => set({ dialpadInput: val }),
  appendDialpad: (char) => set((s) => ({ dialpadInput: s.dialpadInput + char })),
  clearDialpad: () => set({ dialpadInput: '' }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleHold: () => set((s) => ({ isHeld: !s.isHeld })),
  toggleTransfer: () => set((s) => ({ isTransferOpen: !s.isTransferOpen, isDTMFOpen: false })),
  toggleDTMF: () => set((s) => ({ isDTMFOpen: !s.isDTMFOpen, isTransferOpen: false })),
  sendDTMF: (digit: string) => {
    console.log(`[WebRTC DTMF] Sent tone: ${digit}`);
    // Future integration with Twilio/WebRTC peer connection sendDigits(digit)
  },

  startCall: async (lead: Lead) => {
    try {
      set({
        isOpen: true,
        status: 'DIALING',
        activeLead: lead,
        dialpadInput: lead.phone,
        callDuration: 0,
        isMuted: false,
        isHeld: false,
        isTransferOpen: false
      });

      const call = await api.dial(lead.id);

      set({
        activeCall: call,
        status: 'RINGING'
      });

      // Simulate connection timer
      setTimeout(() => {
        const interval = setInterval(() => {
          set((s) => ({ callDuration: s.callDuration + 1 }));
        }, 1000);

        set({
          status: 'IN_CALL',
          timerInterval: interval
        });
      }, 1500);
    } catch (err) {
      console.error('Failed to start call:', err);
      set({ status: 'IDLE', activeCall: null, activeLead: null });
    }
  },

  endCall: async () => {
    const { activeCall, timerInterval, callDuration } = get();
    if (timerInterval) clearInterval(timerInterval);

    const callId = activeCall?.id || `call-${Date.now()}`;
    try {
      await api.hangup(callId, callDuration);
    } catch (err) {
      console.warn('Hangup API error:', err);
    }

    set({
      status: 'ENDED',
      timerInterval: null,
      isDispositionOpen: true,
      lastCallIdForDisposition: callId
    });
  },

  transferCall: async (target: string, type: 'blind' | 'warm' = 'blind') => {
    const { activeCall } = get();
    if (!activeCall) return;

    try {
      await api.transferCall(activeCall.id, target, type);
      set({ isTransferOpen: false });
      alert(`Chamada transferida para ${target} com sucesso!`);
      get().endCall();
    } catch (err) {
      console.error('Failed to transfer call:', err);
    }
  },

  openDisposition: (callId: string, lead: Lead) => {
    set({
      isDispositionOpen: true,
      lastCallIdForDisposition: callId,
      activeLead: lead
    });
  },

  closeDisposition: () => {
    const { isPowerDialerActive } = get();
    set({
      isDispositionOpen: false,
      lastCallIdForDisposition: null,
      status: 'IDLE',
      activeCall: null,
      activeLead: null,
      callDuration: 0
    });

    // If power dialer is active, trigger 3-second countdown for the next call!
    if (isPowerDialerActive) {
      get().startAutoDialCountdown();
    }
  },

  submitDisposition: async (outcome: CallDispositionOutcome, notes?: string) => {
    const { lastCallIdForDisposition, callDuration } = get();
    if (lastCallIdForDisposition) {
      try {
        await api.saveDisposition(lastCallIdForDisposition, outcome, notes, callDuration);
      } catch (err) {
        console.error('Failed to save disposition:', err);
      }
    }
    get().closeDisposition();
  },

  // --- Power Dialer Logic ---

  startPowerDialer: async (leadIds: string[]) => {
    try {
      set({ isPowerDialerActive: true });
      const session = await api.startPowerDialer(leadIds);
      set({ powerDialerSession: session });

      if (session.queue.length > 0) {
        const firstLead = session.queue[0].lead;
        get().startCall(firstLead);
      }
    } catch (err) {
      console.error('Failed to start Power Dialer:', err);
      set({ isPowerDialerActive: false });
    }
  },

  startAutoDialCountdown: () => {
    const { countdownTimer } = get();
    if (countdownTimer) clearInterval(countdownTimer);

    set({ countdownSeconds: 3 });

    const timer = setInterval(async () => {
      const current = get().countdownSeconds;
      if (current === null || current <= 1) {
        clearInterval(timer);
        set({ countdownSeconds: null, countdownTimer: null });
        await get().skipCountdownAndDialNow();
      } else {
        set({ countdownSeconds: current - 1 });
      }
    }, 1000);

    set({ countdownTimer: timer });
  },

  skipCountdownAndDialNow: async () => {
    const { countdownTimer, isPowerDialerActive } = get();
    if (countdownTimer) clearInterval(countdownTimer);
    set({ countdownSeconds: null, countdownTimer: null });

    if (!isPowerDialerActive) return;

    try {
      const res = await api.nextPowerDialerLead();
      if (res.finished) {
        set({ isPowerDialerActive: false, powerDialerSession: res.session });
        alert('🎉 Fila de discagem automática concluída com sucesso!');
        return;
      }

      set({ powerDialerSession: res.session });
      if (res.nextLead) {
        get().startCall(res.nextLead);
      }
    } catch (err) {
      console.error('Failed to dial next lead:', err);
    }
  },

  cancelCountdown: () => {
    const { countdownTimer } = get();
    if (countdownTimer) clearInterval(countdownTimer);
    set({ countdownSeconds: null, countdownTimer: null });
  },

  pausePowerDialer: async () => {
    get().cancelCountdown();
    try {
      const session = await api.pausePowerDialer();
      set({ isPowerDialerActive: false, powerDialerSession: session });
    } catch (err) {
      console.error('Failed to pause Power Dialer:', err);
    }
  },

  stopPowerDialer: async () => {
    get().cancelCountdown();
    try {
      await api.stopPowerDialer();
      set({ isPowerDialerActive: false, powerDialerSession: null });
    } catch (err) {
      console.error('Failed to stop Power Dialer:', err);
    }
  },

  syncPowerDialerSession: async () => {
    try {
      const session = await api.getPowerDialerSession();
      set({ powerDialerSession: session, isPowerDialerActive: session?.status === 'RUNNING' });
    } catch (err) {
      // Ignored
    }
  }
}));

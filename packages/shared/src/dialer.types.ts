import { z } from 'zod';
import { CallOutcomeStatus } from './enums.js';
import { Lead, User } from './crm.types.js';

export interface Call {
  id: string;
  leadId: string;
  agentId?: string | null;
  duration: number; // seconds
  status: CallOutcomeStatus;
  recordingUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  lead?: Lead | null;
  agent?: User | null;
}

export type CallDispositionOutcome = 
  | 'atendida'
  | 'ocupado'
  | 'nao_atendeu'
  | 'caixa_postal'
  | 'reuniao_agendada'
  | 'sem_interesse'
  | 'falha';

export interface DialerQueueItem {
  id: string;
  leadId: string;
  lead: Lead;
  status: 'PENDING' | 'IN_CALL' | 'COMPLETED' | 'FAILED' | 'SKIPPED';
  attempts: number;
  lastOutcome?: CallDispositionOutcome;
  callDuration?: number;
}

export interface PowerDialerSession {
  id: string;
  name: string;
  queue: DialerQueueItem[];
  currentIndex: number;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'COUNTDOWN' | 'COMPLETED';
  countdownSeconds: number;
  totalCalls: number;
  successfulContacts: number;
  scheduledMeetings: number;
}

export interface TransferCallPayload {
  callId: string;
  target: string; // extension e.g. "1002" or phone number
  type: 'blind' | 'warm';
}

export const RegisterCallOutcomeSchema = z.object({
  leadId: z.string().optional(),
  agentId: z.string().optional().nullable(),
  duration: z.number().default(0),
  status: z.nativeEnum(CallOutcomeStatus),
  recordingUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  triggerFollowup: z.boolean().default(true)
});


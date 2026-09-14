import { z } from 'zod';
import { CallOutcomeStatus, FunnelStage, LeadContactStatus, UserRole, WorkspaceStatus } from './enums.js';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  subscriptionStatus?: string; // 'trial', 'active', 'past_due', 'canceled', 'pending_payment'
  subscriptionPlan?: string;   // 'starter', 'pro', 'enterprise'
  trialEndsAt?: Date | string | null;
  currentPeriodEnd?: Date | string | null;
  paymentGatewayCustomerId?: string | null;
  paymentGatewaySubscriptionId?: string | null;
  whatsappSettings?: any;
  twilioSettings?: any;
  memberCount?: number;
  leadsCount?: number;
  callsCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  workspaceId: string;
  orgId?: string; // alias for workspaceId
  name: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: string | UserRole;
  sipExtension?: string | null;
  status: string;
  isActive?: boolean;
  createdAt: Date;
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  name?: string | null;
  role: string | UserRole;
  token: string;
  expiresAt: Date | string;
  createdAt: Date | string;
  acceptedAt?: Date | string | null;
}

export interface Lead {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  email?: string | null;
  status: LeadContactStatus;
  funnelStage: FunnelStage;
  lastCallStatus?: CallOutcomeStatus | null;
  optOut: boolean;
  tags: string[];
  assignedUserId?: string | null;
  assignedUser?: User | null;
  score?: number;
  dealValue?: number;
  company?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: LeadContactStatus;
  funnelStage?: FunnelStage;
  tag?: string;
  assignedUserId?: string;
  workspaceId?: string;
}

export interface PaginatedLeadsResponse {
  data: Lead[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const CreateLeadSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(8, 'Telefone inválido'),
  email: z.string().email('E-mail inválido').optional().nullable(),
  status: z.preprocess(
    (val) => typeof val === 'string' ? val.toUpperCase() : val,
    z.nativeEnum(LeadContactStatus)
  ).default(LeadContactStatus.NAO_CONTATADO),
  funnelStage: z.preprocess(
    (val) => typeof val === 'string' ? val.toUpperCase() : val,
    z.nativeEnum(FunnelStage)
  ).default(FunnelStage.NOVO_LEAD),
  optOut: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  assignedUserId: z.string().uuid().optional().nullable(),
  company: z.string().optional().nullable(),
  dealValue: z.number().optional().default(0)
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const UpdateFunnelStageSchema = z.object({
  funnelStage: z.preprocess(
    (val) => typeof val === 'string' ? val.toUpperCase() : val,
    z.nativeEnum(FunnelStage)
  )
});

export const UpdateContactStatusSchema = z.object({
  status: z.preprocess(
    (val) => typeof val === 'string' ? val.toUpperCase() : val,
    z.nativeEnum(LeadContactStatus)
  ),
  optOut: z.boolean().optional(),
  lastCallStatus: z.nativeEnum(CallOutcomeStatus).optional().nullable()
});

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(2, 'Nome da empresa é obrigatório'),
  slug: z.string().min(2, 'Slug é obrigatório'),
  plan: z.string().default('enterprise'),
  adminName: z.string().min(2, 'Nome do administrador é obrigatório'),
  adminEmail: z.string().email('E-mail do administrador inválido'),
  adminPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres')
});

export const CreateTeamUserSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.string().default('SALES_REP'),
  sipExtension: z.string().optional().nullable()
});

export const UpdateTeamUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  isActive: z.boolean().optional(),
  sipExtension: z.string().optional().nullable()
});

export const ResetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres')
});

export const InviteMemberSchema = z.object({
  email: z.string().email('E-mail corporativo inválido'),
  name: z.string().optional().nullable(),
  role: z.string().default('SALES_REP')
});

export const AcceptInviteSchema = z.object({
  name: z.string().min(2, 'Nome completo é obrigatório'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres')
});


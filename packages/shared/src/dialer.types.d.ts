import { z } from 'zod';
import { CallDirection, CallDispositionOutcome, CallStatus, DialerCampaignStatus, DialerCampaignType } from './enums.js';
import { Lead, User } from './crm.types.js';
export interface DialerCampaign {
    id: string;
    orgId: string;
    name: string;
    type: DialerCampaignType;
    status: DialerCampaignStatus;
    scriptTemplate?: string | null;
    scheduleConfig?: Record<string, any> | null;
    totalLeads?: number;
    completedLeads?: number;
    createdAt: Date;
}
export interface Call {
    id: string;
    orgId: string;
    campaignId?: string | null;
    leadId: string;
    userId?: string | null;
    direction: CallDirection;
    fromNumber: string;
    toNumber: string;
    telephonyCallId?: string | null;
    status: CallStatus;
    durationSeconds: number;
    recordingUrl?: string | null;
    transcript?: string | null;
    lead?: Lead | null;
    user?: User | null;
    disposition?: CallDisposition | null;
    createdAt: Date;
}
export interface CallDisposition {
    id: string;
    callId: string;
    outcome: CallDispositionOutcome;
    notes?: string | null;
    scheduledCallbackAt?: Date | null;
    createdAt: Date;
}
export declare const CreateCallDispositionSchema: z.ZodObject<{
    callId: z.ZodString;
    outcome: z.ZodNativeEnum<typeof CallDispositionOutcome>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    scheduledCallbackAt: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>>;
    triggerFollowup: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    callId: string;
    outcome: CallDispositionOutcome;
    triggerFollowup: boolean;
    notes?: string | null | undefined;
    scheduledCallbackAt?: string | Date | null | undefined;
}, {
    callId: string;
    outcome: CallDispositionOutcome;
    notes?: string | null | undefined;
    scheduledCallbackAt?: string | Date | null | undefined;
    triggerFollowup?: boolean | undefined;
}>;
export declare const InitiateCallSchema: z.ZodObject<{
    leadId: z.ZodString;
    campaignId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fromNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    leadId: string;
    campaignId?: string | null | undefined;
    fromNumber?: string | undefined;
}, {
    leadId: string;
    campaignId?: string | null | undefined;
    fromNumber?: string | undefined;
}>;

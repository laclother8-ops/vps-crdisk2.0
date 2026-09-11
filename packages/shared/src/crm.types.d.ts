import { z } from 'zod';
import { DealStatus, LeadStatus } from './enums.js';
export interface Organization {
    id: string;
    name: string;
    slug: string;
    plan: string;
    whatsappSettings?: Record<string, any>;
    twilioSettings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface User {
    id: string;
    orgId: string;
    name: string;
    email: string;
    role: string;
    sipExtension?: string | null;
    status: string;
    createdAt: Date;
}
export interface Lead {
    id: string;
    orgId: string;
    name: string;
    phone: string;
    email?: string | null;
    company?: string | null;
    status: LeadStatus;
    score: number;
    customFields?: Record<string, any>;
    assignedTo?: string | null;
    assignedUser?: User | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface Pipeline {
    id: string;
    orgId: string;
    name: string;
    isDefault: boolean;
    stages?: PipelineStage[];
    createdAt: Date;
}
export interface PipelineStage {
    id: string;
    pipelineId: string;
    name: string;
    order: number;
    colorHex: string;
    winProbability: number;
    deals?: Deal[];
}
export interface Deal {
    id: string;
    orgId: string;
    leadId: string;
    stageId: string;
    assignedTo?: string | null;
    assignedUser?: User | null;
    lead?: Lead | null;
    title: string;
    value: number;
    currency: string;
    status: DealStatus;
    expectedCloseDate?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
export declare const CreateLeadSchema: z.ZodObject<{
    name: z.ZodString;
    phone: z.ZodString;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    company: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof LeadStatus>>;
    score: z.ZodDefault<z.ZodNumber>;
    customFields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    assignedTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: LeadStatus;
    name: string;
    phone: string;
    score: number;
    email?: string | null | undefined;
    company?: string | null | undefined;
    customFields?: Record<string, any> | undefined;
    assignedTo?: string | null | undefined;
}, {
    name: string;
    phone: string;
    status?: LeadStatus | undefined;
    email?: string | null | undefined;
    company?: string | null | undefined;
    score?: number | undefined;
    customFields?: Record<string, any> | undefined;
    assignedTo?: string | null | undefined;
}>;
export declare const CreateDealSchema: z.ZodObject<{
    leadId: z.ZodString;
    stageId: z.ZodString;
    title: z.ZodString;
    value: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodNativeEnum<typeof DealStatus>>;
    expectedCloseDate: z.ZodNullable<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>>;
    assignedTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    value: number;
    status: DealStatus;
    title: string;
    leadId: string;
    stageId: string;
    currency: string;
    assignedTo?: string | null | undefined;
    expectedCloseDate?: string | Date | null | undefined;
}, {
    value: number;
    title: string;
    leadId: string;
    stageId: string;
    status?: DealStatus | undefined;
    assignedTo?: string | null | undefined;
    currency?: string | undefined;
    expectedCloseDate?: string | Date | null | undefined;
}>;
export declare const UpdateDealStageSchema: z.ZodObject<{
    dealId: z.ZodString;
    stageId: z.ZodString;
    newOrder: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    stageId: string;
    dealId: string;
    newOrder?: number | undefined;
}, {
    stageId: string;
    dealId: string;
    newOrder?: number | undefined;
}>;

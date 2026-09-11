import { CallOutcomeStatus } from '@omnicrm/shared';

export interface TelephonyCredentials {
  accountSid: string;
  authToken: string;
  apiKey: string;
  apiSecret: string;
  twimlAppSid: string;
  callerId: string;
}

export interface WebRTCTokenResponse {
  token: string;
  identity: string;
  ttl: number;
}

export interface CallWebhookEvent {
  callSid: string;
  accountSid: string;
  from: string;
  to: string;
  callStatus: string;
  direction: string;
  duration?: string;
  recordingUrl?: string;
}

export interface DialOptions {
  toNumber: string;
  fromNumber: string;
  record?: boolean;
  callbackUrl?: string;
}

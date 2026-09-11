import twilio from 'twilio';
import { TelephonyCredentials, WebRTCTokenResponse } from './types.js';

export class TwilioTelephonyAdapter {
  private client: twilio.Twilio | null = null;
  private credentials: TelephonyCredentials;

  constructor(credentials: TelephonyCredentials) {
    this.credentials = credentials;
    if (credentials.accountSid && credentials.authToken) {
      this.client = twilio(credentials.accountSid, credentials.authToken);
    }
  }

  /**
   * Generates a WebRTC Voice Access Token for browser softphone clients
   */
  generateWebRTCAccessToken(identity: string, ttlSeconds = 3600): WebRTCTokenResponse {
    const { accountSid, apiKey, apiSecret, twimlAppSid } = this.credentials;

    if (!accountSid || !apiKey || !apiSecret) {
      // Return a development placeholder token if running without live Twilio credentials
      return {
        token: `dev-webrtc-token-${identity}-${Date.now()}`,
        identity,
        ttl: ttlSeconds
      };
    }

    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true
    });

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity,
      ttl: ttlSeconds
    });

    token.addGrant(voiceGrant);

    return {
      token: token.toJwt(),
      identity,
      ttl: ttlSeconds
    };
  }

  /**
   * Generates TwiML for an outbound browser-initiated call or server-initiated dial
   */
  generateOutboundTwiML(toNumber: string, callerId?: string, record = true): string {
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    const dial = response.dial({
      callerId: callerId || this.credentials.callerId,
      record: record ? 'record-from-answer-dual' : 'do-not-record',
      recordingStatusCallback: '/api/telephony/webhooks/recording'
    });

    // If calling a client extension vs phone number
    if (toNumber.startsWith('client:')) {
      dial.client(toNumber.replace('client:', ''));
    } else {
      dial.number(toNumber);
    }

    return response.toString();
  }

  /**
   * Trigger outbound automated call to connect agent and lead
   */
  async initiateOutboundCall(toNumber: string, webhookUrl: string): Promise<string> {
    if (!this.client) {
      return `dev-call-sid-${Date.now()}`;
    }

    const call = await this.client.calls.create({
      url: webhookUrl,
      to: toNumber,
      from: this.credentials.callerId,
      statusCallback: `${webhookUrl}/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });

    return call.sid;
  }
}

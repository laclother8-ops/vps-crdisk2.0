export interface SIPConfiguration {
  wsServerUrl: string;
  domain: string;
  realm?: string;
}

export class SIPTelephonyAdapter {
  private config: SIPConfiguration;

  constructor(config: SIPConfiguration) {
    this.config = config;
  }

  /**
   * Generates SIP.js client connection parameters for an extension
   */
  getSIPUserConfig(extension: string, passwordHash: string) {
    return {
      uri: `sip:${extension}@${this.config.domain}`,
      wsServers: [this.config.wsServerUrl],
      authorizationUser: extension,
      password: passwordHash,
      displayName: `Agent ${extension}`
    };
  }
}

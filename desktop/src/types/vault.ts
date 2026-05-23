export type AiProvider = 'openai' | 'anthropic';

export interface CredentialsStatus {
  configured: boolean;
  provider?: AiProvider;
}

export interface AppSettings {
  lastVaultPath?: string | null;
}

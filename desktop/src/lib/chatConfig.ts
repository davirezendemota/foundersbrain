import type { ProviderConfig } from '@/hooks/useGenerativeChat';
import { SYSTEM_PROMPT } from '@/lib/tools';
import type { AiProvider } from '@/types/vault';

const DEFAULT_MODELS: Record<AiProvider, string> = {
  openai: 'gpt-4o',
  anthropic: 'claude-sonnet-4-20250514',
};

export function getChatConfig(provider: AiProvider = 'openai'): Omit<ProviderConfig, 'api_key'> {
  return {
    provider,
    model: DEFAULT_MODELS[provider],
    system_prompt: SYSTEM_PROMPT,
  };
}

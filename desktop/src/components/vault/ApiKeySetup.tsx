import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useVault } from '@/contexts/VaultContext';
import type { AiProvider } from '@/types/vault';

export default function ApiKeySetup() {
  const { t } = useTranslation();
  const { credentialError, saveCredentials } = useVault();
  const [provider, setProvider] = useState<AiProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await saveCredentials(provider, apiKey);
      setApiKey('');
    } catch (submitError) {
      setError(String(submitError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="api-key-setup">
      <div className="api-key-setup-card genui-card">
        <h2 className="api-key-setup-title">{t('vault.apiKeyTitle')}</h2>
        <p className="api-key-setup-description">{t('vault.apiKeyDescription')}</p>

        {credentialError && (
          <div
            className="api-key-setup-warning"
            style={{
              background: 'var(--warning-bg, #fff3cd)',
              border: '1px solid #ffc107',
              borderRadius: 8,
              padding: '10px 14px',
              marginBottom: 16,
              fontSize: 13,
              color: '#856404',
              lineHeight: '1.4',
            }}
          >
            ⚠️ {credentialError}
          </div>
        )}

        <form className="api-key-setup-form" onSubmit={(event) => void handleSubmit(event)}>
          <label className="genui-label" htmlFor="api-provider">
            {t('vault.apiProviderLabel')}
          </label>
          <select
            id="api-provider"
            className="genui-select"
            value={provider}
            onChange={(event) => setProvider(event.target.value as AiProvider)}
            disabled={isSaving}
          >
            <option value="openai">OpenAI (GPT)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>

          <label className="genui-label" htmlFor="api-key">
            {t('vault.apiKeyLabel')}
          </label>
          <input
            id="api-key"
            type="password"
            className="genui-input"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder={t('vault.apiKeyPlaceholder')}
            autoComplete="off"
            disabled={isSaving}
            required
          />

          {error && <p className="api-key-setup-error">{error}</p>}

          <button type="submit" className="genui-button genui-button-primary" disabled={isSaving || !apiKey.trim()}>
            {isSaving ? t('vault.apiKeySaving') : t('vault.apiKeySave')}
          </button>
        </form>
      </div>
    </div>
  );
}

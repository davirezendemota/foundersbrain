import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useVault } from '@/contexts/VaultContext';

export default function VaultGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { isLoading, isVaultReady, selectVaultFolder, vaultName } = useVault();

  if (isLoading) {
    return (
      <div className="vault-gate">
        <p className="vault-gate-muted">{t('vault.loading')}</p>
      </div>
    );
  }

  if (!isVaultReady) {
    return (
      <div className="vault-gate">
        <div className="vault-gate-card">
          <h1 className="vault-gate-title">{t('vault.selectTitle')}</h1>
          <p className="vault-gate-description">{t('vault.selectDescription')}</p>
          <button type="button" className="genui-button genui-button-primary" onClick={() => void selectVaultFolder()}>
            {t('vault.selectButton')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="vault-banner">
        <span className="vault-banner-label">{t('vault.activeLabel')}</span>
        <span className="vault-banner-path">{vaultName}</span>
        <button type="button" className="vault-banner-action" onClick={() => void selectVaultFolder()}>
          {t('vault.changeButton')}
        </button>
      </div>
      {children}
    </>
  );
}

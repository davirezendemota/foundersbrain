import { invoke } from '@tauri-apps/api/core';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { AiProvider, AppSettings, CredentialsStatus } from '@/types/vault';

interface VaultContextValue {
  vaultPath: string | null;
  vaultName: string | null;
  credentialsStatus: CredentialsStatus;
  credentialError: string | null;
  isVaultReady: boolean;
  isChatReady: boolean;
  isLoading: boolean;
  selectVaultFolder: () => Promise<void>;
  refreshCredentialsStatus: () => Promise<void>;
  saveCredentials: (provider: AiProvider, apiKey: string) => Promise<void>;
}

const VaultContext = createContext<VaultContextValue | null>(null);

function vaultLabel(path: string) {
  const parts = path.replace(/\/$/, '').split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [credentialsStatus, setCredentialsStatus] = useState<CredentialsStatus>({
    configured: false,
  });
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshCredentialsStatus = useCallback(async () => {
    if (!vaultPath) {
      setCredentialsStatus({ configured: false });
      setCredentialError(null);
      return;
    }

    try {
      const status = await invoke<CredentialsStatus>('get_vault_credentials_status', {
        vaultPath,
      });
      setCredentialsStatus(status);
      setCredentialError(null);
    } catch (error) {
      setCredentialsStatus({ configured: false });
      setCredentialError(String(error));
    }
  }, [vaultPath]);

  const selectVaultFolder = useCallback(async () => {
    const selected = await invoke<string | null>('pick_vault_folder');
    if (!selected) return;

    await invoke('set_active_vault', { vaultPath: selected });
    setVaultPath(selected);
  }, []);

  const saveCredentials = useCallback(
    async (provider: AiProvider, apiKey: string) => {
      if (!vaultPath) {
        throw new Error('Selecione um vault antes de salvar a API key.');
      }

      const status = await invoke<CredentialsStatus>('save_vault_credentials', {
        vaultPath,
        provider,
        apiKey,
      });
      setCredentialsStatus(status);
      setCredentialError(null);
    },
    [vaultPath],
  );

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const settings = await invoke<AppSettings>('get_app_settings');
        if (cancelled || !settings.lastVaultPath) return;

        setVaultPath(settings.lastVaultPath);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!vaultPath) return;
    void refreshCredentialsStatus();
  }, [vaultPath, refreshCredentialsStatus]);

  const value = useMemo<VaultContextValue>(
    () => ({
      vaultPath,
      vaultName: vaultPath ? vaultLabel(vaultPath) : null,
      credentialsStatus,
      credentialError,
      isVaultReady: Boolean(vaultPath),
      isChatReady: Boolean(vaultPath && credentialsStatus.configured),
      isLoading,
      selectVaultFolder,
      refreshCredentialsStatus,
      saveCredentials,
    }),
    [
      credentialsStatus,
      credentialError,
      isLoading,
      refreshCredentialsStatus,
      saveCredentials,
      selectVaultFolder,
      vaultPath,
    ],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault deve ser usado dentro de VaultProvider');
  }
  return context;
}

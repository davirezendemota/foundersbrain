import { Toaster } from 'sonner';

import I18nProvider from './components/I18nProvider';
import LanguageWrapper from './components/LanguageWrapper';
import HomeContent from './components/HomeContent';
import VaultGate from './components/vault/VaultGate';
import { VaultProvider } from './contexts/VaultContext';

export default function App() {
  return (
    <I18nProvider>
      <LanguageWrapper>
        <VaultProvider>
          <VaultGate>
            <HomeContent />
          </VaultGate>
        </VaultProvider>
      </LanguageWrapper>
      <Toaster />
    </I18nProvider>
  );
}

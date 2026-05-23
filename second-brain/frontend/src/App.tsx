import { Toaster } from 'sonner';
import I18nProvider from './components/I18nProvider';
import LanguageWrapper from './components/LanguageWrapper';
import HomeContent from './components/HomeContent';

export default function App() {
  return (
    <I18nProvider>
      <LanguageWrapper>
        <HomeContent />
      </LanguageWrapper>
      <Toaster />
    </I18nProvider>
  );
}

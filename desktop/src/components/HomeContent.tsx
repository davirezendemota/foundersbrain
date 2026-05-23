

import { invoke } from '@tauri-apps/api/core';
import { faMicrophone, faMicrophoneSlash, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ApiKeySetup from '@/components/vault/ApiKeySetup';
import { MessageList } from '@/components/chat/MessageList';
import { useVault } from '@/contexts/VaultContext';
import { useGenerativeChat } from '@/hooks/useGenerativeChat';
import { getChatConfig } from '@/lib/chatConfig';
import type { AiProvider } from '@/types/vault';
import { cn } from '@/lib/utils';
import AppTabStrip from './AppTabStrip';
import ContentLibraryPage from './ContentLibraryPage';

type PresenceState = 'idle' | 'listening' | 'thinking' | 'generating';
type ActiveSense = 'memory' | 'files' | 'web';

interface CaptionHistoryItem {
  id: string;
  text: string;
  createdAt: string;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultList;
  resultIndex?: number;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechWindow extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

const silentAudioDataUrl = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEAwF0AAIC7AAACABAAZGF0YQQAAAAAAA==';
const humanReadingWordsPerMinute = 200;
const aiCaptionSpeedMultiplier = 1.5;
const captionWordIntervalMs = Math.round(60000 / (humanReadingWordsPerMinute * aiCaptionSpeedMultiplier));
const maxCaptionCycleWords = 64;

function splitCaptionWords(text: string) {
  return text.match(/\S+/g) ?? [];
}

function splitCaptionIntoCycles(text: string) {
  const words = splitCaptionWords(text);

  if (!words.length) return [''];

  const cycles: string[] = [];

  for (let index = 0; index < words.length; index += maxCaptionCycleWords) {
    cycles.push(words.slice(index, index + maxCaptionCycleWords).join(' '));
  }

  return cycles;
}

function splitUrlWord(word: string) {
  const match = word.match(/^(https?:\/\/[^\s]+?)([.,!?;:)]*)$/);

  if (!match) return null;

  return {
    url: match[1],
    suffix: match[2],
  };
}

export default function HomeContent() {
  const { t } = useTranslation();
  const { vaultPath, credentialsStatus, isChatReady } = useVault();
  const provider = (credentialsStatus.provider ?? 'openai') as AiProvider;
  const chatConfig = useMemo(() => getChatConfig(provider), [provider]);
  const {
    messages,
    input,
    setInput,
    send,
    isLoading,
    error: chatError,
    markToolResult,
  } = useGenerativeChat(vaultPath, chatConfig, isChatReady);
  const [activeSubApp, setActiveSubApp] = useState('chat');
  const [presenceState, setPresenceState] = useState<PresenceState>('idle');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [showCaptionHistory, setShowCaptionHistory] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<CaptionHistoryItem | null>(null);
  const [captionCycles, setCaptionCycles] = useState<string[]>([]);
  const [captionCycleIndex, setCaptionCycleIndex] = useState(0);
  const [visibleCaptionWordCount, setVisibleCaptionWordCount] = useState(0);
  const [captionAwaitingNext, setCaptionAwaitingNext] = useState(false);
  const [captionAudioPlaying, setCaptionAudioPlaying] = useState(false);
  const [captionHistory, setCaptionHistory] = useState<CaptionHistoryItem[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const recognitionPausedRef = useRef(false);
  const isAiRespondingRef = useRef(false);
  const captionCyclesRef = useRef<string[]>([]);
  const prevLoadingRef = useRef(false);

  useEffect(() => {
    const savedSound = window.localStorage.getItem('tts_preference');
    const savedMic = window.localStorage.getItem('mic_preference');

    setSoundEnabled(savedSound === 'sound_on');
    setMicEnabled(savedMic === 'mic_on');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('tts_preference', soundEnabled ? 'sound_on' : 'sound_off');
  }, [soundEnabled]);

  useEffect(() => {
    window.localStorage.setItem('mic_preference', micEnabled ? 'mic_on' : 'mic_off');
  }, [micEnabled]);

  useEffect(() => {
    return () => {
      shouldKeepListeningRef.current = false;
      recognitionPausedRef.current = false;
      isAiRespondingRef.current = false;
      recognitionRef.current?.abort();
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.removeAttribute('src');
        audio.load();
      }
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (
      input.trim()
      && presenceState !== 'thinking'
      && presenceState !== 'generating'
    ) {
      setPresenceState('listening');
    }
  }, [input, presenceState]);

  const activeSenses = useMemo<ActiveSense[]>(() => {
    if (presenceState === 'thinking') return ['memory', 'web'];
    if (presenceState === 'generating') return ['files'];
    return [];
  }, [presenceState]);

  const senseBadges = useMemo(
    () => [
      {
        id: 'memory' as const,
        className: 'ai-orbit-one',
        label: t('workspace.presence.senseMemory'),
      },
      {
        id: 'files' as const,
        className: 'ai-orbit-two',
        label: t('workspace.presence.senseFiles'),
      },
      {
        id: 'web' as const,
        className: 'ai-orbit-three',
        label: t('workspace.presence.senseWeb'),
      },
    ],
    [t],
  );

  const previousCaptions = useMemo(
    () => captionHistory.filter((caption) => caption.id !== currentCaption?.id),
    [captionHistory, currentCaption?.id],
  );

  const activeCaptionText = captionCycles[captionCycleIndex] ?? currentCaption?.text ?? '';
  const activeCaptionWords = useMemo(() => splitCaptionWords(activeCaptionText), [activeCaptionText]);
  const captionHasNextCycle = captionCycleIndex < captionCycles.length - 1;
  const isCaptionCycleFullyVisible = visibleCaptionWordCount >= activeCaptionWords.length;

  function showCaption(caption: CaptionHistoryItem) {
    const nextCaptionCycles = splitCaptionIntoCycles(caption.text);

    setCurrentCaption(caption);
    captionCyclesRef.current = nextCaptionCycles;
    setCaptionCycles(nextCaptionCycles);
    setCaptionCycleIndex(0);
    setVisibleCaptionWordCount(0);
    setCaptionAwaitingNext(false);
  }

  useEffect(() => {
    setVisibleCaptionWordCount(0);
    setCaptionAwaitingNext(false);
  }, [activeCaptionText]);

  useEffect(() => {
    if (visibleCaptionWordCount >= activeCaptionWords.length) return;

    const timeoutId = window.setTimeout(() => {
      setVisibleCaptionWordCount((currentCount) => Math.min(currentCount + 1, activeCaptionWords.length));
    }, captionWordIntervalMs);

    return () => window.clearTimeout(timeoutId);
  }, [activeCaptionWords.length, visibleCaptionWordCount]);

  useEffect(() => {
    if (!isCaptionCycleFullyVisible || captionAudioPlaying) return;
    if (!isAiRespondingRef.current) return;

    if (captionHasNextCycle) {
      setCaptionAwaitingNext(true);
      return;
    }

    if (!soundEnabled) {
      isAiRespondingRef.current = false;
      setPresenceState(shouldKeepListeningRef.current ? 'listening' : 'idle');
    }
  }, [captionAudioPlaying, captionHasNextCycle, isCaptionCycleFullyVisible, soundEnabled]);

  function pauseRecognitionWhileAiSpeaks() {
    if (!shouldKeepListeningRef.current || !recognitionRef.current) return;

    recognitionPausedRef.current = true;
    try {
      recognitionRef.current.abort();
    } catch {
      // SpeechRecognition can throw when already stopped between browser events.
    }
  }

  function resumeRecognitionAfterAiSpeaks() {
    if (!shouldKeepListeningRef.current || !recognitionRef.current) {
      isAiRespondingRef.current = false;
      setPresenceState('idle');
      return;
    }

    setInput('');
    setPresenceState('listening');

    // Aguarda o áudio da IA terminar de "decair" nos alto-falantes antes de
    // reabrir o microfone, evitando que o reconhecimento capture o próprio TTS.
    window.setTimeout(() => {
      if (!shouldKeepListeningRef.current || !recognitionRef.current) {
        isAiRespondingRef.current = false;
        return;
      }

      isAiRespondingRef.current = false;
      recognitionPausedRef.current = false;
      setMicEnabled(true);

      try {
        recognitionRef.current.start();
      } catch {
        window.setTimeout(() => {
          if (shouldKeepListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch {
              // Ignored: recognition may already be active.
            }
          }
        }, 250);
      }
    }, 600);
  }

  function getAudioElement() {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }

    return audioRef.current;
  }

  function revokeAudioUrl() {
    if (!audioUrlRef.current) return;

    URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }

  function stopCurrentSpeech() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }

    revokeAudioUrl();
    window.speechSynthesis?.cancel();
  }

  async function unlockAudioPlayback() {
    const audio = getAudioElement();

    try {
      audio.pause();
      revokeAudioUrl();
      audio.src = silentAudioDataUrl;
      audio.volume = 0;
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // The real response can still play in browsers that only require page interaction.
    } finally {
      audio.volume = 1;
      audio.removeAttribute('src');
      audio.load();
    }
  }

  function toggleSound() {
    const nextSoundEnabled = !soundEnabled;

    setSoundEnabled(nextSoundEnabled);

    if (nextSoundEnabled) {
      void unlockAudioPlayback();
    } else {
      stopCurrentSpeech();
      setCaptionAudioPlaying(false);
    }
  }

  async function speak(text: string, onComplete = resumeRecognitionAfterAiSpeaks) {
    if (!soundEnabled) {
      onComplete();
      return;
    }

    if (!vaultPath || credentialsStatus.provider !== 'openai') {
      onComplete();
      return;
    }

    try {
      const audio = getAudioElement();
      audio.pause();
      revokeAudioUrl();

      const base64Audio = await invoke<string>('speech', { vaultPath, text });
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }

      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      if (!audioBlob.size) {
        throw new Error('Speech response returned empty audio body');
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      audio.src = audioUrl;
      audio.onended = () => {
        revokeAudioUrl();
        onComplete();
      };
      audio.onerror = () => {
        revokeAudioUrl();
        onComplete();
      };

      await audio.play();
    } catch (error) {
      console.error('[speak] Tauri speech failed:', error);
      onComplete();
    }
  }

  function completeSpokenCaptionCycle(cycleIndex: number) {
    setCaptionAudioPlaying(false);

    if (cycleIndex < captionCyclesRef.current.length - 1) {
      setCaptionAwaitingNext(true);
      setPresenceState('generating');
      return;
    }

    resumeRecognitionAfterAiSpeaks();
  }

  function speakCaptionCycle(text: string, cycleIndex: number) {
    if (!soundEnabled) return;

    setCaptionAudioPlaying(true);
    void speak(text, () => completeSpokenCaptionCycle(cycleIndex));
  }

  useEffect(() => {
    if (isLoading) {
      isAiRespondingRef.current = true;
      const hasAssistantText = messages.some(
        (message) => message.role === 'assistant' && message.content.trim().length > 0,
      );
      setPresenceState(hasAssistantText ? 'generating' : 'thinking');
      return;
    }

    if (prevLoadingRef.current) {
      const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');
      const assistantText = lastAssistant?.content?.trim() ?? '';

      if (assistantText) {
        const assistantCaption = {
          id: crypto.randomUUID(),
          text: assistantText,
          createdAt: t('workspace.chat.now'),
        };
        const nextCaptionCycles = splitCaptionIntoCycles(assistantText);

        showCaption(assistantCaption);
        setCaptionHistory((currentHistory) => [assistantCaption, ...currentHistory]);

        if (soundEnabled) {
          pauseRecognitionWhileAiSpeaks();
          speakCaptionCycle(nextCaptionCycles[0] ?? assistantText, 0);
        } else {
          setCaptionAudioPlaying(false);
          isAiRespondingRef.current = false;
          setPresenceState(shouldKeepListeningRef.current ? 'listening' : 'idle');
        }
      } else if (chatError) {
        const errorCaption = {
          id: crypto.randomUUID(),
          text: chatError || t('workspace.caption.error'),
          createdAt: t('workspace.chat.now'),
        };
        showCaption(errorCaption);
        setCaptionAudioPlaying(false);
        isAiRespondingRef.current = false;
        setPresenceState(shouldKeepListeningRef.current ? 'listening' : 'idle');
      } else {
        isAiRespondingRef.current = false;
        setPresenceState(shouldKeepListeningRef.current ? 'listening' : 'idle');
      }
    }

    prevLoadingRef.current = isLoading;
  }, [chatError, isLoading, messages, soundEnabled, t]);

  async function submitMessage(messageText: string) {
    if (!messageText || isLoading || !isChatReady) return;
    await send(messageText);
  }

  function handleToolResult(toolCallId: string, value: string) {
    markToolResult(toolCallId, value);
    void send(`[Interação] ${value}`);
  }

  function submitDraft() {
    void submitMessage(input.trim());
  }

  function advanceCaptionCycle() {
    if (!captionHasNextCycle || captionAudioPlaying) return;

    const nextCycleIndex = captionCycleIndex + 1;
    const nextCaptionText = captionCycles[nextCycleIndex] ?? '';

    setCaptionAwaitingNext(false);
    setCaptionCycleIndex(nextCycleIndex);
    setVisibleCaptionWordCount(0);
    setPresenceState('generating');
    speakCaptionCycle(nextCaptionText, nextCycleIndex);
  }

  function toggleMic() {
    if (micEnabled) {
      shouldKeepListeningRef.current = false;
      recognitionPausedRef.current = false;
      isAiRespondingRef.current = false;
      recognitionRef.current?.stop();
      setMicEnabled(false);
      setPresenceState('idle');
      return;
    }

    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      showCaption({
        id: crypto.randomUUID(),
        text: t('workspace.caption.voiceUnavailable'),
        createdAt: t('workspace.chat.now'),
      });
      return;
    }

    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      // Ignora qualquer áudio capturado enquanto a IA está falando ou o
      // reconhecimento foi pausado, evitando loop de feedback do TTS.
      if (recognitionPausedRef.current || isAiRespondingRef.current) {
        return;
      }

      let finalTranscript = '';
      let interimTranscript = '';
      const startIndex = event.resultIndex ?? 0;

      for (let index = startIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalTranscript += `${result[0].transcript} `;
        } else {
          interimTranscript += `${result[0].transcript} `;
        }
      }

      const transcript = (finalTranscript || interimTranscript).trim();
      setInput(transcript);

      if (finalTranscript.trim() && !isAiRespondingRef.current) {
        void submitMessage(finalTranscript.trim());
      }
    };
    recognition.onerror = (event) => {
      if (!shouldKeepListeningRef.current && event.error === 'aborted') {
        return;
      }

      if (recognitionPausedRef.current) {
        return;
      }

      if (shouldKeepListeningRef.current && event.error === 'no-speech') {
        return;
      }

      shouldKeepListeningRef.current = false;
      setMicEnabled(false);
      setPresenceState('idle');
      showCaption({
        id: crypto.randomUUID(),
        text: t('workspace.caption.voiceError'),
        createdAt: t('workspace.chat.now'),
      });
    };
    recognition.onend = () => {
      if (recognitionPausedRef.current) {
        return;
      }

      if (!shouldKeepListeningRef.current) {
        setMicEnabled(false);
        setPresenceState('idle');
        return;
      }

      setPresenceState('listening');
      window.setTimeout(() => {
        if (!shouldKeepListeningRef.current) return;
        try {
          recognition.start();
        } catch {
          window.setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              recognition.start();
            }
          }, 250);
        }
      }, 120);
    };

    recognitionRef.current = recognition;
    shouldKeepListeningRef.current = true;
    setMicEnabled(true);
    setPresenceState('listening');
    recognition.start();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitDraft();
  }

  const statusLabel = {
    idle: t('workspace.presence.idle', { defaultValue: 'Pronto' }),
    listening: t('workspace.presence.listening', { defaultValue: 'Ouvindo' }),
    thinking: t('workspace.presence.thinking', { defaultValue: 'Pensando' }),
    generating: t('workspace.presence.generating', { defaultValue: 'Gerando' }),
  }[presenceState];

  if (activeSubApp === 'content-library') {
    return (
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden text-[var(--fg-primary)]" style={{ background: 'var(--bg-void)' }}>
        <AppTabStrip activeTab="content-library" onChange={setActiveSubApp} />
        <div className="min-h-0 flex-1 overflow-hidden">
          <ContentLibraryPage />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden text-[var(--fg-primary)]" style={{ background: 'var(--bg-void)' }}>
      <AppTabStrip activeTab="chat" onChange={setActiveSubApp} title={`Second Brain — ${t('home.title')}`} />

      <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden lg:grid-cols-2 lg:grid-rows-none">
        {/* ── LEFT PANE: Orb ── */}
        <section className="home-presence-panel relative flex min-h-0 flex-col overflow-hidden border-b border-[var(--border-subtle)] lg:border-b-0 lg:border-r" style={{ background: 'var(--bg-void)' }}>

          {/* conversation title + type selector */}
          <div style={{
            position: 'absolute', top: 24, left: 28, right: 28,
            display: 'flex', alignItems: 'center', gap: 12, zIndex: 10,
          }}>
            <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--fg-primary)', letterSpacing: '-0.01em' }}>
              {t('home.title')}
            </span>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 6,
              background: 'var(--bg-card)', border: '0.5px solid var(--hairline)',
              fontSize: 12, color: 'var(--fg-secondary)', cursor: 'pointer',
            }}>
              <span>Chat</span>
              <span style={{ fontSize: 9, opacity: 0.6 }}>▾</span>
            </div>
          </div>

          <div className="home-presence-content relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
            {/* orb stage */}
            <div className="ai-stage relative flex h-[400px] max-h-[56%] w-full max-w-[520px] items-center justify-center">
              <div className="ai-field" aria-hidden="true" />
              {senseBadges
                .filter((badge) => activeSenses.includes(badge.id))
                .map((badge) => (
                  <div key={badge.id} className={cn('ai-orbit', badge.className)} aria-hidden="true">
                    <span className="ai-orbit-line" />
                    <span className="ai-orbit-label">{badge.label}</span>
                  </div>
                ))}
              <div className="fb-orb-wrap" role="img" aria-label={presenceState}>
                <div className="fb-orb-glow" aria-hidden="true" />
                <div className={cn('fb-orb', `fb-orb-${presenceState}`)} aria-hidden="true" />
                <div className="fb-orb-hi1" aria-hidden="true" />
                <div className="fb-orb-hi2" aria-hidden="true" />
                <div className="fb-orb-ring" aria-hidden="true" />
              </div>
            </div>

            {/* status indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginTop: 28,
              fontFamily: '"Geist Mono", ui-monospace, monospace',
              fontSize: 10.5, letterSpacing: '0.12em',
              color: 'var(--fg-muted)', textTransform: 'uppercase',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: presenceState === 'idle' ? 'var(--fg-muted)' : 'var(--accent-active)',
                boxShadow: presenceState !== 'idle' ? '0 0 8px var(--accent-active)' : 'none',
                flexShrink: 0,
              }} />
              <span>{statusLabel}</span>
            </div>

            {/* orb controls */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                type="button"
                aria-label={soundEnabled ? t('workspace.controls.soundOff') : t('workspace.controls.soundOn')}
                className={cn('control-button', soundEnabled && 'control-button-active')}
                onClick={toggleSound}
              >
                <FontAwesomeIcon icon={soundEnabled ? faVolumeHigh : faVolumeXmark} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={showCaptionHistory ? t('workspace.controls.historyOff') : t('workspace.controls.historyOn')}
                className={cn('control-button', showCaptionHistory && 'control-button-active')}
                onClick={() => setShowCaptionHistory((c) => !c)}
              >
                <span style={{ fontSize: 14 }}>⟲</span>
              </button>
            </div>

            {/* caption */}
            <div className="caption-panel mt-4 flex w-full max-w-[420px] flex-col items-center gap-3">
              {currentCaption && (
                <div
                  className="caption-text"
                  aria-live="polite"
                  aria-label={t('workspace.caption.label')}
                >
                  {activeCaptionWords.map((word, index) => {
                    const linkedWord = splitUrlWord(word);
                    const className = cn('caption-word', index < visibleCaptionWordCount && 'caption-word-visible');

                    if (linkedWord) {
                      return (
                        <span key={`${captionCycleIndex}-${word}-${index}`} className={className}>
                          <a href={linkedWord.url} target="_blank" rel="noreferrer" className="caption-link">
                            {linkedWord.url}
                          </a>
                          {linkedWord.suffix}
                          {' '}
                        </span>
                      );
                    }

                    return (
                      <span key={`${captionCycleIndex}-${word}-${index}`} className={className}>
                        {word}{' '}
                      </span>
                    );
                  })}
                </div>
              )}
              {captionHasNextCycle && captionAwaitingNext && isCaptionCycleFullyVisible && !captionAudioPlaying && (
                <button type="button" className="caption-next-button" onClick={advanceCaptionCycle}>
                  {t('workspace.caption.next')}
                </button>
              )}
              {showCaptionHistory && (
                <div className="caption-history" aria-label={t('workspace.caption.historyLabel')}>
                  {previousCaptions.length ? (
                    previousCaptions.map((caption) => (
                      <p key={caption.id} className="caption-history-item">
                        {splitCaptionWords(caption.text).map((word, index) => {
                          const linkedWord = splitUrlWord(word);

                          if (linkedWord) {
                            return (
                              <span key={`${caption.id}-${word}-${index}`}>
                                <a href={linkedWord.url} target="_blank" rel="noreferrer" className="caption-link">
                                  {linkedWord.url}
                                </a>
                                {linkedWord.suffix}
                                {' '}
                              </span>
                          );
                        }

                        return `${word} `;
                      })}
                    </p>
                  ))
                ) : (
                  <p className="caption-history-empty">{t('workspace.caption.historyEmpty')}</p>
                )}
              </div>
            )}
          </div>
        </div>

      </section>

      <section className="relative flex min-h-0 flex-col overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        {!isChatReady && <ApiKeySetup />}
        <div className={cn('min-h-0 flex-1 flex flex-col overflow-y-auto px-5 py-5 gap-[18px]', !isChatReady && 'chat-pane-blocked')}>
          <div className="flex-1" />
          <MessageList messages={messages} isLoading={isLoading} onToolResult={handleToolResult} />
          {chatError && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {chatError}
            </p>
          )}
        </div>

        <form className="shrink-0 border-t border-[var(--border-subtle)] px-5 py-4" onSubmit={handleSubmit}>
          <div className="composer-wrap">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitDraft();
                }
              }}
              placeholder={
                isChatReady
                  ? t('workspace.composer.placeholder')
                  : t('vault.chatBlockedPlaceholder')
              }
              className="w-full resize-none bg-transparent text-sm leading-6 text-[var(--fg-primary)] outline-none placeholder:text-[var(--fg-faint)]"
              style={{ minHeight: '44px' }}
              disabled={isLoading || !isChatReady}
            />
            <div className="mt-2 flex items-center gap-2">
              <button type="button" className="composer-secondary-button" disabled={!isChatReady}>
                <span style={{ fontSize: 12 }}>⎘</span>
                {t('workspace.composer.attach')}
              </button>
              <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                Use <span style={{ fontFamily: '"Geist Mono", monospace', color: 'var(--fg-secondary)' }}>@</span> {t('workspace.composer.hint')}
              </span>
              <div className="flex-1" />
              <button
                type="button"
                aria-label={micEnabled ? t('workspace.controls.micOff') : t('workspace.controls.micOn')}
                className={cn('composer-mic-button', micEnabled && 'composer-mic-button-active')}
                onClick={toggleMic}
                disabled={!isChatReady}
              >
                <FontAwesomeIcon icon={micEnabled ? faMicrophone : faMicrophoneSlash} aria-hidden="true" />
              </button>
              <button
                type="submit"
                className={cn('composer-submit-button', input.trim() && 'composer-submit-button-filled')}
                disabled={!input.trim() || isLoading || !isChatReady}
              >
                {isLoading ? '...' : t('workspace.composer.send')}
              </button>
            </div>
          </div>
        </form>
      </section>
      </div>{/* end inner grid */}
    </div>
  );
}

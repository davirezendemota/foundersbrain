

import { faClockRotateLeft, faMicrophone, faMicrophoneSlash, faVolumeHigh, faVolumeXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/utils';
import ContentLibraryPage from './ContentLibraryPage';
import SubAppSelector from './SubAppSelector';

type PresenceState = 'idle' | 'listening' | 'thinking' | 'generating';
type ActiveSense = 'memory' | 'files' | 'web';
type ChatRole = 'user' | 'assistant' | 'system';

interface UserMessage {
  id: string;
  kind: 'user.message';
  text: string;
  createdAt: string;
}

interface ArtifactItem {
  id: string;
  kind: 'ai.artifact.code' | 'ai.artifact.file' | 'ai.artifact.link';
  title: string;
  body: string;
  meta: string;
  filename: string;
  contentType: string;
}

type StreamItem = UserMessage | ArtifactItem;

interface ChatHistoryMessage {
  role: ChatRole;
  content: string;
}

interface ChatResponse {
  message: string;
  model: string;
  artifacts?: GeneratedArtifact[];
}

interface GeneratedArtifact {
  title: string;
  filename: string;
  content_type: string;
  content: string;
}

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

const initialStreamItems: StreamItem[] = [];
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
  const [streamItems, setStreamItems] = useState<StreamItem[]>(initialStreamItems);
  const [conversationHistory, setConversationHistory] = useState<ChatHistoryMessage[]>([]);
  const [draft, setDraft] = useState('');
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const recognitionPausedRef = useRef(false);
  const isAiRespondingRef = useRef(false);
  const captionCyclesRef = useRef<string[]>([]);

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
      draft.trim()
      && presenceState !== 'thinking'
      && presenceState !== 'generating'
    ) {
      setPresenceState('listening');
    }
  }, [draft, presenceState]);

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

    setDraft('');
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

    try {
      const audio = getAudioElement();
      audio.pause();
      revokeAudioUrl();

      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:10001';
      const response = await fetch(`${backendUrl}/ai/speech`, {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`Speech request failed (${response.status}): ${detail}`);
      }

      const audioBlob = await response.blob();
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
        const mediaError = audio.error;
        console.error('[speak] HTMLAudioElement error:', mediaError?.code, mediaError?.message);
        revokeAudioUrl();
        onComplete();
      };

      try {
        await audio.play();
      } catch (playError) {
        console.error('[speak] audio.play() rejected:', playError);
        revokeAudioUrl();
        // Não usa speechSynthesis aqui: a voz nativa do SO ofusca o
        // diagnóstico do problema real (ex.: autoplay bloqueado).
        onComplete();
        return;
      }
    } catch (error) {
      console.error('[speak] OpenAI TTS request failed:', error);
      // Sem fallback para window.speechSynthesis: a voz nativa do SO mascara
      // a voz configurada via OPENAI_TTS_VOICE e impede diagnóstico.
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

  async function submitMessage(messageText: string) {
    if (!messageText) return;
    if (isAiRespondingRef.current) return;
    isAiRespondingRef.current = true;

    const message: UserMessage = {
      id: crypto.randomUUID(),
      kind: 'user.message',
      text: messageText,
      createdAt: t('workspace.chat.now'),
    };

    setStreamItems((currentItems) => [...currentItems, message]);
    setDraft('');
    setPresenceState('thinking');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:10001';
      const response = await fetch(`${backendUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          history: conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat request failed with ${response.status}`);
      }

      setPresenceState('generating');
      const data: ChatResponse = await response.json();
      const assistantCaption = {
        id: crypto.randomUUID(),
        text: data.message,
        createdAt: t('workspace.chat.now'),
      };
      const nextCaptionCycles = splitCaptionIntoCycles(data.message);

      showCaption(assistantCaption);
      setCaptionHistory((currentHistory) => [assistantCaption, ...currentHistory]);
      const artifacts = data.artifacts ?? [];
      if (artifacts.length) {
        const artifactItems: ArtifactItem[] = artifacts.map((artifact) => ({
          id: crypto.randomUUID(),
          kind: 'ai.artifact.file',
          title: artifact.title,
          body: artifact.content,
          meta: `${artifact.content_type} - ${artifact.filename}`,
          filename: artifact.filename,
          contentType: artifact.content_type,
        }));

        setStreamItems((currentItems) => [...currentItems, ...artifactItems]);
      }
      if (soundEnabled) {
        pauseRecognitionWhileAiSpeaks();
        speakCaptionCycle(nextCaptionCycles[0] ?? data.message, 0);
      } else {
        setCaptionAudioPlaying(false);
      }
      setConversationHistory((currentHistory) => [
        ...currentHistory,
        { role: 'user', content: messageText },
        { role: 'assistant', content: data.message },
      ]);
    } catch (error) {
      console.error('AI chat request failed:', error);
      const errorCaption = {
        id: crypto.randomUUID(),
        text: t('workspace.caption.error'),
        createdAt: t('workspace.chat.now'),
      };

      showCaption(errorCaption);
      setCaptionAudioPlaying(false);
      isAiRespondingRef.current = false;
      setPresenceState(shouldKeepListeningRef.current ? 'listening' : 'idle');
    } finally {
      if (!soundEnabled && !shouldKeepListeningRef.current && !isAiRespondingRef.current) {
        setPresenceState('idle');
      }
    }
  }

  function downloadArtifact(item: ArtifactItem) {
    const blob = new Blob([item.body], { type: item.contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = item.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function submitDraft() {
    submitMessage(draft.trim());
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
      setDraft(transcript);

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

  if (activeSubApp === 'content-library') {
    return (
      <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--fg-primary)]">
        <div className="shrink-0 flex items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-void)] px-6 py-4">
          <h1 className="text-xl font-medium tracking-tight">{t('home.title')}</h1>
          <SubAppSelector value={activeSubApp} onChange={setActiveSubApp} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <ContentLibraryPage />
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-dvh max-h-dvh grid-cols-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] overflow-hidden bg-[var(--bg-base)] text-[var(--fg-primary)] lg:grid-cols-2 lg:grid-rows-none">
      <section className="home-presence-panel relative flex min-h-0 flex-col overflow-hidden border-b border-[var(--border-subtle)] bg-[var(--bg-void)] px-6 py-6 lg:border-b-0 lg:border-r">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-medium tracking-tight">{t('home.title')}</h1>
            <SubAppSelector value={activeSubApp} onChange={setActiveSubApp} />
          </div>
        </div>

        <div className="home-presence-content relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden py-10">
          <div className="ai-stage relative flex h-[360px] max-h-[52%] w-full max-w-[520px] items-center justify-center">
            <div className="ai-field" aria-hidden="true" />
            {senseBadges
              .filter((badge) => activeSenses.includes(badge.id))
              .map((badge) => (
                <div key={badge.id} className={cn('ai-orbit', badge.className)} aria-hidden="true">
                  <span className="ai-orbit-line" />
                  <span className="ai-orbit-label">{badge.label}</span>
                </div>
              ))}
            <div className={cn('ai-orb', `ai-orb-${presenceState}`)}>
              <div className="ai-orb-core" aria-hidden="true">
                <span className="ai-orb-bubble ai-orb-bubble-one" />
                <span className="ai-orb-bubble ai-orb-bubble-two" />
                <span className="ai-orb-bubble ai-orb-bubble-three" />
              </div>
            </div>
          </div>

          <div className="caption-panel mt-5 flex w-full max-w-[520px] flex-col items-center gap-4">
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
                    <span
                      key={`${captionCycleIndex}-${word}-${index}`}
                      className={className}
                    >
                      {word}
                      {' '}
                    </span>
                  );
                })}
              </div>
            )}
            <div className="flex items-center gap-3">
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
                onClick={() => setShowCaptionHistory((current) => !current)}
              >
                <FontAwesomeIcon icon={faClockRotateLeft} aria-hidden="true" />
              </button>
            </div>
            {captionHasNextCycle && captionAwaitingNext && isCaptionCycleFullyVisible && !captionAudioPlaying && (
              <button
                type="button"
                className="caption-next-button"
                onClick={advanceCaptionCycle}
              >
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

      <section className="flex min-h-0 flex-col overflow-hidden bg-[var(--bg-base)]">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {streamItems.map((item) => {
            if (item.kind === 'user.message') {
              return (
                <article key={item.id} className="ml-auto max-w-[76%] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                    {t('workspace.chat.you')} - {item.createdAt}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--fg-primary)]">{item.text}</p>
                </article>
              );
            }

            return (
              <article key={item.id} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                      {item.meta}
                    </p>
                    <h2 className="mt-2 text-sm font-medium">{item.title}</h2>
                  </div>
                  <button
                    type="button"
                    className="artifact-action"
                    onClick={() => downloadArtifact(item)}
                  >
                    {t('workspace.artifacts.download')}
                  </button>
                </div>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-xs leading-5 text-[var(--fg-secondary)]">
                  {item.body}
                </pre>
              </article>
            );
          })}
        </div>

        <form className="shrink-0 border-t border-[var(--border-subtle)] p-5" onSubmit={handleSubmit}>
          <div className="relative rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
            <button
              type="button"
              aria-label={micEnabled ? t('workspace.controls.micOff') : t('workspace.controls.micOn')}
              className={cn(
                'absolute right-1 top-1 inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-[var(--fg-secondary)] transition-colors hover:text-[var(--fg-primary)]',
                micEnabled && 'text-[var(--fg-primary)]',
              )}
              onClick={toggleMic}
            >
              <FontAwesomeIcon icon={micEnabled ? faMicrophone : faMicrophoneSlash} aria-hidden="true" />
            </button>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  submitDraft();
                }
              }}
              placeholder={t('workspace.composer.placeholder')}
              className="min-h-24 w-full resize-none bg-transparent pr-14 text-sm leading-6 text-[var(--fg-primary)] outline-none placeholder:text-[var(--fg-muted)]"
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
                <button type="button" className="composer-secondary-button">
                  {t('workspace.composer.attach')}
                </button>
                <span>{t('workspace.composer.hint')}</span>
              </div>
              <button type="submit" className="composer-submit-button" disabled={!draft.trim()}>
                {t('workspace.composer.send')}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}

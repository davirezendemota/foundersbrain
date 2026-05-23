import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useCallback, useRef, useState } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolInvocations?: ToolInvocation[];
}

export interface ToolInvocation {
  toolName: string;
  toolCallId: string;
  state: 'call' | 'result';
  args: Record<string, unknown>;
  result?: string;
}

export interface ProviderConfig {
  provider: 'anthropic' | 'openai' | 'groq' | 'together' | 'ollama' | 'lm_studio';
  model: string;
  base_url?: string;
  system_prompt?: string;
}

interface ChatEvent {
  type: 'text' | 'tool_call' | 'done' | 'error';
  content?: string;
  tool_call?: {
    tool_name: string;
    tool_call_id: string;
    args: Record<string, unknown>;
  };
  error?: string;
}

export function useGenerativeChat(
  vaultPath: string | null,
  config: ProviderConfig,
  enabled: boolean,
) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  const send = useCallback(
    async (text: string) => {
      if (!enabled || !vaultPath || !text.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);
      setInput('');

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
      };

      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        toolInvocations: [],
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      const history = [...messages, userMessage].map((message) => ({
        role: message.role,
        content: message.content,
      }));

      unlistenRef.current?.();

      const unlisten = await listen<ChatEvent>('chat-event', (event) => {
        const { type, content, tool_call: toolCall, error: eventError } = event.payload;

        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== assistantId) return message;

            if (type === 'text' && content) {
              return { ...message, content: message.content + content };
            }

            if (type === 'tool_call' && toolCall) {
              const invocation: ToolInvocation = {
                toolName: toolCall.tool_name,
                toolCallId: toolCall.tool_call_id,
                state: 'call',
                args: toolCall.args,
              };
              return {
                ...message,
                toolInvocations: [...(message.toolInvocations ?? []), invocation],
              };
            }

            return message;
          }),
        );

        if (type === 'error' && eventError) {
          setError(eventError);
        }

        if (type === 'done' || type === 'error') {
          setIsLoading(false);
          unlisten();
          unlistenRef.current = null;
        }
      });

      unlistenRef.current = unlisten;

      try {
        await invoke('chat', { vaultPath, messages: history, config });
      } catch (invokeError) {
        setError(String(invokeError));
        setIsLoading(false);
        unlisten();
        unlistenRef.current = null;
      }
    },
    [config, enabled, isLoading, messages, vaultPath],
  );

  const markToolResult = useCallback((toolCallId: string, result: string) => {
    setMessages((prev) =>
      prev.map((message) => {
        if (!message.toolInvocations?.some((invocation) => invocation.toolCallId === toolCallId)) {
          return message;
        }

        return {
          ...message,
          toolInvocations: message.toolInvocations.map((invocation) =>
            invocation.toolCallId === toolCallId
              ? { ...invocation, state: 'result', result }
              : invocation,
          ),
        };
      }),
    );
  }, []);

  const reset = useCallback(() => {
    unlistenRef.current?.();
    unlistenRef.current = null;
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    send,
    isLoading,
    error,
    reset,
    markToolResult,
  };
}

import { ToolRenderer } from '@/components/chat/ToolRenderer';
import type { ChatMessage } from '@/hooks/useGenerativeChat';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onToolResult: (toolCallId: string, value: string) => void;
}

export function MessageList({ messages, isLoading, onToolResult }: MessageListProps) {
  return (
    <>
      {messages.map((message, index) => {
        const isLastAssistant =
          message.role === 'assistant' && index === messages.length - 1 && isLoading;

        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end">
              <div className="fb-bubble-user">{message.content}</div>
            </div>
          );
        }

        return (
          <div key={message.id} className="flex justify-start">
            <div className="fb-bubble-ai">
              <div className="fb-bubble-label">
                <span>IA</span>
                {isLastAssistant && (
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--accent-active)',
                      boxShadow: '0 0 6px var(--accent-active)',
                      display: 'inline-block',
                    }}
                  />
                )}
              </div>
              {message.content && (
                <div>
                  {message.content}
                  {isLastAssistant && !message.toolInvocations?.length && (
                    <span className="fb-caret" aria-hidden="true" />
                  )}
                </div>
              )}
              {message.toolInvocations?.map((invocation) => (
                <div key={invocation.toolCallId} className="mt-3">
                  <ToolRenderer
                    invocation={invocation}
                    onResult={onToolResult}
                    disabled={isLoading}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}

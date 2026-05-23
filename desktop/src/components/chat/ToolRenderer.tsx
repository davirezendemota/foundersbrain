import { getComponentForTool } from '@/lib/componentMap';
import type { ToolInvocation } from '@/hooks/useGenerativeChat';

interface ToolRendererProps {
  invocation: ToolInvocation;
  onResult: (toolCallId: string, value: string) => void;
  disabled?: boolean;
}

export function ToolRenderer({ invocation, onResult, disabled }: ToolRendererProps) {
  const Component = getComponentForTool(invocation.toolName);

  if (!Component) {
    return (
      <div className="genui-card genui-error">
        Componente desconhecido: <code>{invocation.toolName}</code>
      </div>
    );
  }

  return (
    <Component
      invocation={invocation}
      disabled={disabled}
      onResult={(value) => onResult(invocation.toolCallId, value)}
    />
  );
}

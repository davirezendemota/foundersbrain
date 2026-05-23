import type { GenUiComponentProps } from '@/lib/componentMap';

interface ConfirmArgs {
  message?: string;
}

export function ConfirmComponent({ invocation, onResult, disabled }: GenUiComponentProps) {
  const args = invocation.args as ConfirmArgs;
  const message = args.message ?? 'Confirmar esta ação?';

  return (
    <div className="genui-card">
      <p className="genui-message">{message}</p>
      <div className="genui-actions">
        <button
          type="button"
          className="genui-button genui-button-primary"
          disabled={disabled || invocation.state === 'result'}
          onClick={() => onResult('confirmado')}
        >
          Confirmar
        </button>
        <button
          type="button"
          className="genui-button"
          disabled={disabled || invocation.state === 'result'}
          onClick={() => onResult('cancelado')}
        >
          Cancelar
        </button>
      </div>
      {invocation.result && <p className="genui-result">Resposta: {invocation.result}</p>}
    </div>
  );
}

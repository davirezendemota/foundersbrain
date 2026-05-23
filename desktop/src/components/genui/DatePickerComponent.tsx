import type { GenUiComponentProps } from '@/lib/componentMap';

interface DatePickerArgs {
  label?: string;
  min?: string;
  max?: string;
}

export function DatePickerComponent({ invocation, onResult, disabled }: GenUiComponentProps) {
  const args = invocation.args as DatePickerArgs;
  const label = args.label ?? 'Selecione uma data';

  return (
    <div className="genui-card">
      <label className="genui-label" htmlFor={`date-${invocation.toolCallId}`}>
        {label}
      </label>
      <input
        id={`date-${invocation.toolCallId}`}
        type="date"
        className="genui-input"
        min={args.min}
        max={args.max}
        disabled={disabled || invocation.state === 'result'}
        onChange={(event) => {
          if (event.target.value) onResult(event.target.value);
        }}
      />
      {invocation.result && <p className="genui-result">Data: {invocation.result}</p>}
    </div>
  );
}

import type { GenUiComponentProps } from '@/lib/componentMap';

interface SelectArgs {
  label?: string;
  options?: string[];
}

export function SelectComponent({ invocation, onResult, disabled }: GenUiComponentProps) {
  const args = invocation.args as SelectArgs;
  const label = args.label ?? 'Selecione uma opção';
  const options = args.options ?? [];

  return (
    <div className="genui-card">
      <label className="genui-label" htmlFor={`select-${invocation.toolCallId}`}>
        {label}
      </label>
      <select
        id={`select-${invocation.toolCallId}`}
        className="genui-select"
        disabled={disabled || invocation.state === 'result'}
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) onResult(event.target.value);
        }}
      >
        <option value="" disabled>
          Escolha...
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {invocation.result && <p className="genui-result">Selecionado: {invocation.result}</p>}
    </div>
  );
}

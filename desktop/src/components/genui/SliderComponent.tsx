import { useState } from 'react';

import type { GenUiComponentProps } from '@/lib/componentMap';

interface SliderArgs {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function SliderComponent({ invocation, onResult, disabled }: GenUiComponentProps) {
  const args = invocation.args as SliderArgs;
  const label = args.label ?? 'Ajuste o valor';
  const min = args.min ?? 0;
  const max = args.max ?? 100;
  const step = args.step ?? 1;
  const initial = Math.round((min + max) / 2);
  const [value, setValue] = useState(initial);

  return (
    <div className="genui-card">
      <label className="genui-label" htmlFor={`slider-${invocation.toolCallId}`}>
        {label}
      </label>
      <div className="genui-slider-row">
        <input
          id={`slider-${invocation.toolCallId}`}
          type="range"
          className="genui-slider"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled || invocation.state === 'result'}
          onChange={(event) => setValue(Number(event.target.value))}
        />
        <span className="genui-slider-value">{value}</span>
      </div>
      <button
        type="button"
        className="genui-button genui-button-primary"
        disabled={disabled || invocation.state === 'result'}
        onClick={() => onResult(String(value))}
      >
        Confirmar valor
      </button>
      {invocation.result && <p className="genui-result">Valor: {invocation.result}</p>}
    </div>
  );
}

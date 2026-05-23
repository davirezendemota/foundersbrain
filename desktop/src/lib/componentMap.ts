import type { ComponentType } from 'react';

import { ConfirmComponent } from '@/components/genui/ConfirmComponent';
import { DatePickerComponent } from '@/components/genui/DatePickerComponent';
import { SearchSelectComponent } from '@/components/genui/SearchSelectComponent';
import { SelectComponent } from '@/components/genui/SelectComponent';
import { SliderComponent } from '@/components/genui/SliderComponent';
import type { ToolInvocation } from '@/hooks/useGenerativeChat';

export interface GenUiComponentProps {
  invocation: ToolInvocation;
  onResult: (value: string) => void;
  disabled?: boolean;
}

export const componentMap: Record<string, ComponentType<GenUiComponentProps>> = {
  render_select: SelectComponent,
  render_search_select: SearchSelectComponent,
  render_confirm: ConfirmComponent,
  render_date_picker: DatePickerComponent,
  render_slider: SliderComponent,
};

export function getComponentForTool(toolName: string) {
  return componentMap[toolName] ?? null;
}

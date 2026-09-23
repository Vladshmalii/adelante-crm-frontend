import { Input, type InputProps } from 'antd';
import { useState } from 'react';

import { formatPhone, normalizePhone } from '@/shared/lib';

type PhoneInputProps = Omit<InputProps, 'value' | 'onChange'> & {
  value?: string | null;
  onChange?: (value: string) => void;
};

/**
 * Поле телефона для Form: наружу отдаёт `+380XXXXXXXXX`, пока печатают — показывает
 * введённое как есть, после ухода с поля — форматирует `+380 (XX) XXX-XX-XX`.
 */
export function PhoneInput({ value, onChange, onBlur, ...rest }: PhoneInputProps) {
  const [state, setState] = useState({ value: value ?? '', text: formatPhone(value) });
  // Значение поменяли снаружи (форма сброшена, открыли другую запись) — показываем его.
  if (state.value !== (value ?? '')) setState({ value: value ?? '', text: formatPhone(value) });

  return (
    <Input
      inputMode="tel"
      placeholder="+380 (XX) XXX-XX-XX"
      {...rest}
      value={state.text}
      onChange={(e) => {
        const normalized = normalizePhone(e.target.value);
        setState({ value: normalized, text: e.target.value });
        onChange?.(normalized);
      }}
      onBlur={(e) => {
        setState((s) => ({ ...s, text: formatPhone(s.value) }));
        onBlur?.(e);
      }}
    />
  );
}

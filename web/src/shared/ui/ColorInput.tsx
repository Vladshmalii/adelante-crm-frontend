import { ColorPicker } from 'antd';

import { COLOR_PRESETS } from '@/shared/lib';

interface ColorInputProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
}

/** Цветовая метка для Form: hex-строка или null. */
export function ColorInput({ value, onChange }: ColorInputProps) {
  return (
    <ColorPicker
      value={value ?? undefined}
      allowClear
      presets={[{ label: 'Кольори', colors: COLOR_PRESETS }]}
      onChange={(color) => onChange?.(color.toHexString())}
      onClear={() => onChange?.(null)}
    />
  );
}

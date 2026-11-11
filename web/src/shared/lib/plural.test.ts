import { describe, expect, it } from 'vitest';

import { pluralUk } from './plural';

describe('pluralUk', () => {
  const days = ['день', 'дні', 'днів'] as const;
  it('1, 2–4, 5+ и 11–14', () => {
    expect(pluralUk(1, days)).toBe('день');
    expect(pluralUk(3, days)).toBe('дні');
    expect(pluralUk(5, days)).toBe('днів');
    expect(pluralUk(11, days)).toBe('днів');
    expect(pluralUk(14, days)).toBe('днів');
    expect(pluralUk(21, days)).toBe('день');
    expect(pluralUk(22, days)).toBe('дні');
    expect(pluralUk(0, days)).toBe('днів');
  });
});

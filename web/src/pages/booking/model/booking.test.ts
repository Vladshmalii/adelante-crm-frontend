import { describe, expect, it } from 'vitest';

import { buildIcs, formatDuration, groupServices, monthOf, slotsByPart } from './booking';

const service = (id: string, category: string) => ({
  id,
  name: id,
  category,
  color: null,
  description: null,
  price: '500.00',
  duration_minutes: 60,
});

const slot = (utc: string) => ({ start_at: utc, label: '', master_ids: [] });

describe('сайт записи', () => {
  it('группирует услуги по категориям в порядке появления', () => {
    const groups = groupServices([
      service('a', 'hair'),
      service('b', 'nails'),
      service('c', 'hair'),
    ]);
    expect(groups.map(([c, list]) => [c, list.map((s) => s.id)])).toEqual([
      ['hair', ['a', 'c']],
      ['nails', ['b']],
    ]);
  });

  it('делит время на ранок / день / вечір по Киеву', () => {
    // Киев летом UTC+3: 06:00Z = 09:00, 11:00Z = 14:00, 15:00Z = 18:00
    const parts = slotsByPart([
      slot('2026-07-01T06:00:00Z'),
      slot('2026-07-01T11:00:00Z'),
      slot('2026-07-01T15:00:00Z'),
    ]);
    expect(parts.map(([p, list]) => [p, list.length])).toEqual([
      ['morning', 1],
      ['day', 1],
      ['evening', 1],
    ]);
  });

  it('длительность и месяц', () => {
    expect(formatDuration(45)).toBe('45 хв');
    expect(formatDuration(90)).toBe('1 год 30 хв');
    expect(formatDuration(120)).toBe('2 год');
    expect(monthOf('2026-10-07')).toBe('2026-10');
  });

  it('собирает .ics с экранированием', () => {
    const ics = buildIcs({
      uid: 'r1',
      start: '2026-10-07T11:30:00Z',
      end: '2026-10-07T12:30:00Z',
      title: 'Стрижка; жіноча',
      location: 'Київ, вул. Хрещатик, 1',
    });
    expect(ics).toContain('DTSTART:20261007T113000Z');
    expect(ics).toContain('SUMMARY:Стрижка\\; жіноча');
    expect(ics).toContain('LOCATION:Київ\\, вул. Хрещатик\\, 1');
  });
});

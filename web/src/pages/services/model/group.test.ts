import { describe, expect, it } from 'vitest';

import { groupByCategory } from './group';

const s = (name: string, id: string, category: string) => ({
  name,
  category: { id, name: category },
});

describe('услуги по категориям', () => {
  it('группирует в порядке категорий и пропускает пустые', () => {
    const groups = groupByCategory(
      [s('Педикюр', 'n', 'Нігті'), s('Чай', 'o', 'Інше'), s('Манікюр', 'n', 'Нігті')],
      [{ id: 'h' }, { id: 'n' }, { id: 'o' }],
    );
    expect(groups.map((g) => [g.name, g.items.map((i) => i.name)])).toEqual([
      ['Нігті', ['Педикюр', 'Манікюр']],
      ['Інше', ['Чай']],
    ]);
  });

  it('незнакомые категории — в конце', () => {
    const groups = groupByCategory([s('Нове', 'x', 'Нова'), s('Чай', 'o', 'Інше')], [{ id: 'o' }]);
    expect(groups.map((g) => g.id)).toEqual(['o', 'x']);
  });
});

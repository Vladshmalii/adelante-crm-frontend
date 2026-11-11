import { describe, expect, it } from 'vitest';

import {
  addCertificate,
  certificatesPrintHtml,
  groupTemplatesByCategory,
  isCompleteCode,
  isTemplateSellable,
  NO_CATEGORY,
  salonToday,
  scopeHasProducts,
  scopeHasServices,
  templateIdsOf,
  templateValidity,
} from './model';

describe('позиции продажи', () => {
  it('повторный выбор шаблона — +1 шт., id для предпросмотра — по штуке', () => {
    let items = addCertificate([], 'a');
    items = addCertificate(items, 'b');
    items = addCertificate(items, 'a');
    expect(items).toEqual([
      { templateId: 'a', quantity: 2 },
      { templateId: 'b', quantity: 1 },
    ]);
    expect(templateIdsOf(items)).toEqual(['a', 'a', 'b']);
  });
});

describe('isCompleteCode', () => {
  it('регистр, пробелы и дефисы не важны', () => {
    expect(isCompleteCode('adl 22abc dez9k')).toBe(true);
    expect(isCompleteCode('22ABCDEZ9K')).toBe(true);
    expect(isCompleteCode('ADL-22ABC')).toBe(false);
    expect(isCompleteCode(undefined)).toBe(false);
  });
});

describe('certificatesPrintHtml', () => {
  it('бланк на сертификат, текст экранирован', () => {
    const html = certificatesPrintHtml([
      { code: 'ADL-AB2CD-EF3GH', name: 'Манікюр <з покриттям>', amount: '150.00', expiresAt: null },
      { code: 'ADL-ZZZZZ-22222', name: 'Гроші', amount: '1000', expiresAt: null },
    ]);
    expect(html.match(/class="blank"/g)).toHaveLength(2);
    expect(html).toContain('ADL-AB2CD-EF3GH');
    expect(html).toContain('Манікюр &lt;з покриттям&gt;');
    expect(html).toContain('Безстроковий');
  });
});

describe('область шаблона', () => {
  it('услуги и товары по области', () => {
    expect(scopeHasServices('services')).toBe(true);
    expect(scopeHasServices('services_products')).toBe(true);
    expect(scopeHasServices('products')).toBe(false);
    expect(scopeHasProducts('products')).toBe(true);
    expect(scopeHasProducts('services_products')).toBe(true);
    expect(scopeHasProducts('any')).toBe(false);
  });
});

describe('templateValidity', () => {
  it('бессрочный, дни с согласованием, до даты', () => {
    expect(templateValidity({ validDays: null, validUntil: null })).toBe('Безстроковий');
    expect(templateValidity({ validDays: 30, validUntil: null })).toBe('30 днів');
    expect(templateValidity({ validDays: 1, validUntil: null })).toBe('1 день');
    expect(templateValidity({ validDays: 3, validUntil: null })).toBe('3 дні');
    expect(templateValidity({ validDays: null, validUntil: '2024-03-31' })).toBe('до 31.03.2024');
  });
});

const template = (
  name: string,
  patch: Partial<{
    isActive: boolean;
    validUntil: string | null;
    categoryId: string | null;
    sortOrder: number;
  }> = {},
) => ({
  name,
  isActive: true,
  validDays: null,
  validUntil: null,
  categoryId: null,
  sortOrder: 0,
  ...patch,
});

describe('isTemplateSellable', () => {
  it('архив и прошедшая дата «до» не продаются; в сам день — продаётся', () => {
    expect(isTemplateSellable(template('a'), '2026-11-11')).toBe(true);
    expect(isTemplateSellable(template('a', { isActive: false }), '2026-11-11')).toBe(false);
    expect(isTemplateSellable(template('a', { validUntil: '2026-11-11' }), '2026-11-11')).toBe(
      true,
    );
    expect(isTemplateSellable(template('a', { validUntil: '2026-11-10' }), '2026-11-11')).toBe(
      false,
    );
  });

  it('сегодня — по Киеву', () => {
    // 22:30 UTC 10.11 — в Киеве уже 11.11
    expect(salonToday(new Date('2026-11-10T22:30:00Z'))).toBe('2026-11-11');
  });
});

describe('groupTemplatesByCategory', () => {
  it('по порядку категорий, «Без категорії» последней, пустые группы скрыты', () => {
    const groups = groupTemplatesByCategory(
      [
        template('Б', { categoryId: 'c2' }),
        template('А', { categoryId: 'c2' }),
        template('Без', { categoryId: null }),
        template('Невідома', { categoryId: 'gone' }),
        template('Перша', { categoryId: 'c1', sortOrder: 5 }),
      ],
      [
        { id: 'c2', name: 'Друга', sortOrder: 1 },
        { id: 'c1', name: 'Перша кат.', sortOrder: 0 },
        { id: 'c3', name: 'Порожня', sortOrder: 2 },
      ],
    );
    expect(groups.map((g) => g.name)).toEqual(['Перша кат.', 'Друга', NO_CATEGORY]);
    expect(groups[1]?.items.map((t) => t.name)).toEqual(['А', 'Б']);
    expect(groups[2]?.items.map((t) => t.name)).toEqual(['Без', 'Невідома']);
  });
});

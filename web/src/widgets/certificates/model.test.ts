import { describe, expect, it } from 'vitest';

import { addCertificate, certificatesPrintHtml, isCompleteCode, templateIdsOf } from './model';

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

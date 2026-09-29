import { describe, expect, it } from 'vitest';

import { ApiError, conflictRecords, errorMessage, unwrap } from './errors';

const response = (status: number) => new Response(null, { status });

describe('unwrap', () => {
  it('возвращает data при успехе', () => {
    expect(unwrap({ data: { ok: true }, response: response(200) })).toEqual({ ok: true });
  });

  it('бросает ApiError с текстом message бекенда', () => {
    const call = () =>
      unwrap({ error: { message: 'Нет доступа к этому салону' }, response: response(403) });
    expect(call).toThrow(ApiError);
    expect(call).toThrow('Нет доступа к этому салону');
  });

  it('добавляет к ошибке валидации поля из details', () => {
    const error = {
      message: 'Ошибка валидации',
      code: 'validation_error',
      details: { firstName: ['Field required'], phone: ['too short'] },
    };
    try {
      unwrap({ error, response: response(422) });
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).code).toBe('validation_error');
      expect((e as ApiError).message).toBe(
        'Ошибка валидации — firstName: Field required; phone: too short',
      );
    }
    expect.assertions(3);
  });

  it('понимает старый формат FastAPI {detail}', () => {
    expect(() => unwrap({ error: { detail: 'Not Found' }, response: response(404) })).toThrow(
      'Not Found',
    );
  });
});

describe('errorMessage', () => {
  it('сетевую ошибку fetch показывает понятно', () => {
    expect(errorMessage(new TypeError('Failed to fetch'))).toMatch("Немає зв'язку");
  });
  it('прочие TypeError не выдаёт за проблемы сети', () => {
    expect(errorMessage(new TypeError('x.format is not a function'))).toBe(
      'x.format is not a function',
    );
  });
});

describe('conflictRecords', () => {
  const record = {
    id: 'r1',
    startAt: '2026-10-06T07:00:00Z',
    endAt: '2026-10-06T08:00:00Z',
    clientName: 'Анна',
  };

  it('достаёт записи из 409 has_records и не пишет их в текст', () => {
    const error = new ApiError(409, {
      message: 'На цей день є записи',
      code: 'has_records',
      details: { records: [record] },
    });
    expect(error.message).toBe('На цей день є записи');
    expect(conflictRecords(error)).toEqual([record]);
  });

  it('для других ошибок — пусто', () => {
    expect(conflictRecords(new ApiError(422, { message: 'x', code: 'past' }))).toEqual([]);
    expect(conflictRecords(new Error('x'))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';

import { ApiError, errorMessage, unwrap } from './errors';

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

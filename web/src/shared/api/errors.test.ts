import { describe, expect, it } from 'vitest';

import { ApiError, unwrap } from './errors';

const response = (status: number) => new Response(null, { status });

describe('unwrap', () => {
  it('возвращает data при успехе', () => {
    expect(unwrap({ data: { ok: true }, response: response(200) })).toEqual({ ok: true });
  });

  it('бросает ApiError с текстом detail из FastAPI', () => {
    const call = () => unwrap({ error: { detail: 'Нет доступа' }, response: response(403) });
    expect(call).toThrow(ApiError);
    expect(call).toThrow('Нет доступа');
  });

  it('склеивает ошибки валидации 422', () => {
    const error = { detail: [{ msg: 'field required' }, { msg: 'invalid email' }] };
    expect(() => unwrap({ error, response: response(422) })).toThrow(
      'field required; invalid email',
    );
  });
});

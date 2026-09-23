interface FastApiValidationItem {
  loc?: (string | number)[];
  msg?: string;
}

/** Ошибка ответа API. `detail` — поле из ответа FastAPI (строка или список ошибок валидации). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(extractMessage(body) ?? `Ошибка запроса (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object' || !('detail' in body)) return undefined;
  const { detail } = body;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return (detail as FastApiValidationItem[])
      .map((item) => item.msg)
      .filter(Boolean)
      .join('; ');
  }
  return undefined;
}

interface FetchResult<D> {
  data?: D;
  error?: unknown;
  response: Response;
}

/** Превращает результат openapi-fetch в данные или бросает ApiError — под TanStack Query. */
export function unwrap<D>(result: FetchResult<D>): D {
  if (result.error !== undefined) throw new ApiError(result.response.status, result.error);
  // Без ошибки openapi-fetch всегда кладёт data (для 204 — пустой объект/undefined по схеме).
  return result.data as D;
}

/** Текст для пользователя из любой ошибки мутации/запроса. */
export function errorMessage(error: unknown) {
  // fetch бросает TypeError, когда запрос не дошёл: нет сети, бекенд лежит, CORS.
  if (error instanceof TypeError) return "Немає зв'язку з сервером. Спробуйте ще раз.";
  return error instanceof Error ? error.message : 'Щось пішло не так';
}

/**
 * Ошибка ответа API. Бекенд отвечает `{message, code?, details?}`; в `details` — ошибки
 * валидации по полям (`{"firstName": ["Field required"]}`) или данные конфликта
 * (`{"records": [...]}` у 409 смен).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly details: Record<string, unknown> | undefined;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    const parsed = parseBody(body);
    super(parsed.message ?? `Помилка запиту (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = parsed.code;
    this.details = parsed.details;
    this.body = body;
  }
}

interface ParsedBody {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
}

function parseBody(body: unknown): ParsedBody {
  if (!body || typeof body !== 'object') return {};
  const b = body as { message?: unknown; code?: unknown; details?: unknown; detail?: unknown };
  const details =
    b.details && typeof b.details === 'object' ? (b.details as Record<string, unknown>) : undefined;
  let message = typeof b.message === 'string' ? b.message : undefined;
  // Ошибки валидации: показываем, какие поля не прошли, а не только «Ошибка валидации».
  // Данные конфликтов (списки объектов) в текст не попадают — их показывает сама форма.
  const fieldErrors = Object.entries(details ?? {}).filter(
    (entry): entry is [string, string[]] =>
      Array.isArray(entry[1]) && entry[1].every((e) => typeof e === 'string'),
  );
  if (fieldErrors.length > 0) {
    const fields = fieldErrors
      .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
      .join('; ');
    message = message ? `${message} — ${fields}` : fields;
  }
  // Старый формат FastAPI `{detail}` — на случай ответов в обход обработчиков бекенда.
  if (!message && typeof b.detail === 'string') message = b.detail;
  return { message, code: typeof b.code === 'string' ? b.code : undefined, details };
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
  // Другие TypeError — баги в коде, их текст показываем как есть.
  if (error instanceof TypeError && /fetch|network|load failed/i.test(error.message)) {
    return "Немає зв'язку з сервером. Спробуйте ще раз.";
  }
  return error instanceof Error ? error.message : 'Щось пішло не так';
}

/** Запись, из-за которой бекенд отказал (409 `has_records` у смен). */
export interface ConflictRecord {
  id: string;
  startAt: string;
  endAt: string;
  clientName: string;
}

/** Записи из ответа 409 `has_records`; пусто — ошибка другого рода. */
export function conflictRecords(error: unknown): ConflictRecord[] {
  if (!(error instanceof ApiError) || error.code !== 'has_records') return [];
  const records = error.details?.records;
  return Array.isArray(records) ? (records as ConflictRecord[]) : [];
}

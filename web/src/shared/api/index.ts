export { api, publicApi, refreshTokens } from './client';
export { ApiError, type ConflictRecord, conflictRecords, errorMessage, unwrap } from './errors';
export type { components, paths } from './schema.gen';

import type { components } from './schema.gen';

/** Короткий доступ к схемам бекенда: `Schema<'ClientOut'>`. */
export type Schema<K extends keyof components['schemas']> = components['schemas'][K];

/**
 * Генерирует типы Admin API из OpenAPI-схемы бекенда (FastAPI).
 *
 *   npm run api:generate                         # OPENAPI_URL или http://localhost:8000/openapi.json
 *   OPENAPI_URL=./openapi.json npm run api:generate
 *
 * Заголовок X-Salon-Id объявлен в схеме как обязательный параметр каждого
 * салонного эндпоинта, но подставляется middleware клиента (src/shared/api/client.ts),
 * поэтому из схемы он вырезается — иначе его пришлось бы передавать в каждом вызове.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import openapiTS, { astToString } from 'openapi-typescript';

const INJECTED_HEADERS = new Set(['x-salon-id']);
const OUTPUT = resolve(import.meta.dirname, '../src/shared/api/schema.gen.ts');

const source = process.env.OPENAPI_URL ?? 'http://localhost:8000/openapi.json';
const raw = /^https?:\/\//.test(source)
  ? await fetch(source).then((res) => {
      if (!res.ok) throw new Error(`GET ${source} → ${res.status}`);
      return res.text();
    })
  : await readFile(source, 'utf8');

const schema = JSON.parse(raw);

for (const pathItem of Object.values(schema.paths ?? {})) {
  for (const operation of Object.values(pathItem)) {
    if (!operation || !Array.isArray(operation.parameters)) continue;
    operation.parameters = operation.parameters.filter(
      (p) => !(p.in === 'header' && INJECTED_HEADERS.has(String(p.name).toLowerCase())),
    );
  }
}

const ast = await openapiTS(schema, { alphabetize: true });
const banner = '/* Сгенерировано scripts/generate-api.mjs — не редактировать вручную. */\n\n';
await writeFile(OUTPUT, banner + astToString(ast));
console.log(`API types → ${OUTPUT}`);

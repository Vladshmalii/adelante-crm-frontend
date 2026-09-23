// @ts-check
import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import pluginRouter from '@tanstack/eslint-plugin-router';
import prettier from 'eslint-config-prettier';
import boundaries from 'eslint-plugin-boundaries';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Архитектурные слои (сверху вниз). Импортировать можно только «вниз»:
 *   app → routes → pages → widgets → shared
 * - pages/<name>   — один модуль на страницу; страницы не знают друг о друге.
 * - widgets/<name> — переиспользуемые блоки из нескольких страниц (layout и т.п.).
 * - shared/<name>  — инфраструктура без бизнес-логики страниц (api, ui, lib, config).
 * Снаружи в pages/* и widgets/* можно заходить только через index.ts (public API).
 */
const elements = [
  { type: 'app', pattern: 'src/app' },
  { type: 'routes', pattern: 'src/routes' },
  { type: 'page', pattern: 'src/pages/*', capture: ['name'] },
  { type: 'widget', pattern: 'src/widgets/*', capture: ['name'] },
  { type: 'shared', pattern: 'src/shared/*', capture: ['name'] },
  { type: 'test', pattern: 'src/test' },
];

const publicApi = (type) => ({ element: { type, fileInternalPath: 'index.{ts,tsx}' } });
const anyOf = (...types) => ({ element: { types: { anyOf: types } } });

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'src/routeTree.gen.ts', 'src/shared/api/schema.gen.ts']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      pluginRouter.configs['flat/recommended'],
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/only-throw-error': [
        'error',
        // TanStack Router: `throw redirect(...)` / `throw notFound()` — штатный механизм.
        { allow: [{ from: 'package', package: '@tanstack/router-core', name: 'Redirect' }] },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },

  {
    // Файлы роутов экспортируют `Route`, а не компонент — это норма для TanStack Router.
    files: ['src/routes/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.app.json' } },
      'boundaries/elements': elements,
      // Точка входа и сгенерированное дерево роутов связывают слои между собой — вне правил.
      'boundaries/ignore': ['src/*.d.ts', 'src/main.tsx', 'src/routeTree.gen.ts'],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            {
              from: { element: { type: 'app' } },
              allow: [
                { to: anyOf('shared') },
                { to: publicApi('widget') },
                { to: publicApi('page') },
              ],
            },
            {
              from: { element: { type: 'routes' } },
              allow: [
                { to: anyOf('routes', 'shared') },
                { to: publicApi('page') },
                { to: publicApi('widget') },
              ],
            },
            {
              // Страница не импортирует другие страницы — только widgets и shared.
              from: { element: { type: 'page' } },
              allow: [{ to: anyOf('shared') }, { to: publicApi('widget') }],
            },
            {
              from: { element: { type: 'widget' } },
              allow: [{ to: anyOf('shared') }, { to: publicApi('widget') }],
            },
            {
              from: { element: { type: 'shared' } },
              allow: { to: anyOf('shared') },
            },
            {
              from: { element: { type: 'test' } },
              allow: { to: anyOf('shared', 'app') },
            },
          ],
        },
      ],
    },
  },

  {
    files: ['src/**/*.test.{ts,tsx}'],
    rules: {
      // Тесты лежат рядом с кодом и импортируют его напрямую.
      'boundaries/dependencies': 'off',
    },
  },

  {
    files: ['*.{js,ts,mjs}', 'scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['*.ts'],
    extends: [tseslint.configs.recommended],
  },

  prettier,
]);

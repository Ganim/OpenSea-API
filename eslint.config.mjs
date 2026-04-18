import js from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
  globalIgnores(['build/**/*'], 'Ignore Build Directory'),
  globalIgnores(['build-test/**/*'], 'Ignore Build Test Directory'),
  globalIgnores(['node_modules/*'], 'Ignore Node Modules Directory'),
  globalIgnores(['generated/*'], 'Ignore Generated Prisma Directory'),
  globalIgnores(['prisma/*'], 'Ignore Generated Prisma Directory'),
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    // Tests often have setup variables (tenantId, factories) that are
    // referenced only in some `it` blocks. Don't fail lint on those.
    // Must come AFTER tseslint.configs.recommended to actually override.
    files: ['**/*.spec.ts', '**/*.e2e.spec.ts', '**/tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Notifications module isolation — external code must only import
    // from `@/modules/notifications/public/**`. Internal folders are
    // private to the module and change without notice.
    files: ['src/**/*.{ts,mts}'],
    ignores: ['src/modules/notifications/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/modules/notifications/application/*',
                '@/modules/notifications/infrastructure/*',
                '@/modules/notifications/dispatcher/*',
                '@/modules/notifications/domain/*',
                '@/modules/notifications/http/*',
                '@/modules/notifications/workers/*',
                '**/modules/notifications/application/*',
                '**/modules/notifications/infrastructure/*',
                '**/modules/notifications/dispatcher/*',
                '**/modules/notifications/domain/*',
                '**/modules/notifications/http/*',
                '**/modules/notifications/workers/*',
              ],
              message:
                'Import only from `@/modules/notifications/public`. Internal folders are private to the notifications module.',
            },
          ],
        },
      ],
    },
  },
  {
    // Notifications module must not import from business modules.
    // It is a standalone product — other modules depend on it, not the other way around.
    files: ['src/modules/notifications/**/*.{ts,mts}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/modules/hr/*',
                '@/modules/sales/*',
                '@/modules/stock/*',
                '@/modules/finance/*',
                '@/modules/requests/*',
                '@/modules/calendar/*',
                '@/modules/tasks/*',
                '@/modules/email/*',
                '@/modules/admin/*',
                '@/use-cases/hr/*',
                '@/use-cases/sales/*',
                '@/use-cases/stock/*',
                '@/use-cases/finance/*',
                '@/use-cases/requests/*',
                '@/use-cases/calendar/*',
                '@/use-cases/tasks/*',
                '@/use-cases/admin/*',
              ],
              message:
                'The notifications module must stay isolated from business modules. Consumers emit events via NotificationClient; notifications never imports business logic.',
            },
          ],
        },
      ],
    },
  },
]);

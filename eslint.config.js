import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        browser: 'readonly',
        driver: 'readonly',
        $: 'readonly',
        $$: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        before: 'readonly',
        beforeEach: 'readonly',
        after: 'readonly',
        afterEach: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  prettier,
  {
    ignores: [
      'node_modules',
      'test-results',
      'allure-report',
      'allure-results',
      'dist',
      '.claude',
      '.bmad-loop',
      '_bmad',
      '_bmad-output',
      'design-artifacts',
      'apk',
    ],
  },
];

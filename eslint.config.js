const js = require('@eslint/js');
const globals = require('globals');
const prettierConfig = require('eslint-config-prettier/flat');
const n = require('eslint-plugin-n');

module.exports = [
  {
    ignores: ['public/**', 'dev-data/**'],
  },
  js.configs.recommended,
  n.configs['flat/recommended-script'], // Node rules, CommonJS variant
  {
    languageOptions: {
      globals: { ...globals.node },
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^(req|res|next|val)$' },
      ],
      'no-console': 'warn',
      'no-process-exit': 'off',
      'prefer-destructuring': ['error', { object: true, array: false }],
    },
  },
  prettierConfig,
];

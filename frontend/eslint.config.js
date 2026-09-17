import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Capitalized names are React components used in JSX (e.g. { icon: Icon }).
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^(_|[A-Z])' }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
    },
  },
  {
    // The entry file renders the app; Fast Refresh boundaries do not apply to it.
    files: ['src/main.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['vite.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
];

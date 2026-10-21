import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { reactRefresh } from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

const NO_DOM_MESSAGE = 'Direct DOM access is not allowed: let React render the UI.';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      react.configs.flat['jsx-runtime'],
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite(),
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: '18.3' } },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    rules: {
      'react/prop-types': 'off',
      'react/no-array-index-key': 'error',
      'react/jsx-no-useless-fragment': 'error',
      'react/self-closing-comp': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'no-console': 'error',
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-restricted-properties': [
        'error',
        ...['querySelector', 'querySelectorAll', 'getElementById', 'getElementsByClassName', 'getElementsByTagName', 'createElement']
          .map((property) => ({ object: 'document', property, message: NO_DOM_MESSAGE })),
      ],
      'no-restricted-syntax': [
        'error',
        { selector: "MemberExpression[property.name=/^(innerHTML|outerHTML)$/]", message: NO_DOM_MESSAGE },
      ],
    },
  },
  {
    // Mounting the React root is the single place that needs a DOM node.
    files: ['src/main.jsx'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['*.config.js'],
    languageOptions: { globals: globals.node },
  },
]);

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:jsx-a11y/recommended',
    'plugin:security/recommended-legacy',
    'plugin:sonarjs/recommended',
    'prettier', // Must be last to override other configs
  ],
  ignorePatterns: [
    'dist',
    '.eslintrc.cjs',
    'node_modules',
    'node_modules._bak_*',
    '*.gen.ts',
    'playwright-report',
    'test-results',
    'coverage',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh', 'jsx-a11y', 'security', 'sonarjs', 'prettier'],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    'prettier/prettier': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    // Disable prop-types checks for a TypeScript codebase (handled by TS types)
    'react/prop-types': 'off',
    // Allow `any` but keep it as a warning so developers are notified
    '@typescript-eslint/no-explicit-any': 'warn',
    // Avoid failing the CI for lexical declarations in switch cases; warn instead
    'no-case-declarations': 'warn',
    // Relax unescaped-entities so apostrophes/quotes in text don't fail the linter
    'react/no-unescaped-entities': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

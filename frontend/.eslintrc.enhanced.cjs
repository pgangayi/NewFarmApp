/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    jest: true,
    node: true,
    es6: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:jsx-a11y/recommended',
    'plugin:sonarjs/recommended',
    'plugin:security/detect-object-injection',
    'plugin:security/detect-non-literal-regexp',
    'prettier', // Must be last to override other configs
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'node_modules', '*.gen.ts', 'build', 'coverage'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'script',
  },
  plugins: ['react-refresh', 'prettier', '@typescript-eslint', 'sonarjs', 'security', 'jsx-a11y'],
  rules: {
    // React Refresh
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Prettier integration
    'prettier/prettier': 'error',

    // TypeScript rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-var-requires': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',

    // React rules
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/no-unescaped-entities': 'warn',
    'react/jsx-key': [
      'error',
      {
        checkFragmentShorthand: true,
        checkKeyMustBeforeSpread: true,
        checkPropSpread: true,
      },
    ],
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
    'react/display-name': 'error',
    'react/no-children-prop': 'error',
    'react/no-danger': 'warn',
    'react/no-unused-prop-types': 'error',

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-template': 'error',
    'no-duplicate-imports': 'error',
    'no-unused-expressions': 'error',
    'no-return-assign': 'error',
    'no-param-reassign': ['error', { props: false }],
    'prefer-arrow-callback': 'error',
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    quotes: ['error', 'single', { allowTemplateLiterals: true }],

    // Security
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'warn',

    // Accessibility
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-has-content': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/aria-roles': 'error',
    'jsx-a11y/img-redundant-alt': 'error',
    'jsx-a11y/label-has-associated-control': 'error',

    // SonarJS
    'sonarjs/cognitive-complexity': ['warn', 15],
    'sonarjs/max-switch-cases': ['error', 30],
    'sonarjs/no-duplicate-string': 'warn',
    'sonarjs/no-identical-functions': 'warn',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/prefer-immediate-return': 'warn',

    // Disable CommonJS warnings for this config file
    'no-global-assign': 'off',
    'no-implicit-globals': 'off',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

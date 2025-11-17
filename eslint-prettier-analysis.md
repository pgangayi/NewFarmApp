# ESLint & Prettier Configuration Analysis

## Current Configuration Review

### Current ESLint Configuration (`.eslintrc.cjs`)

**Strengths:**

- ✅ Good TypeScript integration with `@typescript-eslint/recommended`
- ✅ React hooks support with `plugin:react-hooks/recommended`
- ✅ Prettier integration with `'prettier'` as last extension
- ✅ Ignores unnecessary patterns (`dist`, `node_modules`, `*.gen.ts`)
- ✅ Smart unused variables pattern with `_` prefix ignoring

**Areas for Improvement:**

- ❌ Missing accessibility linting (`jsx-a11y`)
- ❌ No security linting rules
- ❌ Limited TypeScript type checking integration
- ❌ No complexity or code quality rules
- ❌ Basic React rules (could be more strict)
- ❌ No import/order enforcement

### Current Prettier Configuration (`.prettierrc`)

**Strengths:**

- ✅ Reasonable print width (100)
- ✅ Consistent single quotes
- ✅ Modern trailing comma handling
- ✅ Proper tab width

**Areas for Improvement:**

- ❌ Missing bracket spacing configuration
- ❌ No prose wrapping for markdown
- ❌ Could benefit from additional formatting rules

## Enhanced Configuration Recommendations

### Enhanced ESLint Rules

#### Security Enhancements

```javascript
// Security Rules
'security/detect-object-injection': 'error',
'security/detect-non-literal-regexp': 'error',
'security/detect-unsafe-regex': 'error',
'security/detect-buffer-noassert': 'warn',
```

#### Accessibility Enhancements

```javascript
// A11y Rules
'jsx-a11y/alt-text': 'error',
'jsx-a11y/anchor-has-content': 'error',
'jsx-a11y/anchor-is-valid': 'error',
'jsx-a11y/aria-roles': 'error',
'jsx-a11y/img-redundant-alt': 'error',
'jsx-a11y/label-has-associated-control': 'error',
```

#### Code Quality Enhancements

```javascript
// Enhanced TypeScript
'@typescript-eslint/strict-boolean-expressions': 'warn',
'@typescript-eslint/prefer-nullish-coalescing': 'error',
'@typescript-eslint/prefer-optional-chain': 'error',
'@typescript-eslint/cognitive-complexity': ['warn', 15],

// Enhanced React
'react/jsx-key': ['error', {
  checkFragmentShorthand: true,
  checkKeyMustBeforeSpread: true,
  checkPropSpread: true
}],
'react/jsx-no-duplicate-props': 'error',
'react/display-name': 'error',
'react/no-unused-prop-types': 'error',
```

#### General Code Quality

```javascript
// Modern JavaScript
'prefer-const': 'error',
'prefer-template': 'error',
'no-duplicate-imports': 'error',
'no-unused-expressions': 'error',
'prefer-arrow-callback': 'error',
'comma-dangle': ['error', 'always-multiline'],
'quotes': ['error', 'single', { allowTemplateLiterals: true }],
```

### Enhanced Prettier Configuration

```javascript
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "bracketSameLine": false,
  "htmlWhitespaceSensitivity": "css",
  "proseWrap": "preserve",
  "insertPragma": false,
  "requirePragma": false,
  "embeddedLanguageFormatting": "auto"
}
```

## Required Additional Dependencies

Add to `devDependencies` in `package.json`:

```json
{
  "devDependencies": {
    "eslint-plugin-security": "^3.0.1",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "eslint-plugin-sonarjs": "^0.24.0",
    "@typescript-eslint/eslint-plugin": "^6.14.0",
    "@typescript-eslint/parser": "^6.14.0",
    "eslint-plugin-prettier": "^5.5.4",
    "prettier": "^3.6.2",
    "lint-staged": "^16.2.6",
    "husky": "^9.1.7"
  }
}
```

## Enhanced Scripts for package.json

```json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "lint:staged": "lint-staged",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,md}\"",
    "type-check": "tsc --noEmit",
    "quality-check": "npm run type-check && npm run lint && npm run format:check"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"],
    "*.{ts,tsx}": ["tsc --noEmit"]
  }
}
```

## Husky Configuration

Add to `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

Add to `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no-install commitlint --edit "$1"
```

## GitHub Actions Workflow

Create `.github/workflows/code-quality.yml`:

```yaml
name: Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  code-quality:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: "frontend/package-lock.json"

      - name: Install dependencies
        run: cd frontend && npm ci

      - name: Type check
        run: cd frontend && npm run type-check

      - name: Run ESLint
        run: cd frontend && npm run lint

      - name: Check Prettier formatting
        run: cd frontend && npm run format:check

      - name: Run tests
        run: cd frontend && npm test
```

## Implementation Priority

### Phase 1: Quick Wins (Low Risk)

1. Update Prettier configuration with additional rules
2. Add missing ESLint plugins to dependencies
3. Enhance ESLint rules incrementally

### Phase 2: Enhanced Rules (Medium Risk)

1. Add security linting rules
2. Add accessibility linting rules
3. Add complexity limits and code quality rules

### Phase 3: CI Integration (High Impact)

1. Set up GitHub Actions workflow
2. Configure Husky pre-commit hooks
3. Add commit message linting

## Benefits of Enhanced Configuration

1. **Security**: Catch security vulnerabilities early
2. **Accessibility**: Ensure web accessibility standards
3. **Code Quality**: Maintain consistent, high-quality code
4. **Developer Experience**: Automated fixes and better error messages
5. **Team Collaboration**: Consistent coding standards across team
6. **CI/CD Integration**: Automated quality checks in pull requests

## Migration Strategy

1. **Start Small**: Begin with Prettier enhancements
2. **Incremental ESLint**: Add rule categories one by one
3. **Team Training**: Educate team on new rules and auto-fixes
4. **Monitor Impact**: Track false positives and adjust rules as needed
5. **Full Integration**: Complete CI/CD setup once local setup is stable

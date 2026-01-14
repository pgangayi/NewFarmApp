I have investigated the issue with the excessive number of reported problems (14,000+).

### Root Cause

The issue was caused by the presence of a backup directory `frontend/node_modules._bak_20251031160544/`.

- This folder contains a full copy of your project dependencies.
- Neither **ESLint** nor **TypeScript** were configured to ignore this specific directory pattern.
- As a result, VS Code was trying to lint and type-check every single file inside this backup folder, leading to thousands of errors.

### Fixes Applied

1.  **Updated `.eslintrc.cjs`**:

    - Added `node_modules._bak_*` to `ignorePatterns`.
    - Added `playwright-report`, `test-results`, and `coverage` to `ignorePatterns` to prevent future noise.

2.  **Updated `tsconfig.json`**:
    - Added an `exclude` section (which was missing) to explicitly exclude:
      - `node_modules`
      - `node_modules._bak_*`
      - `dist`
      - `coverage`
      - `playwright-report`
      - `test-results`

### Result

VS Code should now ignore the backup folder, and the number of reported problems should drop back down to the expected range (around ~650 linting issues that we are working on). You may need to **restart the ESLint server** or **reload the VS Code window** for the changes to take full effect immediately.

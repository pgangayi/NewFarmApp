I have analyzed the current linting issues.

### Why the count increased
The number of reported problems increased because we **enabled additional linting rules** in the previous step to improve code quality and security. Specifically:
*   **`sonarjs`**: Flags code complexity, duplication, and bugs (e.g., "Define a constant instead of duplicating this literal").
*   **`security`**: Flags potential security vulnerabilities (e.g., "Generic Object Injection Sink").
*   **`jsx-a11y`**: Flags accessibility issues (e.g., "A form label must be associated with a control").

These are *new* checks running on *existing* code, which is why the count went up. This is actually a good thing—it means we are now seeing issues that were previously hidden!

### Current Status
*   **Total Problems:** ~589 (162 errors, 427 warnings)
*   **Key Issues:**
    *   `sonarjs/no-duplicate-string`: Repeated string literals that should be constants.
    *   `jsx-a11y/label-has-associated-control`: Form inputs missing proper labels.
    *   `security/detect-object-injection`: Potential security risks in object access.
    *   `@typescript-eslint/no-explicit-any`: Usage of `any` type (warnings).

### Plan to Fix
I will now proceed to fix these issues systematically, starting with the most common and impactful ones:
1.  **Fix `sonarjs/no-duplicate-string`**: Extract repeated strings into constants.
2.  **Fix `jsx-a11y` errors**: Add proper labels to form inputs.
3.  **Fix `security` warnings**: Validate object keys or disable false positives where safe.
4.  **Fix `sonarjs/cognitive-complexity`**: Refactor complex functions.

I will start by fixing the `sonarjs/no-duplicate-string` errors as they are the most numerous and easiest to resolve safely.

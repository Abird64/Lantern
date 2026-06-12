---
name: compile-check
description: Run TypeScript and Rust compilation checks for the Lantern (提灯) Tauri project. Use after making code changes to verify both frontend (React/TypeScript) and backend (Rust/Tauri) compile without errors. Provides a unified pass/fail report with parsed error details.
version: 1.0.0
user-invocable: true
argument-hint: "[ts|rust|both]"
---

Runs TypeScript and Rust compilation checks for the Lantern project, parses errors, and provides a clear summary.

## When to Use

- After making code changes to verify compilation
- Before committing to ensure no type errors
- When debugging build issues
- As a verification step in development workflow

## Procedure

### Step 1: TypeScript Check

Run the TypeScript compiler in type-check mode:

```bash
cd D:/code/try/Light/shijie && npx tsc --noEmit 2>&1
```

**Parse the output:**
- If empty output → TypeScript check passed
- If errors → Extract file paths, line numbers, and error messages
- Common errors: type mismatches, missing imports, undefined variables

### Step 2: Rust Check

Run Cargo check for the Tauri backend:

```bash
cd D:/code/try/Light/shijie/src-tauri && cargo check 2>&1
```

**Parse the output:**
- If `Finished` line → Rust check passed
- If errors → Extract file paths, line numbers, and error messages
- Common errors: type mismatches, missing trait implementations, borrow checker issues

### Step 3: Report Summary

Provide a unified report:

```
## Compilation Check Results

### TypeScript: ✅ PASS / ❌ FAIL
[Error count and first few errors if failed]

### Rust: ✅ PASS / ❌ FAIL
[Error count and first few errors if failed]

### Overall: ✅ ALL PASS / ❌ ERRORS FOUND
```

## Error Handling

- If TypeScript fails: List the first 5 errors with file paths and line numbers
- If Rust fails: List the first 5 errors with file paths and line numbers
- If both fail: Prioritize TypeScript errors (frontend) first, then Rust (backend)

## Notes

- This project uses oxc (Vite 8 default) which has JSX nesting limitations
- Deep nested ternaries may cause parse errors - extract subcomponents as workaround
- Always ensure each JSX tag is properly closed
- The Rust backend uses Tauri 2 with `cdylib` crate type for Android/Windows builds

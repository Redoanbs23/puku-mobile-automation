# LOGIN-TC-005: Both auth entry points render on the login screen

**Priority:** P0
**Linked automated test:** `LOGIN-E2E-005` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable on the target device.
- The app starts from the logged-out login screen (established default precondition for login-screen scenarios; the framework's default app-data reset at session start guarantees this).

## Steps

1. Launch the PUKU app (`sh.puku.app`).
2. Observe that the login screen appears (app does not crash).
3. Confirm the "Continue with Google" button is visible on screen.
4. Confirm the "Enter your email" button is visible on screen.
5. Do NOT tap either button — this scenario verifies that both auth entry points render; it does not initiate authentication.

## Expected Result

The login screen renders with both auth entry points visible: "Continue with Google" and "Enter your email". The app does not crash.

## Status

Not Run

## Notes

Automation status: Automated (passing) — `tests/specs/auth/login-screen.spec.ts`. Mirrors the scope of `LOGIN-E2E-002` (login screen renders without crash) by additionally asserting both auth entry points that render on it are present. Verification is display-only; the redirect behavior of "Continue with Google" is covered separately by `LOGIN-E2E-007`, and the email-auth toast behavior by `LOGIN-E2E-008`.
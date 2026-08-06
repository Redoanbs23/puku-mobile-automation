# LOGIN-TC-002: App launches, login screen renders without crash

**Priority:** P0
**Linked automated test:** `LOGIN-E2E-002` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable on the target device.
- Verified on both emulator (Pixel_7, API 34) and physical device (RF8T802226Y).

## Steps

1. Launch the PUKU app (`sh.puku.app`).
2. Observe that the login screen appears (app does not crash).
3. Confirm the "Puku Editor" title text is visible on screen.
4. Confirm the "Continue with Google" button is visible on screen.

## Expected Result

The login screen renders without the app crashing. The "Puku Editor" title is visible, and the "Continue with Google" button is visible.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/auth/login-screen.spec.ts`. Verified 2026-08-04 on both emulator (Pixel_7, API 34) and physical device (RF8T802226Y). Status above reflects this automated verification; no separate manual execution has been logged.

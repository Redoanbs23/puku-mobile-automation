# LOGIN-TC-008: Enter your email shows the "not connected" toast (R1 regression guard)

**Priority:** P0
**Linked automated test:** `LOGIN-E2E-008` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** R1 (email-auth sign-in flow broken — blocks exploration past login)

## Preconditions

- PUKU APK (`sh.puku.app`) installed and launchable.
- App starts on the logged-out login screen (the framework's default session-start app-data reset guarantees this for login-screen scenarios).
- Physical device or emulator visible to the test target.

## Steps

1. Launch the PUKU app (`sh.puku.app`).
2. Wait for login screen via existing `loginScreen.waitUntilDisplayed()`.
3. Tap **Enter your email** (reusing the existing `loginScreen.tapEnterYourEmail()` helper).
4. Observe the transient notification.

## Expected Result

The app displays the notification: **`Email sign-in flow is not connected yet`** (full exact string — live-verified 2026-08-24 on physical A13).

No authentication is initiated. The app remains on the login screen.

> **R1 guard interpretation:** This is a *temporary* guard. It is deliberately expected to **fail** when the email sign-in flow becomes implemented — that failure is the scope-change signal, not a defect to be fixed by greening the assertion.

## Status

Pass

## Notes

Automation status: Automated — `tests/specs/auth/login-screen.spec.ts` (`LOGIN-E2E-008 @p0`), using the existing `tapEnterYourEmail()` helper and the new `loginScreen.emailNotConnectedSnackBar` getter (accessibility-id — `byContentDesc('Email sign-in flow is not connected yet')`). No polling utility, no CI/CD change. When this guard eventually fails because email sign-in works, review and re-open the epic scope.
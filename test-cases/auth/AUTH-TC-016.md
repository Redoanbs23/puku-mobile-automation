# AUTH-TC-016: Logged-in user can log out via Settings and is redirected to the login screen

**Priority:** P1 (judgment call — not sourced from test-design-epic-auth-login.md's coverage matrix; this scenario post-dates that document. Same reasoning as AUTH-TC-015: a real user-facing flow, but device-dependent so it can't gate the CI-portable suite the way a P0 does.)
**Linked automated test:** `AUTH-E2E-016` (tests/specs/auth/logout.spec.ts)
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session — either already logged in, or established first by completing AUTH-TC-015's flow (Continue with Google → Authorize Puku App).
- Not meaningful on CI or a fresh emulator, for the same reasons as AUTH-TC-015.

## Steps

1. Ensure you're logged in to PUKU (launch the app; if the login screen appears, complete AUTH-TC-015 first).
2. From the home screen, tap the hamburger menu icon (top-left).
3. In the menu that opens, tap the profile avatar ("P", bottom-left).
4. On the Settings screen, scroll down to the bottom.
5. Tap "Log out".

## Expected Result

The app redirects to the login screen, showing the "Puku Editor" title.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/auth/logout.spec.ts`. Requires the `DEVICE_UDID` environment variable set to run (the test skips itself otherwise). Verified against physical device `RF8T802226Y` on 2026-08-06.

The hamburger menu icon (step 2) has no content-desc, resource-id, or text — a real accessibility gap (see `ai-log/lessons-learned.md`). The automated test taps it by fixed screen coordinates, which is fragile and tied to this device's screen size/DPI; a manual tester should have no trouble locating it visually, but this is worth knowing if this case is ever re-automated against a different device.

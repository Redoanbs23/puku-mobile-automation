# AUTH-TC-015: OAuth consent tap flow logs in to PUKU (pre-authenticated device only)

**Priority:** P1 (judgment call — not sourced from test-design-epic-auth-login.md's coverage matrix; this scenario post-dates that document, added after ADR-006's finding. Important since it unblocks testing beyond the login screen on a pre-authenticated device, but device-dependent so it can't gate the CI-portable suite the way a P0 does.)
**Linked automated test:** `AUTH-E2E-015` (tests/specs/auth/oauth-consent.spec.ts)
**Linked risk(s):** R2 (narrowed per ADR-006 — see docs/adr/ADR-006-oauth-consent-automation.md)

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com` (a dedicated test account, never a personal one, per R3 credential-hygiene practice).
- Not meaningful on CI or a fresh emulator — neither has a pre-configured, pre-authorized Google account (ADR-006).

## Steps

1. Launch the PUKU app (`sh.puku.app`) on the pre-authenticated physical device.
2. On the login screen, tap "Continue with Google".
3. Observe: Google silently re-authenticates using the already-signed-in OS account (no account picker, no credential or 2FA prompt), and Chrome opens showing PUKU's own consent page, titled "Authorize Puku App".
4. Tap "Authorize Puku App".
5. Observe the app return to PUKU's own UI (Chrome closes).
6. Confirm the home screen is showing, with "How can i help you today!" visible.

## Expected Result

No credentials are typed at any point. After tapping "Authorize Puku App", the app returns to PUKU's own UI and displays the logged-in home screen with "How can i help you today!" visible.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/auth/oauth-consent.spec.ts`. Requires the `DEVICE_UDID` environment variable set to run (the test skips itself otherwise). Verified against physical device `RF8T802226Y` on 2026-08-06. Not CI-portable — see ADR-006 for the full explanation and named risks (including the `editorpuku@gmail.com` account dependency).

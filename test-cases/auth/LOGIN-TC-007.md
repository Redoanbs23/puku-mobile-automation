# LOGIN-TC-007: Tapping Continue with Google redirects to the external Chrome OAuth consent screen

**Priority:** P1 (test-design-epic-auth-login.md coverage matrix — R2 mitigation)
**Linked automated test:** `LOGIN-E2E-007` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** R2

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- App is on the logged-out login screen (clean/default state).
- Must run on a physical device with a Google account already signed in at the OS level — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical device `R58T90F5ALY` (Samsung Galaxy A13, SM-A135F, Android 14), account `editorpuku@gmail.com` (a dedicated test account, never a personal one, per R3 credential-hygiene practice).
- Not meaningful on CI or a fresh emulator — neither has a pre-authenticated Google account (ADR-006).

## Steps

1. Launch the PUKU app (`sh.puku.app`) and confirm the login screen is shown (logged-out state).
2. Tap "Continue with Google".
3. Observe the app hand off to the external **Chrome** browser (Chrome Custom Tab).
4. On the rendered consent page, observe PUKU's own `puku.sh` web page (not Google's UI), showing the **"Authorize Puku App"** button and the account context "Signed in as editorpuku@gmail.com. Grant access…".
5. Verify the "Authorize Puku App" button is present.
6. **Do NOT** tap "Authorize Puku App" and do not complete OAuth.
7. Back out of the Chrome Custom Tab (system back).
8. Confirm the app returns to the **logged-out login screen**.

## Expected Result

Tapping "Continue with Google" redirects the app to the external Chrome browser (Chrome Custom Tab) rendering PUKU's OAuth consent page. The "Authorize Puku App" button is visible. The test does not authorize or complete OAuth. After backing out of the custom tab, the app returns to the logged-out login screen (clean default state).

## Actual Result

Matches the expected result on physical device `R58T90F5ALY` (Samsung Galaxy A13, SM-A135F, Android 14): tapping "Continue with Google" redirected to `com.android.chrome` (Chrome Custom Tab), the PUKU `puku.sh` consent page rendered with the "Authorize Puku App" button, no OAuth was completed, and backing out returned to the logged-out login screen.

## Status

Pass

## Notes

- Linked automated test: `LOGIN-E2E-007` (tests/specs/auth/login-screen.spec.ts) — automated and passing.
- Required environment: `DEVICE_NAME=SM-A135F` / `DEVICE_UDID=R58T90F5ALY` (physical A13). The test skips itself when `DEVICE_UDID` is unset (CI / fresh emulator).
- Never completes OAuth — the consent page is only reached and its "Authorize Puku App" button asserted, per the R2 hard boundary.
- No real AI message is sent.
- Clean/default app state is left afterward (logged-out login screen).
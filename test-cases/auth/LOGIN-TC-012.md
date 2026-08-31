# LOGIN-TC-012: Back navigation from Chrome OAuth redirect returns app to a sane login-screen state

**Priority:** P2 (test-design-epic-auth-login.md coverage matrix)
**Linked automated test:** `LOGIN-E2E-012` (tests/specs/auth/auth-secondary.spec.ts)
**Linked risk(s):** — (none; scenario notes column is empty in the design doc)

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- App is on the logged-out login screen (clean/default state).
- Must run on a real device — the SUT is the OS-level back-press behavior from a Chrome Custom Tab. Mirrors the device-dependency of LOGIN-E2E-007.
- **No pre-authenticated Google account is required.** The scenario only asserts what happens after the system back key is pressed from the OAuth redirect; it does not require the Custom Tab to render any specific page content (consent page, Google sign-in prompt, error page — any of these is fine, since the assertion targets the back-nav result, not the page content).

## Steps

1. Launch the PUKU app (`sh.puku.app`) and confirm the login screen is shown (logged-out state).
2. Tap "Continue with Google".
3. Observe the app hand off to the external **Chrome** browser (Chrome Custom Tab).
4. **Without tapping anything inside the Custom Tab**, press the system back key once.
5. Observe the foreground transition back to PUKU.
6. Confirm the app is on the **logged-out login screen** (same state as before the tap).

## Expected Result

Tapping "Continue with Google" hands off to external Chrome (a Chrome Custom Tab). A single system back-press from the Custom Tab returns PUKU to the foreground on the logged-out login screen. The app survives the round trip without crashing, the OAuth flow is left uncompleted, and the device is left in the clean default state (no session was created, no chat message was sent, no account state was changed).

The scenario intentionally does not assert anything about the Custom Tab's page content — that is the territory of `LOGIN-E2E-007` (redirect-only) and `AUTH-E2E-015` (consent-page UI), and neither is in scope here.

## Actual Result

Physically validated on the Samsung Galaxy A13 (`R58T90F5ALY`) on 2026-08-31 against `apk/app-prod-release.apk` (PUKU 1.0.3, lastUpdateTime 2026-08-11 12:49:23). Two automated runs were executed against the LOGIN-E2E-012 test on this device on 2026-08-31:

- **First run** (pre-observability-pause): `npm test -- --mochaOpts.grep="LOGIN-E2E-012"` → PASS, `1 passing (8.7s)`, exit 0. Session ID `f61d32e6-c7c4-44c6-bb31-b40a0b52525c`. Terminal output retained to `evidence/login012-run.txt` (overwritten by the second run below; first-run summary captured in `ai-log/daily-progress.md`).
- **Second run** (post-observability-pause, the variant retained in the implementation): `npm test -- --mochaOpts.grep="LOGIN-E2E-012"` → PASS, `1 passing (7.5s)`, exit 0. Session ID `14275f8e-b1f8-482c-b011-d7806d14ed88`. Terminal output retained to `evidence/login012-run.txt`.

Observed sequence during the second (retained) run, with timestamps from the Appium/WebdriverIO log:

1. **Login screen present** before the run began — `findElement("accessibility id", "Continue with Google")` succeeded at 06:07:49.574Z with the element reported as `displayed=true` at 06:07:50.551Z. The PUKU `MainActivity` was the foreground activity (verified before launch via `dumpsys activity activities`).
2. **Tap "Continue with Google"** — `elementClick` posted at 06:07:50.653Z, server-confirmed at 06:07:51.486Z. The implementation then performs a brief explicit `driver.pause(1000)` before the next synchronization step (added on 2026-08-31 to make the intermediate Chrome Custom Tab window visibly observable during local physical execution; the pause is not an assertion and does not weaken or replace any of the package-wait synchronizations that follow).
3. **Chrome Custom Tab becomes visible** — `mobile: getCurrentPackage` first observed returning `com.android.chrome` at 06:07:52.691Z (the Chrome foreground window then stayed open until the back-press).
4. **System back-press performed by the test** — `back()` posted at 06:07:52.692Z, server-confirmed at 06:07:54.696Z. (No manual back-press was issued by the operator; the test drove the action.)
5. **PUKU returns to foreground** — `mobile: getCurrentPackage` returned `sh.puku.app` at 06:07:54.823Z.
6. **Login screen visible again** — `findElement("accessibility id", "Continue with Google")` succeeded at 06:07:54.824Z with `displayed=true` at 06:07:55.393Z. This is the logged-out login screen — the same UI state the precondition required.
7. **Title assertion passes** — `findElement("accessibility id", "Puku Editor")` succeeded at 06:07:55.397Z with `displayed=true` at 06:07:55.575Z. The teardown assertion `expect(loginScreen.titleElement).toBeDisplayed()` (mirroring the LOGIN-E2E-002 "no crash / sane-state signal") passed.

The Chrome→back→PUKU sequence was visibly observable on the device between 06:07:52.691Z and 06:07:54.823Z (~2 seconds of Chrome Custom Tab visibility). No OAuth flow was completed; no chat message was sent; no account state was changed; the device was left in the clean default logged-out login screen by the test's own teardown assertion.

Static validation re-run after the same change also passed: `npm run typecheck` → exit 0, no output; `npm run lint` → exit 0, no output. (Captured to `evidence/login012-typecheck.txt` and `evidence/login012-lint.txt`.)

Reconnaissance observations from 2026-08-28 (logged in the prior version of this file) — that tapping "Continue with Google" hands off to PUKU's own `puku.sh/api/oauth/authorize` URL in the Custom Tab regardless of the device's Google-account state, and that a single system back returns cleanly to `sh.puku.app/.MainActivity` — were both reproduced by the automated run on 2026-08-31. No additional discrepancies found.

## Status

Pass

## Notes

- **Linked automated test:** `LOGIN-E2E-012` (tests/specs/auth/auth-secondary.spec.ts) — implementation complete on `feat/login-e2e-012`; physically validated on 2026-08-31 (see Actual Result above).
- **Boundary contract:** mirrors `LOGIN-E2E-007`'s R2 hard boundary — never asserts on the Custom Tab's page content, never calls `oauthConsentScreen.tapAuthorize()`, never completes OAuth. The scope is strictly "system back from Chrome OAuth redirect returns to a sane login-screen state."
- **Required environment:** `DEVICE_UDID=R58T90F5ALY` (or any real device; the test skips itself when `DEVICE_UDID` is unset, mirroring `LOGIN-E2E-006/007`).
- **No pre-authenticated Google account required.** The reconnaissance probe (2026-08-28) confirmed that PUKU's OAuth flow opens its own `puku.sh/api/oauth/authorize` URL in the Custom Tab regardless of whether a Google account is currently signed in at the OS level — the device had no `com.google` account present in `dumpsys account` at probe time, and the redirect still occurred. This contradicts the assumption baked into `LOGIN-TC-007` / `LOGIN-E2E-007` documentation, which state that without a pre-authenticated account the same tap "lands on full Google credential entry / 2FA"; that assumption is a property of older builds or a different OAuth flow, not of the current app. Worth re-examining separately when `LOGIN-E2E-007` is next touched.
- **No real AI message is sent.**
- **Clean/default app state is left afterward** (logged-out login screen — same as the precondition). The test's explicit teardown assertion (`expect(loginScreen.titleElement).toBeDisplayed()`) verifies this end-state as a post-condition, not an implicit assumption.
- **No commit or PR created yet.** Implementation is on branch `feat/login-e2e-012`; git operations are handled separately.

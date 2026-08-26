# LOGIN-TC-010: App remains on the login screen (no crash) after the broken email-auth toast

**Priority:** P1
**Linked automated test:** `LOGIN-E2E-010` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** NFR-Reliability

## Preconditions

- PUKU APK (`sh.puku.app`) installed and launchable.
- App starts on the logged-out login screen (the framework's default session-start app-data reset guarantees this for login-screen scenarios).
- Physical device or emulator visible to the test target.
- This scenario is emulator-safe: it does not require the pre-authenticated Google account that AUTH-E2E-015 / ADR-006 depends on, and does not require any `APP_NO_RESET` state.

## Steps

1. Launch the PUKU app (`sh.puku.app`).
2. Wait for the login screen via the existing `loginScreen.waitUntilDisplayed()` helper.
3. Tap **Enter your email** (reusing the existing `loginScreen.tapEnterYourEmail()` helper).
4. Observe the transient notification that the broken email-auth flow raises (R1 in the test design).
5. Wait for the SnackBar's natural dismiss window (Flutter SnackBar default ~4s) — do not press any control; the test observes, not interacts further.
6. Read the current package name and confirm the login screen is still rendered.

## Expected Result

**"No crash" is operationalized as three observable invariants**, each checked independently:

1. **The broken email-auth SnackBar appears** — content-desc `Email sign-in flow is not connected yet`, class `android.view.View` (the same node `LOGIN-E2E-008` asserts). The SnackBar appearing proves the intended failure path actually executed; without it, the test would pass trivially and lie about reliability.
2. **`loginScreen.titleElement` remains displayed** — `~Puku Editor` (the live-verified title content-desc from `src/screens/login.screen.ts`, confirmed 2026-08-04 via live `adb shell uiautomator dump`). The login screen is still rendered, so the Flutter engine is alive.
3. **`driver.getCurrentPackage() === 'sh.puku.app'`** — focus has not leaked to Chrome (which would indicate the OAuth redirect fired instead of the email flow) and has not been replaced by a system error dialog or process death.

## "No crash" operational definition

| Invariant | Locator / API | Live-verified on A13? |
|---|---|---|
| Broken email-auth SnackBar is displayed | `loginScreen.emailNotConnectedSnackBar` (`~Email sign-in flow is not connected yet`) | Yes — 2026-08-24 |
| Login screen title is displayed | `loginScreen.titleElement` (`~Puku Editor`) | Yes — 2026-08-04 |
| Current package is `sh.puku.app` | `driver.getCurrentPackage()` (Appium standard) | N/A — driver API |

All three must hold simultaneously for the test to pass. **No ANR / hang detection is included** — the test design's NFR-Reliability wording is "no crash", not "no hang". A separate, deeper probe would be needed for hang detection and is intentionally out of scope for this scenario.

## Clean / default-state expectation

The scenario leaves the app on the logged-out login screen (the same default precondition every other login-screen scenario starts from). No authentication is initiated. No session is created. No follow-on teardown is required — the next spec simply starts on the login screen.

## Status

Pass (on physical A13 `R58T90F5ALY`, see "Notes" for execution evidence).

## Notes

- Automation status: Automated — `tests/specs/auth/login-screen.spec.ts` (`LOGIN-E2E-010 @p1`).
- Reuses exclusively the live-verified `loginScreen` surface (`waitUntilDisplayed`, `tapEnterYourEmail`, `emailNotConnectedSnackBar`, `titleElement`) — no new screen-object methods, no new flow methods, no shared-infrastructure changes.
- Companion to `LOGIN-TC-008` / `LOGIN-E2E-008`: that scenario proves the SnackBar appears; this scenario proves the app stays alive after it does.
- Distinct from `LOGIN-TC-009` (Security: no PII in the toast text or logcat) and `LOGIN-TC-011` (Reliability: graceful error on network loss mid-Google-OAuth-redirect). Both remain `it.skip(...)` placeholders as of this writing.
- Out of scope: ANR / hang detection; logcat scrubbing for PII; refactor of any existing helper.

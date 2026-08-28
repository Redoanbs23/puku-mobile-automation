# LOGIN-TC-009: Broken email-auth error toast contains no sensitive data

**Priority:** P1 (test-design-epic-auth-login.md coverage matrix — NFR-Security)
**Linked automated test:** `LOGIN-E2E-009` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** NFR-Security

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- App is on the logged-out login screen (clean/default state).
- Must run on a physical device with `DEVICE_UDID` set, because the test captures device logcat via `captureLogcat(200)` (which targets `DEVICE_UDID` via `deviceArgs()`). The test skips itself when `DEVICE_UDID` is unset (CI / fresh emulator).
- No Google account state required (this scenario does not initiate OAuth).

## Steps

1. Launch the PUKU app (`sh.puku.app`) and confirm the login screen is shown (logged-out state).
2. Tap **Enter your email** (reusing the existing `loginScreen.tapEnterYourEmail()` helper).
3. Observe the transient notification.
4. Capture a 200-line logcat slice covering the tap-to-snackbar window (`captureLogcat(200)`).
5. Read the rendered notification's `content-desc` value.

The notification's `content-desc` must equal **exactly** `Email sign-in flow is not connected yet` (live-verified 2026-08-28 on physical A13, R58T90F5ALY: class `android.view.View`, bounds `[0,2107][1080,2273]`, package `sh.puku.app`).

The notification's text AND the captured logcat must NOT contain any of these sensitive-data shapes (the assertion surface — see "Notes" for justification):

- email address — `[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}`
- JWT — `eyJ….eyJ….sig`
- Google OAuth access token — `ya29.<…>`
- Google OAuth refresh token — `1//<…>`
- Bearer authentication token — `Bearer <20+ chars>`
- form-style secret — `password=`, `access_token=`, `refresh_token=`, or `client_secret=` followed by `[^&\s]{4,}`

No authentication is initiated. The app remains on the login screen (the snackbar is transient and self-dismisses; the app is left on the logged-out login screen — the clean default precondition for every other login-screen scenario).

## Expected Result

The notification renders with the literal content-desc above. Neither the on-screen notification text nor the captured 200-line logcat slice contains any of the six sensitive-data shapes. No authentication is initiated; the app remains on the login screen.

## Actual Result

Matches the expected result on the physical Samsung Galaxy A13 (`R58T90F5ALY`, SM-A135F, Android 14) on 2026-08-28:

- Snackbar `content-desc` equals `Email sign-in flow is not connected yet` (asserted via `getAttribute('content-desc')` — equal, not just `isDisplayed`).
- Captured logcat (`captureLogcat(200)`) — none of the six sensitive-data patterns match.
- App remains on the logged-out login screen after the test (snackbar self-dismisses; `loginScreen.waitUntilDisplayed()` confirmed at teardown).

Run evidence: `evidence/login009-run.txt` (`npm test -- --mochaOpts.grep="LOGIN-E2E-009"` on `R58T90F5ALY` — `1 passing (4.3s)`, Spec Files 1 passed / 18 skipped / 19 total, exit 0). Recon evidence: `evidence/login009-pre.xml`, `evidence/login009-post.xml`, `evidence/login009-logcat.txt`.

## Status

Pass

## Notes

**R8-free by design.** The broken email-auth path is purely client-side: the SnackBar is rendered without any network call (confirmed by the captured 200-line logcat slice containing zero PUKU-process log lines outside touch-routing). No OAuth, no chat, no AI inference is initiated. The test is safe to run in PR lanes.

**Why this exact assertion set, no broader.** The recon pass for LOGIN-E2E-009 (physical A13, 2026-08-28) inspected the actual rendered node and the actual logcat slice around the tap. The six patterns above are exactly the shapes that, if present, would constitute a real leak on this code path. Broader patterns were deliberately excluded to avoid false positives:

- **Phone numbers, IP addresses, UUIDs, session/request IDs** — all are present in the captured logcat as legitimate system-level values (kernel IO stats, Android internal IDs, timestamps, the input dispatcher event ids). Asserting against them would produce false positives and drift the test away from its NFR-Security contract.
- **A general "no suspicious strings in logcat" assertion** is out of scope — no PUKU scenario would own that audit alone, and it would couple the test to Android's internal log format rather than to PUKU's actual leak surface.

The captured logcat was specifically inspected for user identifiers (emails, `editorpuku@gmail.com`, `@` characters), token shapes (`eyJ` JWT, `ya29.` access tokens, `1//` refresh tokens, `Bearer ` auth headers, form-style `password=` / `access_token=` / `refresh_token=` / `client_secret=`), and PUKU-specific patterns (Authorization headers, OAuth client IDs, API keys). None were found in the captured slice. **This empirical absence is itself a finding:** the broken email-auth path produces no PUKU-process log lines for the tap-to-snackbar window, so there is literally nothing to leak in that window.

**Companion to LOGIN-E2E-008.** This scenario extends `LOGIN-E2E-008` (the R1 regression guard that asserts the snackbar text) with the NFR-Security assertion. Same code path, same snackbar node — adding the sensitive-data check on top of the existing `emailNotConnectedSnackBar` getter (`byContentDesc('Email sign-in flow is not connected yet')`) reuses the proven locator without introducing new infrastructure. No new Screen Object getter, no new utility.

**Captured evidence:**
- `evidence/login009-pre.xml` — pre-tap UI dump (login screen rendered, "Enter your email" button at bounds `[45,1454][1035,1611]`)
- `evidence/login009-post.xml` — post-tap UI dump (snackbar at bounds `[0,2107][1080,2273]`, `content-desc="Email sign-in flow is not connected yet"`)
- `evidence/login009-logcat.txt` — 200-line logcat slice around the tap (zero PUKU-process log lines outside touch-routing)
- `evidence/login009-run.txt` — `npm test` terminal output (1 passing, exit 0)
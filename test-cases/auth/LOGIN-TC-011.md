# LOGIN-TC-011: Graceful error on network loss mid-Google-OAuth-redirect (no crash)

**Priority:** P1 (test-design-epic-auth-login.md coverage matrix — NFR-Reliability + R2)
**Linked automated test:** `LOGIN-E2E-011` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** R2 (Google OAuth fragility), NFR-Reliability

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- App is on the logged-out login screen (clean/default state).
- Must run on a physical device (the Appium session is what performs the assertions; the Wi-Fi disable/restore goes through `adb` over USB and does not sever the Appium session).
- Requires `DEVICE_UDID` set — the `disableWifi()` / `enableWifi()` helpers in `src/utils/adb.ts` resolve to the correct device via `deviceArgs()` and would otherwise fail under multi-device ambiguity. Self-skips when `DEVICE_UDID` is unset (CI / fresh emulator), matching the established `LOGIN-E2E-006 / LOGIN-E2E-007 / LOGIN-E2E-009` pattern.
- Does NOT require a pre-authenticated Google account — the scenario deliberately stops before the OAuth consent page could be reached. The "mid-redirect" window is observable as soon as Chrome's `CustomTabActivity` becomes foreground, which happens regardless of which Google account (if any) is signed in at the OS level (verified live 2026-08-28 on R58T90F5ALY with a non-Google BS23 Microsoft account configured for the current Puku subscription; the device's prior `editorpuku@gmail.com` was intentionally removed and its absence does not block this scenario).

## Steps

1. Launch the PUKU app (`sh.puku.app`) and confirm the login screen is shown (logged-out state).
2. Tap **Continue with Google** via the existing `loginScreen.tapContinueWithGoogle()` helper.
3. Observe the redirect handoff to the external Chrome Custom Tab activity (`com.android.chrome` / `org.chromium.chrome.browser.customtabs.CustomTabActivity`).
4. Once the redirect is demonstrably underway (foreground left PUKU for Chrome), invoke `disableWifi()` (the new adb-side helper in `src/utils/adb.ts`, which runs `adb shell svc wifi disable` — Wi-Fi is the only active network interface on this device; `svc data disable` was empirically a no-op on R58T90F5ALY's user build).
5. Wait briefly (~1.5s) for any Chrome offline-UI transition to settle.
6. Press the system back key to dismiss the Custom Tab if Chrome is still foreground (PUKU's `MainActivity` resumes; if Chrome auto-dismissed on its own, this is a no-op).
7. Wait for `loginScreen.titleElement` (`~Puku Editor`) to be `isDisplayed()` — the logged-out login screen is the canonical signal that PUKU's own UI is healthy and reachable.
8. Restore Wi-Fi via the unconditional `enableWifi()` call in the test's `finally` block. (The test intentionally never leaves the device offline, even if any assertion fails.)
9. Confirm a final foreground package of `sh.puku.app` on the logged-out login screen.

The test does not tap Authorize, does not enter credentials, does not modify any Google account state, and does not assert anything about Chrome's offline UI. The OAuth callback to PUKU is never completed.

## Expected Result

- Tapping "Continue with Google" fires the OAuth intent; the app's foreground changes to `com.android.chrome`'s `CustomTabActivity` within ~1–2 seconds.
- Wi-Fi is disabled while Chrome is foreground. The active default network drops to "none" (verified live during recon 2026-08-28 on R58T90F5ALY).
- PUKU's process is not killed by the network drop. Chrome may show its own offline UI (Chrome's problem; not asserted here); the Custom Tab may auto-dismiss or remain until the back key is pressed (both are observed as "graceful" — Chrome handled the offline itself).
- After returning to PUKU via the back key, the login screen renders: `loginScreen.titleElement` is `isDisplayed()` within the 10-second poll window. PUKU's login screen is the canonical NFR-Reliability "no crash" signal because the title content-desc is a Flutter semantics node that only exists when the login screen has actually rendered.
- The test exits on the logged-out login screen (clean default state for every other login-screen scenario). Wi-Fi is restored; the device's network is fully back to baseline.

## Actual Result

Matches the expected result on the physical Samsung Galaxy A13 (`R58T90F5ALY`, SM-A135F, Android 14, `user` build) on 2026-08-28:

- 7.9s test runtime. `mobile: getCurrentPackage` returned `com.android.chrome` after the Continue-with-Google tap — the redirect is underway.
- The redirect was interrupted by `disableWifi()` while Chrome was foreground; Wi-Fi restored by `enableWifi()` in the `finally` block; device left with `Active default network: 154` (Wi-Fi, validated, connected to the test AP) — identical-shape network state to before the test.
- PUKU did not crash. After pressing back from Chrome, `loginScreen.titleElement` (`accessibility id "Puku Editor"`) was reported `isElementDisplayed: true` within the poll window, and `mobile: getCurrentPackage` returned `sh.puku.app` — PUKU foreground on the logged-out login screen.
- `disableWifi()` after `enableWifi()` left the device at `settings get global wifi_on` = `1`, `airplane_mode_on` = `0`, `mobile_data` = `1` — exact baseline.

Run evidence: `evidence/login011-run.txt` (`npm test -- --mochaOpts.grep="LOGIN-E2E-011"` on `R58T90F5ALY`: "✓ LOGIN-E2E-011 @p1: graceful error on network loss mid-Google-OAuth-redirect", "1 passing (7.9s)", "Spec Files: 1 passed, 18 skipped, 19 total (100% completed) in 00:02:08", exit 0).

## Status

Pass

## Notes

**R8-free by design.** No AI message is sent. No OAuth completion. The network drop is a true negative-path reliability exercise — the test fails noisily if PUKU ever crashes during the offline window.

**Wi-Fi is the only network surface used.** `svc data disable` was empirically verified to be silently a no-op on R58T90F5ALY's user build (returns exit 0 but does not change the `mobile_data` setting; this device also has no SIM, so mobile data is not in use anyway). The helpers in `src/utils/adb.ts` are deliberately named `disableWifi()` / `enableWifi()` rather than the generic `disableNetwork()` to avoid implying mobile-data toggle works when it does not on this firmware.

**Companion to LOGIN-E2E-007.** The scenario extends the same code path — tapping Continue with Google, watching the Chrome handoff land via `driver.getCurrentPackage() === 'com.android.chrome'` — with a network-loss twist. It does NOT wait for the consent page (`oauthConsentScreen.waitUntilDisplayed()` is the LOGIN-E2E-007 gate, deliberately not used here). Authorize is never tapped; OAuth is never completed; the R2 hard boundary is preserved.

**What this scenario asserts.** PUKU's process survival and login-screen reachability. PUKU's `~Puku Editor` content-desc is the strongest available signal because it is a Flutter semantics node that only exists when the login screen has fully rendered — a partial / half-laid-out screen would not surface this element.

**What this scenario does NOT assert (deliberately).** Chrome's offline UI (offline dino, error page, etc.). Chrome's offline presentation is Chrome's problem, not PUKU's. Asserting against Chrome's behavior would couple the test to Chrome's internal UI rather than to PUKU's reliability contract, and would have to evolve independently of PUKU's app code — neither is desirable.


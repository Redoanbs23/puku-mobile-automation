# Emulator vs. Physical Device — Behavioral Comparison

Comparison run on **2026-08-06**, with both targets attached simultaneously:

- **Physical device:** `RF8T802226Y` (Samsung SM-E135F, Android 14) — `editorpuku@gmail.com` pre-authenticated per [ADR-006](adr/ADR-006-oauth-consent-automation.md)
- **Emulator:** `emulator-5554` (Pixel_7 AVD, API 34, Google Play image)

Purpose: establish empirically which scenarios are genuinely device-dependent versus which merely *appear* to be, ahead of any CI scoping decision.

## Results

| Scenario | Physical device | Emulator | Notes |
|---|---|---|---|
| `LOGIN-E2E-002` | Pass | **Pass** | No login required — behaves identically on both |
| `AUTH-E2E-015` | Pass | **Fail** | Gets much further than expected; see below |
| `AUTH-E2E-016` | Pass | **Fail** (cascade) | Blocked by `ensureLoggedIn()` — same root cause as `AUTH-E2E-015` |
| `CHAT-E2E-001` | Pass | **Fail** (cascade) | Blocked by `ensureLoggedIn()` — same root cause |
| `CHAT-E2E-003` | Pass | **Fail** (cascade) | Blocked by `ensureLoggedIn()` — same root cause |
| `CHAT-E2E-002` | Pass | **Not run** | Deliberately excluded — R8 single-execution gate, already consumed this session. See below |

All four emulator failures produce the **identical** error:

```
element ("~How can i help you today!") still not displayed after 10000ms
  at HomeScreen.waitUntilDisplayed (src/screens/home.screen.ts:70)
  at Object.completeGoogleSignIn (src/flows/auth.flow.ts:49)
```

## AUTH-E2E-015 on the emulator — what actually happened

The interesting finding is how *far* it got. The original hypothesis (Play Integrity / SafetyNet attestation blocking Google sign-in on an emulator) is **not supported by the evidence** — the emulator progressed through nearly the entire flow:

1. Login screen rendered, "Continue with Google" found and tapped — **worked**
2. Chrome Custom Tab opened PUKU's consent page — **worked**
3. Consent page rendered `Signed in as editorpuku@gmail.com` — **worked**. The emulator has the same Google account signed in at OS level; this was not previously documented and contradicts the implicit assumption in ADR-006 that only the physical device is pre-authenticated
4. `//android.widget.Button[@text="Authorize Puku App"]` found and tapped — **worked**
5. `flutter_web_auth_2.CallbackActivity` fired — the OAuth callback **did** return to the app
6. Package switched back to `sh.puku.app` — **worked**
7. Home screen (`~How can i help you today!`) never appeared within 10s — **failed here**

Logcat shows a `Splash Screen sh.puku.app` window being created and disposed around the failure point, suggesting PUKU restarted into a splash state rather than reaching the logged-in home screen.

### Root cause: still unconfirmed after two targeted experiments

Two hypotheses were tested directly. **Both were ruled out.** Recorded here so neither gets retried.

#### Attempt 1 — "the emulator is just slow" → ruled out

Raised the final `homeScreen.waitUntilDisplayed()` in `completeGoogleSignIn()` from 10s to **40s**. Still failed; the test ran 48.6s, so it genuinely waited the full duration. The timeout has since been reverted to the 10s default — raising it only delays the failure.

At the moment of timeout the emulator sits on **the Authorize consent page in Chrome**, not PUKU's home screen. That looks like the OAuth flow looping back to consent, but the activity timeline shows it is not:

```
19:57:40.723  MainActivity displayed (login screen)
19:57:41.381  AuthenticationManagementActivity starts   (PUKU begins OAuth)
19:57:41.744  Chrome CustomTabActivity starts
19:57:42.177  CustomTabActivity displayed               (consent page)
19:57:46.447  CallbackActivity                          (OAuth callback fires)
19:57:46.527  PUKU starts something
   ...        NOTHING — 43-second gap, zero activity starts
19:58:29.371  Force-stop (test teardown)
```

There is **no second `CustomTabActivity` start**. It is not re-initiating OAuth — it stalls after the callback, and the visible consent page is a stale Custom Tab surface that was never torn down.

#### Attempt 2 — "Chrome's GPU process crashes are the cause" → ruled out

Logcat shows Chrome's GPU process crash-looping through the OAuth handoff — 6 crashes in the run window, alongside `SurfaceSyncGroup: Failed to receive transaction ready in 1000ms` and repeated `Scheduling restart of crashed service ...PrivilegedProcessService`. Zero equivalent crashes on the physical device. That looked like a strong root-cause candidate.

Relaunched the AVD with software rendering to test it:

```
emulator -avd Pixel_7 -gpu swiftshader_indirect
```

Booted cleanly with a zero-crash baseline. **The result was identical**: same failure, same error, same stalled timeline, same stale consent page — and **still 6 GPU crashes**. Software rendering did not eliminate them, most likely because these are crashes of *Chrome's own internal GPU process inside Android*, which the emulator's `-gpu` flag does not govern.

**Conclusion: the GPU crashes are a co-occurring symptom, not the established cause.** The earlier characterization of them as the root cause was premature and is corrected here.

#### What is actually established

- The failure is **not** timing, and **not** fixed by changing the emulator's GPU backend.
- It is **not** Play Integrity / SafetyNet blocking sign-in — Google authentication succeeds and the consent page renders.
- It is **not** an OAuth loop — the callback fires exactly once and nothing restarts.
- The app stalls in the window *between* the OAuth callback landing and the home screen rendering, and does not recover within 40s.

Investigation stopped here by agreement: two experiments is a reasonable bound. Untested remaining candidates include `-gpu host`, a cold-booted/wiped AVD, and a different API level or system image.

### A note on misleading logcat evidence

Emulator logcat around this window contains `Access denied finding property "ro.product.*_for_attestation"` and related SELinux `avc: denied` entries for `build_attestation_prop`. These are **not** PUKU attestation failures — their `scontext=u:r:shell:s0` shows they originate from the `adb shell uiautomator dump` commands used to capture state during this investigation. Recorded here explicitly because they superficially support the Play Integrity hypothesis and would be easy to misread as confirming it.

## CHAT-E2E-002 — not run on the emulator

Not executed, by design. It sends a real message to a live AI backend on every run (**R8**, [`test-design-epic-chat-core.md`](../_bmad-output/test-artifacts/test-design-epic-chat-core.md)), and its single permitted execution for this session was already spent verifying it on the physical device. Running it again for comparison purposes would violate the R8 gate — the comparison is not worth the cost/ToS exposure.

Note that it would fail on the emulator regardless, for the same `ensureLoggedIn()` reason as the other three cascading failures.

## 2026-08-07 — manually-established emulator logins do not survive test runs

A separate, previously-undocumented issue, found while checking whether `authFlow.ensureLoggedIn()` correctly short-circuits when the emulator is already logged in.

**Setup:** the emulator's PUKU app was manually logged in (confirmed by Redoan) before this check began.

**What happened:** `CHAT-E2E-001` and `CHAT-E2E-003` were run against the emulator (`DEVICE_UDID=emulator-5554`) to observe `ensureLoggedIn()`. Neither short-circuited — both fell through to `completeGoogleSignIn()` and hit the already-documented OAuth stall above. Afterward, a plain `adb shell am start -n sh.puku.app/.MainActivity` (no Appium session, no OAuth involved) rendered PUKU's **login screen**, not the home screen — confirming the manually-established session was gone, not merely undetected.

**Additional evidence — a real ANR, not just a timeout.** `CHAT-E2E-003`'s failure was more severe than `CHAT-E2E-001`'s clean 10s `waitUntilDisplayed` timeout. Two separate Android ANRs fired during the same run, per `logcat.txt` in the failure-capture artifact (`test-results/failures/chat-e2e-003-.../`):

```
08-07 12:36:52.802  ActivityManager: ANR in sh.puku.app (sh.puku.app/.MainActivity)
  Reason: Input dispatching timed out — waited 5171ms for FocusEvent(hasFocus=false)
08-07 12:36:55.260  ActivityManager: Completed ANR of sh.puku.app in 37406ms, latency 916ms

08-07 12:36:59.028  WindowManager: ANR in Window{790d796 com.android.chrome/org.chromium.chrome.browser.customtabs.CustomTabActivity}
  Reason: Input dispatching timed out — waited 5101ms for FocusEvent(hasFocus=true)
```

First `sh.puku.app/.MainActivity` itself stopped responding to input, then — six seconds later — Chrome's `CustomTabActivity` (the same stale consent-page surface described above) also stopped responding. `ActivityManager` began collecting stack traces for Chrome's process (pid 10098) into an on-device temp file (`/data/anr/temp_anr_2155761641016068859.txt`) shortly after. Full ANR trace dumps for both events still exist on the emulator's disk (`/data/anr/anr_2026-08-07-12-36-24-968`, `/data/anr/anr_2026-08-07-12-37-04-464` — correspondence inferred from timestamp proximity, not confirmed by content) but were **not** pulled into the repo — this project's failure-capture hook only captures `logcat`, screenshot, and video, not `/data/anr/` dumps or tombstones. Only `logcat.txt`, `screenshot.png`, and `recording.mp4` exist in the repo's own failure artifact for this run.

This is new evidence for the closed `AUTH-E2E-015` investigation, not pursued further per the standing agreement to leave that investigation closed — recorded here for whoever picks it up next.

**Root cause:** `config/wdio.android.conf.ts` hard-coded `'appium:noReset': false`. Per Appium/UiAutomator2 semantics, `noReset: false` resets the app's data at the start of *every* session — this is *not* specific to a failed test; it happens before the test body runs at all. Both `CHAT-E2E-001` and `CHAT-E2E-003` each independently cleared the app's data before `ensureLoggedIn()` ever got to call `homeScreen.isDisplayed()`, so the check correctly reported `false` — the session really was gone by the time it ran.

**This is a different bug from the AUTH-E2E-015 stall above.** That investigation is about what happens *after* the OAuth callback fires and remains closed per agreement. This one is about test-harness configuration destroying session state *before* any OAuth flow is even attempted, and was fixed without touching the OAuth path at all.

**Fix:** `config/wdio.android.conf.ts` now reads `'appium:noReset': process.env.APP_NO_RESET === 'true'` — default unchanged (`false`, matching every existing test's expectations: `LOGIN-E2E-002`, `AUTH-E2E-015`/`016` all rely on starting from a clean logged-out state). Set `APP_NO_RESET=true` explicitly when a test run needs to preserve an existing login across the session boundary.

**Verified end-to-end, 2026-08-07 (later same day).** Redoan manually logged into PUKU on the emulator and confirmed it went straight to the home screen. `CHAT-E2E-001` was then run once with `DEVICE_UDID=emulator-5554 APP_NO_RESET=true` and **passed in 9.5s**, with `ensureLoggedIn()` correctly short-circuiting — confirmed via log inspection that only `chatPromptHeading`, `chatInputField`, and `modelSelector` were ever queried, with no `findElement` call for `~Continue with Google` anywhere in the run, i.e. no fall-through to `completeGoogleSignIn()`. (The first attempt at this verification failed for an unrelated reason — see the `isDisplayed()` timing-bug entry immediately below — and was fixed before this passing run.) The `APP_NO_RESET` fix itself is now confirmed working, not just correct in isolation.

**Current state, as of this entry:** the emulator is logged in and `ensureLoggedIn()` correctly detects it. Chat-core P1-P3 scenarios requiring a logged-in state are now unblocked, provided `APP_NO_RESET=true` is set when invoking them.

## 2026-08-07 — `isDisplayed()`'s single-snapshot check races a slower `APP_NO_RESET=true` cold launch

A second, distinct bug, found while verifying the `noReset` fix above. Not the same root cause — recorded separately rather than folded into the entry above, since the two have independent causes and independent fixes.

**What happened:** with the emulator now genuinely logged in and `APP_NO_RESET=true` set, running `CHAT-E2E-001` still failed — but not with the known OAuth stall. `ensureLoggedIn()`'s `homeScreen.isDisplayed()` check queried `~How can i help you today!` once, 5.1s after session creation, got "no such element," and treated that as "not logged in." It then fell through to `attemptGoogleSignIn()`, which polled for `~Continue with Google` for a full 10s and never found *that* either — meaning the app was never on the login screen at any point this run, just still mid-launch.

**Confirmed the session was never actually lost.** Immediately after the failed run, a plain `adb shell dumpsys window` + `uiautomator dump` (no Appium, no OAuth) showed the app already back on the true home screen (`content-desc="How can i help you today!"`, `content-desc="puku-ai-2.7"` both present, `sh.puku.app/.MainActivity` focused). This ruled out both of the other candidate explanations considered at the time: `APP_NO_RESET` not being applied, and Appium resetting the app despite the flag — if either were true, the login state would have been wiped and the login screen would be showing instead. Neither was.

**Root cause:** `HomeScreen.isDisplayed()` (`src/screens/home.screen.ts`) did a single, non-retried `.isDisplayed()` check with no polling window. Under the old `noReset:false` default this was never exposed, because the app always launched into the lightweight login screen — a fast render with nothing to race. `APP_NO_RESET=true` introduces a new case this check was never built for: a session-restoring cold launch that can legitimately take longer than an instant to render, producing a false "not logged in" read purely from bad timing, not a real absence.

**This is a different bug from the `noReset` config bug above.** That one was about test-harness configuration destroying session state before any check ran. This one is about a readiness check with no tolerance for how long a legitimately-preserved session takes to render. Fixing the first was necessary but not sufficient for the second to surface — the timing bug only became visible once a real logged-in cold launch existed to race against.

**Fix:** `isDisplayed()` now uses `waitForElement()` with a short 4-second poll window, returning `false` on timeout instead of a single unretried check:

```ts
async isDisplayed(): Promise<boolean> {
  try {
    await this.waitForElement(this.chatPromptHeading, 4000);
    return true;
  } catch {
    return false;
  }
}
```

4s tolerates the slower cold launch without meaningfully slowing down the normal `noReset:false` path, where the correct answer is genuinely "false" and resolves quickly regardless.

**Verified end-to-end:** re-running `CHAT-E2E-001` once more with the fix applied (`DEVICE_UDID=emulator-5554 APP_NO_RESET=true`) passed in 9.5s, short-circuiting correctly — see the verification note in the entry above.

## Conclusions

1. **The physical-device dependency is real, but narrower than assumed.** It is not "Google OAuth cannot work on an emulator" — the emulator authenticates, renders consent, and fires the callback successfully. The dependency is localized to whatever happens *after* the OAuth callback, and survived both a 4x timeout increase and a GPU-backend change.
2. **The emulator is a viable target for `LOGIN-E2E-002`** and any future scenario that does not require a logged-in state.
3. **All four logged-in-state scenarios share a single point of failure** (`authFlow.ensureLoggedIn()`), so they will pass or fail together on any given target. This is a coupling worth knowing: fixing the one root cause would unblock all four on the emulator simultaneously.
4. **This does not change the CI recommendation.** The prior assessment — keep CI limited to emulator-safe scenarios, reject a self-hosted physical-device runner on R2/R3 grounds — stands unchanged. If anything, conclusion 1 makes it slightly more plausible that the logged-in suite could eventually become emulator-viable, which would be the *right* way to expand CI coverage rather than self-hosting.

## Related

- [ADR-006 — OAuth consent automation](adr/ADR-006-oauth-consent-automation.md)
- [`docs/running-tests.md`](running-tests.md) — which scenarios require `DEVICE_UDID`
- [`ai-log/lessons-learned.md`](../ai-log/lessons-learned.md) — the `adb` device-disambiguation bug found during this comparison

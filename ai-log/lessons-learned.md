# Lessons Learned

## 2026-08-04 — npm audit findings on initial scaffold install

`npm audit` found 38 vulnerabilities after the initial framework scaffold install, all nested inside `appium-uiautomator2-driver`'s own bundled dependency tree. Plain `npm audit fix` resolved 0 of them — every fix requires `npm audit fix --force`, which bumps `appium` to a breaking major version (3.6.0). Decision: not forcing the fix yet — this framework only talks to localhost (Appium ↔ local/CI emulator, no untrusted network exposure), so a breaking Appium bump this early is riskier than the vulnerabilities themselves. Revisit once P0/P1 tests are passing: re-run `--force` on a branch and verify the suite still passes before merging.

## 2026-08-06 — hamburger menu icon has no accessibility locator

The hamburger menu trigger icon on PUKU's home screen exposes no content-desc, resource-id, or text — a genuine gap in the Flutter semantics tree, same class of issue R4 in the test design anticipated. The only way to interact with it today is raw screen coordinates, which is fragile (screen-size/DPI dependent). Recommend flagging to the PUKU dev team as an accessibility gap, same framing as the earlier "Continue with Google" / "Enter your email" asks — a real a11y improvement for them, not just a QA convenience.

## 2026-08-06 — chat send button has no accessibility locator (and is keyboard-state-dependent)

The chat input's send control also exposes no content-desc, resource-id, or text — same class of gap as the hamburger menu trigger above (R4). It's worse in one respect: the element doesn't exist at all while the chat input is empty (confirmed via live dump — no send/paper-plane icon renders until text is present), and once it appears, its position depends on the on-screen keyboard being open, which shifts the whole input card upward. Coordinate-based tap is the only option, and those coordinates are only valid in that specific state (text entered, keyboard open) — see `src/screens/home.screen.ts`. Recommend flagging to the PUKU dev team alongside the hamburger gap.

## 2026-08-06 — WebdriverIO's setValue() silently fails on this app's custom-rendered widgets

`setValue()` (the WebDriver `element/value` endpoint) updates Flutter's accessibility/semantics layer but does not always forward to the widget's real `TextEditingController` for custom-rendered widgets — PUKU's chat input is exposed as an `android.widget.EditText` purely via semantics, not a real native EditText underneath. Symptom: `setValue()` reports success, an accessibility dump shows the text as set, but the on-screen widget stays visibly empty. Confirmed live against RF8T802226Y while unblocking `CHAT-E2E-002`. Workaround: focus the field via a normal WebdriverIO `.click()`, then inject real keystrokes via `adb shell input text` — see `src/utils/real-text-input.ts` (`typeRealText`). This is a framework-level gotcha independent of any specific test — any future test that needs to type into a PUKU input field should use `typeRealText`, not `setValue()`, until proven otherwise for that specific field.

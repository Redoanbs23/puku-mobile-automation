# LOGIN-TC-006: All interactive elements on the login screen expose usable accessibility/automation locators

**Priority:** P1 (test-design-epic-auth-login.md coverage matrix — R4 mitigation)
**Linked automated test:** `LOGIN-E2E-006` (tests/specs/auth/login-screen.spec.ts)
**Linked risk(s):** R4

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- App is on the logged-out login screen (clean/default state).
- Required environment: `DEVICE_NAME=SM-A135F` / `DEVICE_UDID=R58T90F5ALY` (physical Samsung Galaxy A13, Android 14). The test skips itself when `DEVICE_UDID` is unset (CI / fresh emulator).
- The login screen is reached through the framework's normal app-data-reset precondition — no manual authentication is required for this scenario.

## Steps

1. Launch the PUKU app (`sh.puku.app`) and confirm the login screen is shown (logged-out state).
2. Capture the live accessibility tree of the login screen (e.g. via Appium `driver.getPageSource()` or `adb shell uiautomator dump`).
3. Enumerate every node whose `clickable="true"` attribute is set (the interactive-node rule for locator-health is `clickable="true" AND (focusable="true" OR hasUsableLocator)`; the live count is 5 on the current A13 build).
4. For each interactive node, verify it exposes at least one usable automation locator — `content-desc`, `resource-id`, `text`, or `hint`.
5. Verify the five expected interactive elements are present and locatable by their content-desc:
   1. **Continue with Google** — `content-desc="Continue with Google"`
   2. **Enter your email** — `content-desc="Enter your email"`
   3. **Consumer Terms** — `content-desc="Consumer Terms"`
   4. **Usage Policy,** — `content-desc="Usage Policy,"` (note trailing comma)
   5. **Privacy Policy** — `content-desc="Privacy Policy"`
6. Do **NOT** tap any of the above controls — this scenario verifies that every interactive login-screen element has a usable locator; it does not initiate authentication.

## Expected Result

All five interactive elements on the login screen expose a usable accessibility/automation locator (specifically a `content-desc`), and no unlabeled interactive node is present. The scenario does not initiate authentication and does not navigate away from the logged-out login screen. No tap is performed on any control.

## Actual Result

Matches the expected result on physical device `R58T90F5ALY` (Samsung Galaxy A13, SM-A135F, Android 14): the logged-out login screen has exactly 5 interactive nodes, every one of which exposes a non-empty `content-desc`. The locator-health analyzer (`src/utils/locator-health.ts`, extended with a `'login'` branch for this scenario) reports `unexpected = []` and the test passes. No control is tapped, no authentication is initiated, and the app is left on the logged-out login screen (clean default state).

## Status

Pass

## Notes

- Linked automated test: `LOGIN-E2E-006` (tests/specs/auth/login-screen.spec.ts) — automated and passing on physical A13 (`R58T90F5ALY`), validated 2026-08-26.
- Required environment: `DEVICE_NAME=SM-A135F` / `DEVICE_UDID=R58T90F5ALY` (physical A13). The test skips itself when `DEVICE_UDID` is unset (CI / fresh emulator).
- **Locator surface on Login is clean.** Unlike Home (5 unlabeled exceptions) and Settings (3 unlabeled exceptions), the Login screen has zero unlabeled interactive nodes and therefore zero approved exceptions. Any future unlabeled interactive node is unexpected by definition — a stronger invariant than Home/Settings, not a weaker one.
- **No tap is performed and no AI message is sent.** Authentication is not initiated in any form (R2/R8 boundaries preserved by construction).
- **Reuses the existing locator-health infrastructure** from `CHAT-E2E-015` (`src/utils/locator-health.ts`) — extended, not duplicated. The `expectUnexpected` helper is shared between `CHAT-E2E-015` and `LOGIN-E2E-006`.
- **The top-left menu icon** referenced in `docs/source-analysis/screen-inventory.md` §S-02 is **not** present in the live build's login screen and is **not** asserted by this test. If a future build reintroduces it, a corresponding accessibility label will be required for this scenario to remain green.

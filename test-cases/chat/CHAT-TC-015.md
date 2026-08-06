# CHAT-TC-015: Locator health-check across home, drawer, and Settings

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-015` — designed, not yet automated
**Linked risk(s):** R4

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Appium Inspector or `adb shell uiautomator dump` available for inspecting the accessibility tree.

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Capture the accessibility tree for the home screen.
3. Open the drawer and capture its accessibility tree.
4. Open Settings and capture its accessibility tree.
5. For each interactive element, confirm it exposes a usable locator (`content-desc`, `resource-id`, or stable text) **or** is one of the already-documented exceptions below.

## Expected Result

Every interactive element on the home, drawer, and Settings screens either exposes a usable locator, or is one of the two known, already-documented gaps. No *new* elements have silently lost their locators.

Known and accepted exceptions (not failures):

- **Hamburger menu trigger** (home screen) — no content-desc/resource-id/text; coordinate tap required
- **Chat send control** — no content-desc/resource-id/text; additionally does not exist until the input has text, and its position shifts with the keyboard

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

This is the chat-core analogue of `LOGIN-E2E-006`. Its value is as an early-warning signal for *silent* semantics-tree regressions (R4) — the point is that the two known gaps are encoded as accepted exceptions, so the case fails only when something new breaks, not on the pre-existing state. Both known gaps are documented in `ai-log/lessons-learned.md` and flagged as candidates to raise with the PUKU dev team.

Also worth checking during execution: the model selector's `content-desc` embeds a drifting version string (`puku-ai-2.7` → `puku-ai-2.8` observed within two days), so any locator for it must match by prefix rather than exact value.

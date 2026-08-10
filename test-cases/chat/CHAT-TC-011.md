# CHAT-TC-011: Projects section opens without crashing

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-011` (tests/specs/chat/projects-section.spec.ts)
**Linked risk(s):** R13

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left) to open the drawer.
3. Tap "Projects".
4. Observe the resulting screen.

## Expected Result

The Projects section opens and the app does not crash.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/projects-section.spec.ts`. Requires `DEVICE_UDID` and, on the emulator, `APP_NO_RESET=true` (self-skips otherwise). Verified against the emulator on 2026-08-07.

**Smoke-level only, deliberately.** Per R13, this section had never been explored before the 2026-08-07 pass — its contents render as a "Projects" header, a "No projects yet" empty state, and a "New project" button. Do not extend this case into deeper functional assertions until a further exploration pass covers the "New project" flow itself. One finding from that pass: this section's back control has no content-desc at all (a gap, same class as the hamburger trigger) — the automated test uses the Android system back action instead of a locator for it.

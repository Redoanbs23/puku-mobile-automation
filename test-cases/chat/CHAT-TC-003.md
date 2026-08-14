# CHAT-TC-003: Hamburger menu opens; drawer shows all expected entries

**Priority:** P0 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-003` (tests/specs/chat/drawer.spec.ts)
**Linked risk(s):** R4

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Not meaningful on CI or a fresh emulator, for the same reasons as the auth-login epic's device-dependent cases.

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left).
3. Observe the drawer that opens.
4. Confirm "Chats" is visible.
5. Confirm "Projects" is visible.
6. Confirm "Artifacts" is visible.
7. Confirm "Code" is visible.
8. Confirm "New chat" is visible.
9. Confirm the profile avatar (the Settings entry point) is visible.

## Expected Result

The drawer opens and shows all of: Chats, Projects, Artifacts, Code, New chat, and the profile avatar.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/drawer.spec.ts`. Requires the `DEVICE_UDID` environment variable set to run (the test skips itself otherwise). Verified against physical device `RF8T802226Y` on 2026-08-06.

The hamburger menu icon itself has no content-desc, resource-id, or text (see `ai-log/lessons-learned.md`) — the automated test taps it by fixed screen coordinates, which is fragile and tied to this device's screen size/DPI. A manual tester should have no trouble locating it visually.

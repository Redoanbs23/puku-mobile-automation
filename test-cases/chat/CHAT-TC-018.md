# CHAT-TC-018: Voice entry point behavior documented

**Priority:** P3 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** **None — manual only, permanently.** Not a coverage gap; see Notes.
**Linked risk(s):** R11

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the microphone icon in the chat input area. Observe and record what happens (permission prompt, recording UI, error, etc.).
3. Dismiss/exit whatever state that produced.
4. Open the drawer, tap the profile avatar to open Settings, then tap "Voice".
5. Observe and record what that screen presents.

## Expected Result

**Documentation, not assertion.** The purpose of this case is to record what these two entry points actually do, since neither has been explored. There is no pass/fail condition beyond "the app does not crash."

## Status

Not Run

## Notes

**Manual only — permanently, by design.** Unlike the other not-yet-automated cases in this directory, this one is not awaiting automation. Per R11, there is no reliable way to inject fake microphone audio through Appium/UiAutomator2, so voice input cannot be meaningfully automated with the current toolchain. This is an accepted, documented limitation — the same treatment R2 received for Google OAuth completion in the auth-login epic — and should not be tracked as a coverage gap or "missing test."

This would only change if Appium/UiAutomator2 gains audio-injection support.

Be aware that tapping the microphone icon may trigger a system permission prompt on first use, which will alter the app's permission state for subsequent testing.

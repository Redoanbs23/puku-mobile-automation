# SETTINGS-TC-001: Settings screen verification

**Priority:** P1
**Linked automated tests:** `SETTINGS-E2E-001` … `SETTINGS-E2E-005` (tests/specs/settings/settings-profile.spec.ts)
**Linked risk(s):** R12 (plan/tier shown in Settings)

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable. Do not uninstall/reinstall — that belongs to LOGIN-E2E-001.
- Logged-in session (see CHAT-TC-001). Emulator: `APP_NO_RESET=true`.
- `DEVICE_UDID` set.

## Steps

1. Start from the logged-in home screen.
2. Tap hamburger (top-left), then the profile avatar beside **New chat**.
3. Confirm the **Settings** heading is visible.
4. Confirm the signed-in user email is visible.
5. Confirm the workspace / organization (or display) name is visible under the email/role row.
6. Confirm the workspace role is visible (for example **Power**).
7. Confirm the expand/dropdown beside the role is present (the role chip itself is tappable; there is no separate chevron label).
8. Press Android Back and confirm the home prompt is visible again.

## Expected Result

Settings opens. Email, workspace name, and role are visible. The role control is tappable. Back returns to home.

## Status

Pass (2026-08-14) — intended for any logged-in Android device or emulator.

## Notes

One manual case; automation splits the same checks into five `it()` blocks that share one open/close path (`ensureOnSettings` / `dismissSettingsToHome`).

Role uses compound content-desc `Power\nPower`. Tapping the role chip currently shows **Account switcher placeholder** (app stub) — this case only verifies the control is present, not a working workspace switcher.

Optional env pins: `SETTINGS_USER_EMAIL`, `SETTINGS_WORKSPACE_NAME`, `SETTINGS_WORKSPACE_ROLE` (defaults to `Power`).

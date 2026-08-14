# Settings screen verification

Settings profile-header coverage added **2026-08-14**. Locators are **structural** (accessibility tree / XPath), not tied to one phone model. They run on **any connected Android device or emulator** with PUKU Editor (`sh.puku.app`) installed and a logged-in session. Coordinate fallbacks scale from a 1080×2408 baseline so different screen sizes still hit the same hamburger region.

Existing chat-core tests (`CHAT-E2E-001`–`003`, `settings-toggles.spec.ts`) were **not** removed or rewritten as part of this work.

## What was implemented

Five automated checks (one assertion per test) plus one combined manual case. Shared navigation runs **once** per describe:

**Home** → hamburger (no `content-desc`) → **New chat** row → profile avatar (single-letter `content-desc`) → **Settings** → assert → **Back** → Home.

| ID | What it checks |
|---|---|
| `SETTINGS-E2E-001` | Settings page is open (`~SETTINGS` header) |
| `SETTINGS-E2E-002` | Signed-in user email is visible |
| `SETTINGS-E2E-003` | Workspace / organization name is visible |
| `SETTINGS-E2E-004` | Workspace role is visible (e.g. `Power`) |
| `SETTINGS-E2E-005` | Role control is `clickable="true"` (expand / account-switcher entry) |

Priority: **P1**. All five require `DEVICE_UDID` and a **logged-in** session (`APP_NO_RESET=true`). They skip when `DEVICE_UDID` is unset.

## File map

| Layer | Path | Role |
|---|---|---|
| Screen object | [`src/screens/settings.screen.ts`](../src/screens/settings.screen.ts) | Locators and taps only |
| Flow | [`src/flows/settings.flow.ts`](../src/flows/settings.flow.ts) | Home recovery, login if needed, open Settings, dismiss to Home |
| Spec | [`tests/specs/settings/settings-profile.spec.ts`](../tests/specs/settings/settings-profile.spec.ts) | Five `it()` cases; no locators in the spec |
| Manual | [`test-cases/settings/SETTINGS-TC-001.md`](../test-cases/settings/SETTINGS-TC-001.md) | One human-run case covering the same five checks |
| Existing (kept) | [`tests/specs/chat/settings-toggles.spec.ts`](../tests/specs/chat/settings-toggles.spec.ts) | Older Settings toggle checks; still present |

## Screen object (`settings.screen.ts`)

**Kept from earlier chat-core work:** `profileAvatarButton` (`~P`), `profileRow`, `logOutButton`, `settingsHeader`, haptic/notifications locators, `scrollDown`.

**Added for this Settings journey:**

| Getter / method | How it is found (live dump) |
|---|---|
| `hamburgerMenuTrigger` | Clickable `android.view.View` that **precedes** `~How can i help you today!`. No `content-desc`. Works on any density: it is the unlabeled top-left control, not a pixel box. The model selector is an **ImageView** on the right — do not tap it. |
| `tapHamburgerMenuTrigger()` | Clicks the View above; if it is not found, taps coordinates scaled from baseline `112,178` at **1080×2408** (same formula on every device). |
| `profileAvatarBesideNewChat` | Clickable sibling **before** `~New chat` whose `content-desc` is **exactly one character** (any letter, any account). |
| `tapProfileAvatar()` | Uses the sibling locator first, then falls back to `~P`. |
| `userEmailLabel` | `android.view.View` whose `content-desc` contains `@`, or `SETTINGS_USER_EMAIL` if set. |
| `workspaceNameLabel` | View immediately **after** the email View, or `SETTINGS_WORKSPACE_NAME` if set. |
| `workspaceRoleButton` | Button whose `content-desc` contains `Power`, or `SETTINGS_WORKSPACE_ROLE`. Same node is the expand control. Tapping it (manual / Inspector) opens an **Account switcher placeholder** — not asserted as a full switcher UI. |

## Flow (`settings.flow.ts`)

| Method | What it does |
|---|---|
| `returnToHomeIfPossible()` | Back / Home until the chat heading is visible |
| `openSettingsFromHome()` | Hamburger → avatar → Settings header |
| `ensureOnSettings()` | Recover leftover Settings/drawer, then **always** `authFlow.ensureLoggedIn()` (no-op if Home is already shown; Google OAuth if on login), then open Settings |
| `dismissSettingsToHome()` | Back until Home heading is shown |

## Spec (`settings-profile.spec.ts`)

- `before`: skip without `DEVICE_UDID`; then `ensureOnSettings()` once.
- Five independent `it()` blocks (see table above).
- `SETTINGS-E2E-005` uses `getAttribute('clickable') === 'true'`. Do **not** use WDIO `toBeClickable()` here — UiAutomator2 does not implement `/element/clickable`.
- `after`: `dismissSettingsToHome()` and assert Home heading.

## Manual case

[`test-cases/settings/SETTINGS-TC-001.md`](../test-cases/settings/SETTINGS-TC-001.md) is the only Settings manual file. It lists the same five expected results in one document (not five separate TC files).

## How to run

Stop Appium Inspector first if it is bound to port **4723**.

```bat
cd /d C:\Users\BS01645\Documents\PUKU_APP_Project_Appium_test\puku-mobile-automation
adb devices
set DEVICE_UDID=<udid from adb devices>
set APP_NO_RESET=true
npm test -- --mochaOpts.grep="SETTINGS-E2E-00"
```

Use the UDID of **whichever** phone or emulator you are targeting. `APP_NO_RESET=true` keeps an existing login. A session that is still on the login screen will go through login from `ensureOnSettings()`.

## Known product / a11y notes

- The hamburger control still has **no** `content-desc`, `resource-id`, or visible text in the accessibility tree (same class of gap as the send button). Automation uses a structural XPath, then scaled coordinates.
- Role expand currently surfaces an **Account switcher placeholder**, not a finished account-switcher product.
- Email / workspace / role text can differ per account; locators prefer structure (`@` in email, sibling after email, `Power` in role) plus optional env overrides.

## What this work did not change

- Did not delete or rewrite `drawer.spec.ts`, `home-screen.spec.ts`, or `settings-toggles.spec.ts`.
- Did not uninstall or reinstall the APK as part of these tests.
- Did not add five separate manual TC files (one combined `SETTINGS-TC-001` only).

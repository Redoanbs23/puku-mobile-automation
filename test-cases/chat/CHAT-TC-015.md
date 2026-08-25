# CHAT-TC-015: Locator health-check across home, drawer, and Settings

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-015` — implemented and verified on physical device
**Linked risk(s):** R4

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `R58T90F5ALY`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- The automated test uses `driver.getPageSource()` for in-session accessibility inspection. It does **not** use standalone `adb shell uiautomator dump` during execution.

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Capture the accessibility tree for the home screen via `driver.getPageSource()`.
3. Open the drawer and capture its accessibility tree.
4. Open Settings and capture its accessibility tree.
5. For each interactive element, confirm it exposes a usable locator via `content-desc`, `resource-id`, `text`, or `hint`, **or** is one of the nine approved exceptions below.

## Expected Result

**Scope.** CHAT-E2E-015 is a P2 locator-health check covering Home, Drawer, and Settings.

**Interactive-node rule.** The authoritative rule used by the implementation:

```text
clickable="true" AND (focusable="true" OR hasUsableLocator)
```

A usable locator is based on the implemented utility's supported attributes: `content-desc`, `resource-id`, `text`, and `hint`.

**Approved exceptions (exactly nine).** Every interactive element on the home, drawer, and Settings screens either exposes a usable locator, or is one of the nine approved exceptions below. No *new* elements have silently lost their locators.

1. **Home hamburger trigger** — no content-desc/resource-id/text; coordinate tap required
2. **Chat send control** — no content-desc/resource-id/text; does not exist until the input has text
3. **Home incognito toggle** — no content-desc/resource-id/text
4. **Home plus/attachments button** — no content-desc/resource-id/text
5. **Home mic button** — no content-desc/resource-id/text
6. **Home voice button** — no content-desc/resource-id/text
7. **Settings back button** — empty semantic label (G-4); no content-desc/resource-id/text
8. **Settings Haptic Feedback switch child** — clickable/focusable child of the labeled "Haptic feedback" Switch row; reached via the stable parent-child XPath `//android.widget.Switch[contains(@content-desc, "Haptic feedback")]/android.widget.Switch`
9. **Settings Information action child** — clickable/focusable child of the "Information" semantics wrapper; matched structurally as an `android.widget.Button` child whose parent is an `android.widget.Button` with `content-desc = "Information"`

**Home behavior.** Home uses a **count-based guard** for the five approved unlabeled interactive nodes (hamburger, incognito, plus/attachments, mic, voice). It does **not** use positional/index/bounds matching. The chat send control is handled based on its **absence** from the empty-input Home state.

**Settings exceptions.** Haptic Feedback is matched via the stable parent-child relationship `//android.widget.Switch[contains(@content-desc, "Haptic feedback")]/android.widget.Switch`. Information is matched structurally as an `android.widget.Button` child → parent `android.widget.Button` → parent `content-desc = "Information"`. No bounds, indexes, coordinates, or positional matching are used.

**Navigation / teardown.** The automated test follows this flow:

```text
Home
→ Hamburger
→ Drawer
→ Profile Avatar
→ Settings
→ driver.back()
→ Home
```

The test verifies the Home heading is displayed after teardown.

**Verified physical-device result.**

```text
Physical device: Samsung Galaxy A13
Model: SM-A135F
Android: 14

Home: PASS
Drawer: PASS
Settings: PASS

Settings:
interactive=11
unlabeled=3
unexpected=0

CHAT-E2E-015:
1 passing

Teardown:
returned to Home
Home heading displayed
```

The app was left in the clean/default Home state.

**Validation.**

```text
npm run typecheck → PASS
npm run lint → PASS
```

QA2 physical-device validation was performed on the A13. No emulator execution was performed.

## Status

Implemented and verified on physical device (Samsung Galaxy A13, R58T90F5ALY).

## Notes

This is the chat-core analogue of `LOGIN-E2E-006`. Its value is as an early-warning signal for *silent* semantics-tree regressions (R4) — the point is that the nine known gaps are encoded as accepted exceptions, so the case fails only when something new breaks, not on the pre-existing state. The known gaps are documented in `ai-log/lessons-learned.md` and flagged as candidates to raise with the PUKU dev team.

Also worth checking during execution: the model selector's `content-desc` embeds a drifting version string (`puku-ai-2.7` → `puku-ai-2.8` observed within two days), so any locator for it must match by prefix rather than exact value.

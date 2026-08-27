# CHAT-TC-019: Conversation survives app backgrounding and resume

**Priority:** P0 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-019` — automated; see `tests/specs/chat/conversation-background-resume.spec.ts`
**Linked risk(s):** R15

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Send a convention-compliant test message, e.g. `[PUKU-QA-TEST:CHAT-TC-019] What is 2 + 2?`, and wait for a response to appear.
3. Background the app (tap the device Home button, or use the app switcher to move away).
4. Wait a few seconds.
5. Return to the app (via the app switcher or launcher icon).
6. Observe whether the conversation from step 2 is still present.

## Expected Result

After resuming, the conversation sent in step 2 is still visible. The message and its response have not been silently lost, and the app has not reset to an empty chat state.

## Status

Pass (automated, 2026-08-27) — physical Samsung Galaxy A13 (`R58T90F5ALY`).

## Notes

**Automated and physically validated, 2026-08-27.** See `tests/specs/chat/conversation-background-resume.spec.ts`. This scenario was added to `_bmad-output/test-artifacts/test-design-epic-chat-core.md` on 2026-08-06 alongside R15.

**Why this is P0 despite being newly added.** `AUTH-E2E-015`'s `noReset:true` only ever proved that the *login session* survives an Activity restart — nothing in either epic had tested whether *conversation content* survives. For a chat product, silent loss of an in-progress conversation is a trust-destroying failure, and backgrounding is a near-certain real-world interaction, not an edge case. Note this is a genuinely different question from the narrower "chat-history persistence correctness" item listed under Not in Scope in the test design, which concerns exact content fidelity gated on R10's cleanup investigation.

**R8 — real message, real account.** Step 2 sends a real message to PUKU's live AI backend, with the same inference-cost and rate-limit exposure as CHAT-TC-002. Do not repeat the send while experimenting with backgrounding technique — if you need to retry the backgrounding step, resume from the existing conversation rather than sending a fresh message.

**Scope boundary.** This case tests backgrounding/resume only. A full process-kill (force-stop) or device-reboot variant is a *separate* concern — an app can survive one and not the other — and is tracked as a candidate follow-on scenario in R15's residual-risk note, not covered here.

**Automation evidence (2026-08-27, physical Samsung Galaxy A13, `R58T90F5ALY`).**

- Subscription unblocked the PUKU AI backend after earlier runs returned `HTTP 429` from the inference endpoint; with the subscription active, the AI backend responded normally and the structural response bubble appeared within the 20s wait.
- The test successfully sent `[PUKU-QA-TEST:CHAT-TC-019] What is 2 + 2?` via `homeScreen.typeChatMessage()` + `homeScreen.tapSendButton()`.
- AI response `"4"` was received and captured via `responseBubbleExcluding(TEST_MESSAGE).getText()` (R9: structural/length assertion, never exact text — the exact-equality check below is between pre- and post-resume captures of the same non-deterministic response, not against a fixed expected string).
- The app was backgrounded via `driver.appiumBackground(null)` and reactivated via `driver.activateApp('sh.puku.app')`; `driver.getCurrentPackage()` confirmed `sh.puku.app` after the resume.
- After resume: user bubble `[PUKU-QA-TEST:CHAT-TC-019] What is 2 + 2?` was still present in the semantics tree (same `text`-attribute XPath pattern the Screen Object already trusts via `responseBubbleExcluding`).
- After resume: AI response bubble was still displayed, and `getElementText(...)` on the **same response-bubble element id** returned `"4"` — the literal response text matched the pre-background capture byte-for-byte. This is the strongest persistence assertion, not merely "some response-shaped View exists."
- Initial post-resume assertion `homeScreen.waitUntilDisplayed()` (which resolves to `chatPromptHeading`, the empty/new-chat state chrome) was removed during implementation because it was an inappropriate persistence check: once an active conversation is present, the empty-state heading is correctly absent, so asserting its presence was a contradiction with the case's own expected outcome ("the app has not reset to an empty chat state"). Replaced with `homeScreen.chatInputFieldWithText.waitForDisplayed(...)` (chat composer card present — proves we are on the chat surface without asserting the empty-state chrome) plus the user-bubble and literal-response-text identity checks above.
- Teardown follows the established `tests/specs/chat/long-message.spec.ts` / `rotation.spec.ts` convention: `settingsScreen.tapHamburgerMenuTrigger()` → `drawerScreen.newChatButton.click()` → `expect(homeScreen.chatPromptHeading).toBeDisplayed()`. Leaves the app in the clean/default home state for whatever spec runs next; uses the drawer reset rather than `clear()`/`setValue()` (unreliable against this app's custom-rendered EditText, per `ai-log/lessons-learned.md`).
- `npm run typecheck` → PASS (exit 0, no diagnostics). `npm run lint` → PASS (exit 0, no diagnostics). Final wdio run with teardown: `1 passing (40.2s)`; Spec Files: `1 passed, 19 skipped, 20 total (100% completed) in 00:02:35`.

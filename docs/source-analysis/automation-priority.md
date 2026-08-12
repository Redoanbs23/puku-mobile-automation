# Recommended Automation Priority

Prioritisation criteria: **business criticality × determinism × locator quality
× setup cost**.

---

## P0 — Build first (week 1–2)

| # | Test | Why P0 | Locators |
|---|---|---|---|
| P0-1 | **Launch → authenticated home** (token pre-seeded) | Gate for every other test; proves build, env config, storage and startup routing | 🟢 `chatMenuButton`, `chatEmptyState` |
| P0-2 | **Launch with no session → Login** | Proves the other branch of the startup decision; cheap | 🟡 `Continue with Google` |
| P0-3 | **Send a chat message → user bubble + non-empty assistant reply** | The product's core value; exercises auth header, network, SSE streaming | 🟢 `chatComposerPrimaryButton`, `chatMessageThread`, `chatMessageBubble_<i>` |
| P0-4 | **Project CRUD** (create → appears → update → delete → gone) | Most deterministic real backend round trip in the app; self-cleaning | 🟡 `New project`, `Creating...`, `Delete project?`, `Project created`, `Project deleted` |
| P0-5 | **Logout → Login, and stays logged out after relaunch** | Security-relevant; verifies token clearing and persistence | 🟡 `Log out`, `Continue with Google` |
| P0-6 | **Drawer navigation smoke** (Chats / Projects / Artifacts / Code / Settings, each opens and backs out) | One test covers 5 screens and the whole nav graph | 🟡 titles + 🟢 `Key('settings')` |

**P0 exit criteria:** a green suite runnable on a clean emulator in < 10 minutes,
with seeded auth and no manual steps.

---

## P1 — Next (week 3–5)

| # | Test | Notes |
|---|---|---|
| P1-1 | Chats list: load → search (respect 300 ms debounce) → open a conversation | seed 3 conversations with unique titles |
| P1-2 | Chats: long-press → multi-select → bulk delete with confirm dialog | long-press gesture tuning required |
| P1-3 | Project → New chat → send → back → conversation appears in project details | validates the pop-result refresh contract |
| P1-4 | Projects: delete from list via long-press (second delete path) | different dialog copy than P0-4 |
| P1-5 | Artifacts: list, search, tap → lands on the right conversation | 🟢 `artifactsListView` |
| P1-6 | Settings → Profile: fields rendered from `/v1/me`; Retry on error | assert labels `Name`/`Email`/`Sign-in provider`/`User ID`, not values |
| P1-7 | Empty-state matrix on a clean account (chats/projects/artifacts/code) | needs a second, empty test account |
| P1-8 | Error-state matrix with network disabled (`ErrorContent` + `Try Again` recovers) | airplane-mode toggling per platform |
| P1-9 | Chat composer rules: send button absent when the field is empty/whitespace; appears with text; composer clears after send | pure-UI, very stable |
| P1-10 | Incognito toggle: standard ⇄ `chatIncognitoView` | 🟢 keyed both ways |

---

## P2 — Later / specialised (week 6+)

| # | Test | Blocker to resolve first |
|---|---|---|
| P2-1 | Remote session via an existing available session row → send prompt → approve a tool permission → disconnect | live `puku-cli` peer per worker |
| P2-2 | Remote session: change model / permission mode | same |
| P2-3 | Remote session: question wizard + exit-plan-mode card | requires driving the CLI to emit those frames |
| P2-4 | QR pairing happy path + malformed-payload error | camera injection or physical rig |
| P2-5 | Image attachment from gallery → preview → send | OS picker + permission handling |
| P2-6 | Chat model-selection sheet interactions | mostly cosmetic today |
| P2-7 | Full Google OAuth through the browser | context switching + real credentials; keep 1 nightly run at most |
| P2-8 | Voice input → transcription fills the composer | mic injection, non-deterministic output |
| P2-9 | Token-refresh behaviour across a long session | needs short-lived tokens from the backend |
| P2-10 | Backgrounding/foregrounding during a remote session (auto disconnect/reconnect) | inherently flaky; consider manual |

---

## Do not automate (keep manual / exploratory)

Live Voice Chat (no wired behaviour) · all ❌ placeholder rows in Settings, Login
legal links, `Enter your email`, `Files`, `More models`, `Effort` ·
theme switching (single theme) · `Transcribe` screen (unreachable) ·
project *knowledge* add-content flow (unwired) · animations, haptics, pixel
fidelity · assertions on LLM wording.

---

## Recommended first automation target

### ▶ **P0-4 — Project CRUD (create → update → delete)**

**Why this one, ahead of the chat flow:**

1. **Fully deterministic.** No LLM in the loop; every outcome is a fixed string
   (`Project created`, `Project deleted`, `Delete project?`, `Creating...`).
2. **Real backend coverage.** It exercises `POST`, `PATCH`, `DELETE`
   `/v1/chat/projects` plus the auth interceptor — the same plumbing every other
   feature depends on. A failure here localises the problem immediately.
3. **Self-cleaning.** The test deletes what it creates, so it can run repeatedly
   against a shared QA account without polluting data.
4. **Exercises the three interaction primitives** the rest of the suite needs:
   bottom-sheet form entry, confirm dialogs, and list-row matching by dynamic
   text. Solving those once unblocks P1 entirely.
5. **No device-specific surface** — no camera, mic, browser, or WebSocket.

**Immediately after it, build P0-1 + P0-6** (launch + navigation smoke) so every
later test has a trustworthy entry point, then **P0-3** (chat send) with
structural-only assertions.

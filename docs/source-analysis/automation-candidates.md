# Automation Candidates

Rated for **black-box** mobile automation (Appium / Maestro / Patrol driving a
built APK/IPA, no source access at runtime).

---

## Tier A — Highly suitable (automate first)

### A1 · Project CRUD (create → read → update → delete)
- **Why:** fully deterministic, server-backed, self-cleaning, and every state
  transition emits an assertable artefact (SnackBar `Project created` /
  `Project deleted`, dialog titles `Delete project?`, busy labels
  `Creating...` / `Updating...`).
- **Risk:** rows have no `Key` — must be matched by the project name you just
  typed. Use a unique name per run (e.g. `qa-proj-<timestamp>`).

### A2 · Logout & session persistence
- **Why:** one tap, unambiguous outcome (`Continue with Google` visible),
  verifiable across an app restart.
- **Risk:** none beyond needing an authenticated start state.

### A3 · Navigation graph traversal (drawer → each destination → back)
- **Why:** every destination has a stable title string (`Chats`, `Projects`,
  `Artifacts`, `Code`, `Settings`) and `Settings` has 🟢 `Key('settings')`.
- **Risk:** the drawer opens one frame late (post-frame callback) — add an
  explicit wait on the drawer title `Puku` before tapping items.

### A4 · Chat composer mechanics (not the reply)
- **Why:** `chatComposerPrimaryButton`, `chatComposerPlusButton`,
  `chatComposerMicButton`, `chatComposerVoiceButton`, `chatEmptyState`,
  `chatMessageThread`, `chatMessageBubble_<i>` are all keyed.
- **Assert:** send button *appears* only with non-empty trimmed text; composer
  clears after send; user bubble is appended.
- **Risk:** none — this is the best-instrumented surface in the app.

### A5 · List search + empty/error states
- **Why:** `Chats`, `Projects`, `Artifacts` share the same `SearchField`;
  empty strings are fixed (`No conversations yet`, `No projects yet`,
  `No artifacts yet`); errors render `Try Again`.
- **Risk:** the **300 ms debounce** — never assert immediately after typing.

---

## Tier B — Suitable with preparation

### B1 · Chat send → streamed assistant reply
- **Prep:** a stable backend or a mock/proxy. Assertions must be structural
  (bubble count, non-empty text, streaming indicator disappears), never textual.
- **Risk:** unbounded LLM latency; SSE chunks arrive continuously so
  `pumpAndSettle`-style "wait for idle" strategies will time out.

### B2 · Conversation multi-select and bulk delete
- **Prep:** seed 2–3 conversations via the API before the test.
- **Risk:** entry is via **long-press** — gesture duration is flaky across
  drivers; rows are identified only by server-supplied titles.

### B3 · Project ⇄ Chat round trip (UF-08)
- **Prep:** an existing project.
- **Risk:** relies on the pop-result contract
  (`ChatScreenResult.projectConversationCreated`) to refresh the details list —
  add a retry/refresh tolerance in assertions.

### B4 · Profile screen
- **Prep:** a test account whose `/v1/me` payload is known and stable.
- **Risk:** rows are conditionally rendered (`Name`, `Sign-in provider`,
  `User ID` only when non-null). Do not assert on `puku@puku.net` / `puku` —
  those are the *error-state fallbacks* in Settings.

### B5 · Remote session via an already-listed session row
- **Prep:** a `puku-cli` peer kept alive by CI, plus the relay reachable.
- **Why suitable:** the whole remote-chat surface is densely keyed
  (permission card, question wizard, progress panel, exit-plan-mode card).
- **Risk:** requires a second live process; a row is tappable only when
  `isAvailableToPair`.

---

## Tier C — Difficult / unstable

### C1 · Google OAuth end-to-end (UF-03)
Leaves the Flutter app for a Chrome Custom Tab / ASWebAuthenticationSession.
Requires context switching, real Google credentials, and is subject to bot
detection, 2FA and consent-screen changes. **Automate the token-seeding
alternative instead; keep one manual/nightly check of the real flow.**

### C2 · QR-code pairing (UF-10 steps 2–6)
Needs a live camera pointed at a rendered QR. Emulator camera injection is
possible (Android virtual scene / `adb emu`) but brittle. Prefer the
session-row entry path. The *negative* path (malformed payload →
`Key('remoteSessionScannerError')`) is only reachable if you can control what
the camera sees.

### C3 · Camera & gallery attachment (UF-05)
Crosses into the OS picker + runtime permission dialogs; iOS photo-library
behaviour differs by OS version. Automatable with per-platform helpers but
maintenance-heavy.

### C4 · Voice input / transcription
Requires microphone input and `RECORD_AUDIO` permission; the emulator's mic is
unreliable and the transcription result is non-deterministic.

### C5 · Remote-session lifecycle edge cases
`didChangeAppLifecycleState` disconnects on background and reconnects on
resume. Any incidental backgrounding (permission dialog, notification, driver
screenshot on some setups) will drop the socket mid-test.

### C6 · Anything asserting LLM text
Model responses vary run to run. Structural assertions only.

---

## Tier D — Keep manual

| Area | Reason |
|---|---|
| `Live voice chat` screen | Stop button is `onTap: () {}`; no audio pipeline wired — nothing to verify |
| All ❌ placeholder rows (Billing, Usage, Capabilities, Permissions, Voice, Notifications, Shared links, account switcher, Info, legal links, `Enter your email`, `Files`, `More models`, `Effort`) | Asserting a SnackBar that says "not connected yet" locks in temporary behaviour; these tests must be deleted the moment the feature ships |
| Theme switching | `blackTheme()` is used for both light and dark — no observable difference |
| `Transcribe` screen | Route not linked from any UI; unreachable to a black-box user |
| Visual/pixel fidelity, animations, haptics | Better served by screenshot review than by assertions |
| Accessibility audit | Several actions have `semanticLabel: ''` (Settings back, Projects back) — worth a manual a11y pass and a bug report |

---

## Cross-cutting stability notes

| Factor | Impact |
|---|---|
| BLoC async rendering | Every tap resolves on a later frame. Always wait for the *next* state's marker element, never `sleep`. |
| 300 ms search debounce | Type → wait > 300 ms → assert. |
| Index-based bubble keys (`chatMessageBubble_<i>`) | Indices shift as messages stream in. Anchor to `last` rather than a fixed index. |
| Route arguments are Dart objects (`projectDetails`, `remoteChat`) | These screens **cannot** be launched directly; they must be reached by tapping. |
| Post-frame callbacks (drawer open, back navigation in Remote Chat) | Add explicit waits for the destination marker. |
| `RouteAware` refresh on Code screen | An extra network call fires on every back-navigation — expect a transient spinner. |
| Portrait lock | No rotation tests needed/possible. |
| Sentry session replay + screenshots | If `SENTRY_DSN` is set in the test build, every run uploads screenshots. Prefer building automation APKs **without** a DSN. |

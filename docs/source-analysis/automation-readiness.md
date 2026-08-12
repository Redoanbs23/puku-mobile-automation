# Automation Readiness & Gaps

---

## 1. Prerequisites checklist

| # | Prerequisite | Status in repo | Owner / action |
|---|---|---|---|
| 1 | **Installable build (APK / IPA)** | ❌ not built | Build `dev` or `qa` flavour: `flutter build apk --flavor qa --release -t lib/main_qa.dart`. Note `make apk` is **miswired** — it uses `--flavor dev` with `-t lib/main_prod.dart`. |
| 2 | **Environment assets** `assets/env/.env.{dev,qa,prod}.json` | ❌ **absent (gitignored)** — build fails without them | Obtain from the dev team. 5 required keys (see `test-data-and-dependencies.md` §1). **Hard blocker.** |
| 3 | **Test account(s)** | ❌ | Need ≥ 2: one seeded, one empty. Google identity without 2FA if UI login is ever automated. |
| 4 | **Backend environment** (QA/staging) | ❌ | A non-production `API_BASE_URL` that tolerates create/delete churn. |
| 5 | **API access for seeding/teardown** | ❌ | Direct token + endpoint access so tests can create/delete conversations and projects out-of-band. |
| 6 | **Auth strategy decision** | ❌ | Recommend token pre-seeding into `shared_preferences`; requires knowing the storage keys used by `SecureTokenStorage`. |
| 7 | **Devices / emulators** | ❌ | Android emulator (API 33+) as the baseline; ≥ 1 physical Android device for camera/mic; iOS simulator + ≥ 1 physical iPhone if iOS is in scope. |
| 8 | **Camera-capable target** for QR pairing | ❌ | Physical device, or emulator virtual-scene image injection. |
| 9 | **Live `puku-cli` `/remote-control` peer** | ❌ | Only needed for the remote-session suite; must be one peer per parallel worker. |
| 10 | **Relay reachability** (`wss://`) from the test network | ❓ | Verify no corporate proxy blocks WebSockets. |
| 11 | **Sentry-free test build** | ❌ | Build **without** `--dart-define=SENTRY_DSN=...` so runs don't upload screenshots/replays. |
| 12 | **Automation repo + framework choice** | ❌ | Separate repo, per the brief. |
| 13 | **CI runners** with emulator support | ❓ | `.github/` exists; scope unknown for mobile UI jobs. |

---

## 2. Framework recommendation

| Option | Fit | Comment |
|---|---|---|
| **Appium (+ Flutter driver plugin / UiAutomator2 + XCUITest)** | ✅ recommended | True black-box, separate repo, handles the browser context switch for OAuth and the OS pickers. Flutter `Key`s surface as accessibility ids when the app exposes semantics (verify per element — see gap G-2). |
| Maestro | ✅ good for smoke | Very low authoring cost, resilient text matching; weaker for OS-context switching. |
| Patrol / `integration_test` | ⚠️ | Requires being *inside* the app repo — conflicts with the stated "separate repository, no source access" constraint. |

---

## 3. Locator catalogue (what a black-box driver can see)

### 3.1 Declared `Key`s — the reliable set

From `lib/constants/widget_keys.dart` and inline `Key(...)` declarations:

**Chat** — `chatMenuButton`, `chatIncognitoButton`, `chatIncognitoCloseButton`,
`chatEmptyState`, `chatIncognitoView`, `chatIncognitoLearnMoreButton`,
`chatComposerPlusButton`, `chatComposerMicButton`,
`chatComposerRecordingIndicator`, `chatMessageStreamingIndicator`,
`chatComposerPrimaryButton`, `chatComposerModelChipButton`,
`chatComposerModeChipButton`, `chatComposerVoiceButton`,
`chatAttachmentPreview`, `chatAttachmentRemoveButton`, `chatMessageThread`,
`chatMessageBubble` (used as `chatMessageBubble_<index>`)

**Chat sheets** — `chatCameraTile`, `chatPhotosTile`, `chatResearchSwitch`,
`chatModelOpus48Option`, `chatModelPukuAi28Option`, `chatModelPukuAi27Option`,
`chatMoreModelsButton`, `chatSheetCloseButton`, `messageBubbleCodeCopyButton`

**Remote session** — `remoteChatPermissionCard`,
`remoteChatPermissionAllowOnceButton`, `remoteChatPermissionAlwaysAllowButton`,
`remoteChatPermissionDenyButton`, `remoteChatQuestionCard`,
`remoteChatQuestionBackButton`, `remoteChatQuestionCancelButton`,
`remoteChatQuestionNextButton`, `remoteChatQuestionSubmitButton`,
`remoteChatDisconnectButton`, `remoteChatProgressPanel`,
`remoteChatTurnProgressRow`, `remoteChatTurnCheckpointRow`,
`remoteChatAgentProgressRow_<n>`, `remoteChatThinkingBlock`,
`remoteChatAttachmentSheet`, `remoteChatAttachCameraOption`,
`remoteChatAttachGalleryOption`, `remoteChatAttachmentPreview`,
`remoteChatAttachmentRemoveButton`, `remoteSessionScannerView`,
`remoteSessionScannerError`, `remoteChatModelOption_<model>`,
`remoteChatModeOption_<mode>`

**Code / plan mode** — `codeNewSessionButton`, `codeModelPanel`,
`exitPlanModeCard`, `exitPlanModeAutopilotButton`, `exitPlanModeManualButton`,
`exitPlanModeTellPukuButton`, `exitPlanModeFeedbackField`,
`exitPlanModeSendFeedbackButton`, `exitPlanModeBackButton`

**Other** — `artifactsListView`, `settings`,
`projects-loading-search`, `projects-loading-row-<i>`

### 3.2 Semantics labels

`AppScaffoldIconAction` wraps its icon in `Semantics(button: true, label: …)`, so
these are exposed to accessibility trees: `Back`, `Delete`, `Information`,
`Refresh sessions`, `More actions`, `Close`, `Connected. Disconnect`,
`Disconnected`, `Filter projects`, plus the live-voice buttons `Settings`,
`Stop`, `Close`.

**Gap:** Settings back and Projects back pass `semanticLabel: ''` — they are
*not* addressable by label.

### 3.3 Stable visible text (from `lib/l10n/intl_en.arb`, English only)

Screen titles: `Settings`, `Profile`, `Chats`, `Projects`, `Artifacts`, `Code`,
`New Session`, `Scan remote session`, `Transcribe`.
Actions: `Continue with Google`, `Enter your email`, `Log out`, `Try Again`,
`Retry`, `Delete`, `Cancel`, `New project`, `Update project`, `New chat`,
`New Session`, `Remove`.
Empty states: `No conversations yet`, `No projects yet`, `No artifacts yet`,
`No sessions found`, `Chats you've had with Puku will show up here.`
Dialogs: `Delete conversations?`, `Delete project?`, `Remove from project?`
Hints: `Chat with Puku...`, `Search Chats`, `Search projects`,
`Search Artifacts`, `My project`, `Optional short description`,
`Describe what you want to build...`
Busy: `Creating...`, `Updating...`
Validation: `Describe what you want to build before starting a session.`

### 3.4 Dynamic / unstable elements — do not hard-code

Conversation titles · project names · artifact titles · `Session {first 8 chars
of sessionId}` · remote-chat AppBar title (raw session id) · relative timestamps
(`Just now`, `{n}m ago`, `Edited {n}d ago`) · `{n} selected` · profile
name/email/picture/user-id · assistant message text · progress/status strings ·
`{count} enabled` (currently hard-coded to 2).

### 3.5 Widget composition (Flutter vs platform)

- **Everything is a Flutter-rendered widget.** There are **no `WebView`s inside
  the app** — the misleadingly named `GoogleSignInWebViewScreen` delegates to
  `flutter_web_auth_2`, which opens an **external** Chrome Custom Tab /
  `ASWebAuthenticationSession`.
- **Platform surfaces you will cross into:** the OAuth browser tab, the
  `image_picker` camera/gallery UI, the `mobile_scanner` camera preview
  (a platform view embedded in the Flutter tree), runtime permission dialogs,
  and `url_launcher` targets.
- Bottom sheets are `showModalBottomSheet`-based; dialogs use a shared
  `showCommonDialog`; transient messages are `SnackBar`s (auto-dismissing —
  capture them promptly).

---

## 4. Known gaps & risks

| ID | Gap | Impact | Suggested fix (app-side, for the dev team) |
|---|---|---|---|
| **G-1** | `assets/env/*.json` absent | **Cannot build at all** | Provide a QA env file or a documented template |
| **G-2** | Keys ≠ accessibility ids by default | Appium may not see Flutter `Key`s unless semantics are exposed | Ask the team to confirm `SemanticsBinding`/accessibility exposure, or to add `Semantics(identifier: …)` alongside existing keys |
| **G-3** | No keys on list rows (chats, projects, artifacts, code sessions, drawer items) | Row selection depends on server text | Add `Key('conversationRow_<id>')`, `Key('projectRow_<id>')`, etc. |
| **G-4** | `semanticLabel: ''` on two back buttons | Not addressable; also an a11y defect | Provide real labels |
| **G-5** | No key on the chat composer `TextField` or the search fields | Must locate by type/hint | Add `chatComposerTextField`, `searchField` keys |
| **G-6** | Existing `integration_test/*.dart` are **stale template tests** referencing `Launches`, `Rockets`, `Cores`, `FalconSat1`, `appearance`, `theme_mode_switch` — none of which exist in this app | Anyone running `make integration_test` gets false failures; also `Makefile`'s `integration_test` target is empty | Delete or rewrite them |
| **G-7** | `make apk` builds `--flavor dev` with `-t lib/main_prod.dart` | Wrong env asset for the flavour | Fix the Makefile |
| **G-8** | Route args are Dart objects (`projectDetails`, `remoteChat`) | No deep-link shortcut into these screens | Accept id-based args, or add a debug deep link |
| **G-9** | Single-client constraint on remote sessions | Parallel workers collide | One session id per worker |
| **G-10** | Many ❌ placeholder actions | Tests written against them will need deleting later | Tag such tests clearly or skip them |
| **G-11** | Sentry replay/screenshot in instrumented builds | Test noise + data upload | Build without `SENTRY_DSN` |
| **G-12** | No pull-to-refresh / pagination | Long lists cannot be exercised for paging | n/a — just don't write those tests |
| **G-13** | English-only | No localization test matrix | n/a |

---

## 5. Existing test assets (for reference, not reuse)

- **48 Dart unit/widget tests** under `test/` covering blocs, repositories,
  data sources and several screens (`chat_screen_test`, `projects_screen_test`,
  `remote_chat_view_test`, …). These already give good white-box coverage —
  the black-box suite should **not** duplicate them; focus on cross-screen
  journeys and real backend integration.
- **`integration_test/`** — 5 files, all stale template tests (G-6). Treat as
  dead code, not as a starting point.
- **`test_driver/integration_test.dart`** — a working screenshot-capturing
  driver harness; the screenshot pattern is worth copying into the new repo.
- `.run/` contains IDE run configurations; `codecov.yml` and `.github/` indicate
  CI exists for unit tests.

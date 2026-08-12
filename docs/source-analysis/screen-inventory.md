# Screen Inventory

Every route registered in `lib/routes/navigation_service.dart`, plus modal
surfaces (bottom sheets / dialogs) that behave as screens for automation.

Legend for **Locator quality**: 🟢 stable `Key` exists · 🟡 stable visible text ·
🔴 no stable handle (type/position only).

---

## S-01 · Splash / Fallback — `SplashView`

| | |
|---|---|
| File | `lib/features/splash_view.dart` |
| Route | fallback for unknown route names |
| Purpose | Placeholder while `InitBloc` decides Login vs Chat |
| UI | A single `CircularProgressIndicator`, nothing else |
| Reach | App launch (briefly), or navigating to an unregistered route |
| Exit | Automatic — `InitBloc` → `OpenApp` → root replace |
| Locator quality | 🔴 no key, no text |

**Automation note:** never assert on this screen; treat any long dwell here as
a launch failure signal.

---

## S-02 · Login — `LoginScreen`

| | |
|---|---|
| File | `lib/features/login/login_screen.dart` |
| Route | `login` |
| Purpose | Unauthenticated entry point |
| Reach | Launch with no stored tokens; after logout; after refresh-token auth failure |

**UI elements** (all text from `lib/l10n/intl_en.arb`):

| Element | Visible text | Behaviour |
|---|---|---|
| Brand header + menu icon | `Puku Editor` | Tap → SnackBar `Menu action placeholder` |
| Hero copy | `The ` / `AI Code Editor` / `That Understands Your Entire ` / `Codebase` | static |
| Primary CTA | `Continue with Google` | → route `googleSignIn` |
| Divider label | `OR` | static |
| Secondary CTA | `Enter your email` | → SnackBar `Email sign-in flow is not connected yet` — **not implemented** |
| Legal links | `Consumer Terms`, `Usage Policy,`, `Privacy Policy` | each → SnackBar placeholder |
| Bottom art | image asset | decorative |

- **Input fields:** none.
- **Validation:** none.
- **Success state:** navigation away to `googleSignIn`.
- **Error state:** none on this screen.
- **Locator quality:** 🟡 — no `Key`s; use exact label text.

---

## S-03 · Google Sign-In — `GoogleSignInWebViewScreen`

| | |
|---|---|
| File | `lib/features/login/google_sign_in_web_view_screen.dart` |
| Route | `googleSignIn` (fullscreen dialog on iOS) |
| Purpose | Runs the OAuth 2.0 + PKCE authorization-code flow |

**Behaviour:** on `initState` it generates a PKCE pair and immediately calls
`FlutterWebAuth2.authenticate(...)`. Despite the class name **there is no
in-app WebView** — `flutter_web_auth_2` opens an external
CustomTabs/ASWebAuthenticationSession. Control returns via the deep link
`puku://callback/...` (or `https://api.app.dev.puku.sh/callback`).

| Element | Visible text | Notes |
|---|---|---|
| AppBar title | `Continue with Google` | |
| Body (default) | `LoadingContent` | spinner |
| Body (failure) | `Sign in failed. Please try again.` + `Try Again` button | `FilledButton`, restarts the flow with a fresh PKCE pair |

**States:** loading → (external browser) → success (navigates to `chat` root via
`AuthBloc`) · cancel (`PlatformException code == 'CANCELED'` → `pop()`) ·
error (`_flowFailed` or `AuthErrorState`).

**Validation performed:** callback URI scheme+host+path must match
`AUTH_REDIRECT_URI`; `state` must equal the generated state; `code` must be
non-empty. Failure → error view.

- **Locator quality:** 🟡 (`Try Again`, `Sign in failed. Please try again.`)
- **Automation risk:** ⛔ leaves the Flutter app — Appium/Patrol must switch to
  the browser/webview context. This is the single hardest step in the app.

---

## S-04 · Chat — `ChatScreen` (home)

| | |
|---|---|
| File | `lib/features/chat/chat_screen.dart` |
| Route | `chat` (also the post-login root) |
| Args | `ChatScreenArgs { conversationId, startFresh, projectId }` |
| BLoC | `ChatBloc` (created per-route in `_ChatRoute`, dispatches `ChatEvent.initialized`) |

**UI elements & keys** (`lib/constants/widget_keys.dart`):

| Element | Key / locator | Behaviour |
|---|---|---|
| Leading (menu or back) | `Key('chatMenuButton')` | root → opens drawer; pushed instance → pops with `ChatScreenResult` |
| Trailing incognito toggle | `Key('chatIncognitoButton')` / `Key('chatIncognitoCloseButton')` | toggles standard ⇄ incognito view |
| Empty state | `Key('chatEmptyState')` | shown when `messages.isEmpty` |
| Incognito view | `Key('chatIncognitoView')` | text `Incognito chat` |
| Message thread | `Key('chatMessageThread')`; bubbles `Key('chatMessageBubble_<index>')` | index-based |
| Composer text field | 🔴 `TextField`, hint `Chat with Puku...` | multiline, 1–10 lines |
| Send button | `Key('chatComposerPrimaryButton')` | **only rendered when** `text.trim().isNotEmpty \|\| hasAttachment` |
| Plus / attachments | `Key('chatComposerPlusButton')` | opens attachment sheet |
| Model chip | 🟢 `Key('chatComposerModelChipButton')` (default key on `ChatModelChip`); label = model name | opens model sheet |
| Mic | `Key('chatComposerMicButton')`, recording indicator `Key('chatComposerRecordingIndicator')` | records + transcribes into the field |
| Voice conversation | `Key('chatComposerVoiceButton')` | → `liveVoiceChat` |
| Attachment preview | `Key('chatAttachmentPreview')`, remove `Key('chatAttachmentRemoveButton')` | |
| Drawer | see S-05 | |

**States:** `isLoadingConversation` → `MessageThreadSkeleton`; empty → empty
state; populated → thread; `isSending`/`isUploadingAttachment` → send button
shows a `CircularProgressIndicator` and taps are disabled.

**Errors / notifications:** surfaced as `SnackBar` from
`state.chatNotification` and from `pendingAction` placeholders
(`Camera upload will be connected later`, `Tool access management will be
connected later`, `Effort controls are not connected yet`, …).

**Dependencies:** `GET /v1/chat/conversations`, `GET /v1/chat/conversations/{id}`,
`POST /v1/chat/conversations`, `POST /v1/chat/conversations/{id}/messages` (SSE),
`POST .../attachments`, `GET /v1/chat/projects`.

- **Locator quality:** 🟢 best-instrumented screen in the app.

---

## S-05 · Chat Navigation Drawer — `ChatNavigationDrawer`

| | |
|---|---|
| File | `lib/features/chat/widget/chat_navigation_drawer.dart` |
| Reach | Tap `Key('chatMenuButton')` on Chat root |
| Width | 84 % of screen width |

| Item | Visible text | Target |
|---|---|---|
| Title | `Puku` | — |
| Item 1 | `Chats` | route `chats` |
| Item 2 | `Projects` | route `projects` |
| Item 3 | `Artifacts` | route `artifacts` |
| Item 4 | `Code` | route `code` |
| Section header | `RECENTS` | only when recent conversations exist |
| Recent row | conversation title (dynamic) | tap → load conversation; long-press → delete confirm dialog |
| New chat | `New chat` | resets composer + conversation |
| Avatar | initial letter from profile | route `settings` |

**Note:** opening the drawer first unfocuses the composer, hides the keyboard,
and dispatches `recentConversationsRefreshRequested` in a post-frame callback →
**the drawer opens one frame late and its content can change after it opens.**

- **Locator quality:** 🟡 (labels only, no `Key`s on drawer items)

---

## S-06 · Chats list — `ChatsScreen`

| | |
|---|---|
| File | `lib/features/chats/chats_screen.dart` |
| Route | `chats` |
| BLoC | `ChatsBloc`, auto-dispatches `ChatsEvent.load()` |

| Element | Locator | Notes |
|---|---|---|
| Title | `Chats` / `{n} selected` in selection mode | |
| Back | `Semantics(label: 'Back')` | in selection mode it *clears selection* instead of popping |
| Delete action | `Semantics(label: 'Delete')` | only in selection mode; disabled when nothing selected or deleting |
| Search | `SearchField`, hint `Search Chats` | **300 ms debounce** |
| List | `ListView.separated` of `SelectableListRow` → `ConversationListRow` | tap → open chat; **long-press → selection mode** |
| Empty | `No conversations yet` | |
| Loading | `LoadingContent` | |
| Error | `ErrorContent` + `Try Again` | |
| Delete dialog | title `Delete conversations?`, body `This will permanently delete the selected conversation and its messages.` (or plural), buttons `Delete` / `Cancel` | |

**Return value:** pops a `Set<String>` of deleted conversation ids; ChatScreen
uses it to reset itself if the active conversation was deleted.

- **Locator quality:** 🟡🔴 — no `Key`s on rows; rows are identified only by
  conversation title (server data).

---

## S-07 · Projects list — `ProjectsScreen`

| | |
|---|---|
| File | `lib/features/projects/projects_screen.dart` |
| Route | `projects` |

| Element | Locator | Notes |
|---|---|---|
| Title | `Projects` | |
| Back | `AppScaffoldIconAction(semanticLabel: '')` | **empty semantic label — 🔴 not addressable by label** |
| Search | hint `Search projects` | 300 ms debounce |
| FAB | `NewProjectFab` | opens Create Project sheet (S-08) |
| Row | `ProjectListRow` (name + `Edited …` timestamp) | tap → details; long-press → delete confirm |
| Empty | `No projects yet` | |
| Loading | `ProjectsLoadingShimmer` — 🟢 keys `ValueKey('projects-loading-search')`, `ValueKey('projects-loading-row-<i>')` (prefix in file) | |
| Error | `ErrorContent` + `Try Again` | |
| Delete dialog | `Delete project?` / `Delete "{name}" from your projects list? This cannot be undone.` / `Delete` / `Cancel` | |
| Filter menu | **commented out** in source — not present in the UI | |

---

## S-08 · Create / Update Project sheet — `CreateUpdateProjectSheet`

| | |
|---|---|
| File | `lib/features/projects/widget/create_update_project_sheet.dart` |
| Reach | Projects FAB · Project Details ⋮ → `Update project` · Chat attachment sheet → `Add to project` → create |

| Field | Label | Hint | Lines |
|---|---|---|---|
| Name | `Name` | `My project` | 1 |
| Description | `Description` | `Optional short description` | 3 |
| Instructions | `Custom instructions` | `e.g. You are a senior iOS engineer…` | 5 |

- **Submit button:** `New project` / `Update project`; busy text `Creating...` /
  `Updating...`. Enabled only when `state.canSubmit`
  (`ProjectEditorBloc`, `lib/features/projects/project_editor/`).
- **Error text:** `Unable to create project right now.` /
  `Unable to save project changes right now.` (rendered inline, not a SnackBar).
- **Close:** `Icons.close` in the header.
- **Locator quality:** 🟡 (labels/hints), 🔴 (no `Key`s on fields).

---

## S-09 · Project Details — `ProjectDetailsScreen`

| | |
|---|---|
| File | `lib/features/projects/project_details_screen.dart` |
| Route | `projectDetails`, **argument = a full `ProjectEntity` object** |

| Element | Locator | Notes |
|---|---|---|
| Back | `Semantics(label: 'Back')` | disabled while deleting |
| ⋮ actions menu | `Semantics(label: 'More actions')` → `Update project`, `Delete` | |
| FAB | `ProjectDetailsNewChatFab` (`New chat`) | opens chat with `startFresh: true, projectId` |
| Content | knowledge / custom-instructions / conversation list sections | `ProjectDetailsContent` |
| Conversation row | tap → open · long-press → `Remove from project?` dialog (`Remove` / `Cancel`) | |
| Deleting overlay | `ModalBarrier(dismissible: false)` + centered spinner | blocks all input |

**Return value:** `ProjectDetailsResult.deleted` / `.updated` / `null`.

⚠️ Because the route argument is a Dart object, **this screen cannot be deep-linked
or launched directly by an external automation driver** — it must be reached by
tapping through Projects.

---

## S-10 · Artifacts — `ArtifactsScreen`

| | |
|---|---|
| File | `lib/features/artifacts/artifacts_screen.dart` |
| Route | `artifacts` |

| Element | Locator |
|---|---|
| Title | `Artifacts` |
| Back | `Semantics(label: 'Back')` |
| Search | hint `Search Artifacts` (300 ms debounce) |
| List | 🟢 `Key('artifactsListView')`, rows `ArtifactListRow` (title, language, createdAt) |
| Empty | `No artifacts yet` |
| Error | `ErrorContent` + `Try Again` |

Tapping a row navigates to `chat` with the artifact's `conversationId`.

---

## S-11 · Code (remote sessions list) — `CodeScreen` → `CodeSessionsView`

| | |
|---|---|
| Files | `lib/features/code/code_screen.dart`, `widget/code_sessions_view.dart` |
| Route | `code` |

| Element | Locator | Notes |
|---|---|---|
| Title | `Code` | |
| Back | `Semantics(label: 'Back')` | |
| Refresh | `Semantics(label: 'Refresh sessions')` | replaced by a spinner while `isRefreshing` |
| Session row | `CodeSessionListRow`, title `Session {first 8 chars of sessionId}`, badges `Busy` / `Expired` | tap enabled only when `session.isAvailableToPair` |
| New session | 🟢 `Key('codeNewSessionButton')`, label `New Session` | → `remoteSessionScanner` |
| Empty state | `No sessions found` + description + a new-session CTA | |
| Error | `ErrorContent` + `Try Again` | |

Uses `RouteAware` — returning to this screen auto-fires
`CodeEvent.refreshRequested()` (an extra network call on every back-navigation).

**Backend:** `GET https://<REMOTE_SESSION_RELAY_HOST>/v1/sessions?mine=1`.

---

## S-12 · New Code Session — `NewCodeSessionView`

Rendered by `CodeScreen` when `state.isCreatingSession` is true (same route).

| Element | Locator | Notes |
|---|---|---|
| Title | `New Session` | |
| Close | `Semantics(label: 'Close')` | |
| Model panel | 🟢 `Key('codeModelPanel')`, header `MODEL` | expandable selection panel |
| Environment panel | header `ENVIRONMENT` | expandable |
| Suggested prompts | header `SUGGESTED`, chips | tap fills the description |
| `Connect to GitHub` / `Connect to Figma` | display rows | no `onTap` wired |
| Accept-edits switch | `Accept edits automatically` | `Switch.adaptive` |
| Description field | hint `Describe what you want to build...` | |
| Validation | `Describe what you want to build before starting a session.` shown when `validationMessage == 'description_required'` | 🟡 only inline validation message in the app |
| Send | `Icons.send_rounded` / voice button `Semantics(label: 'Start session')` | both call `onSubmit` |

**UNVERIFIED:** what actually creates a session server-side from this view — no
network call for session creation is visible in `CodeBloc`; only discovery
(`GET /v1/sessions`) and QR pairing are wired. Treat this view as
partially-implemented until confirmed against a running build.

---

## S-13 · Remote Session Scanner — `RemoteSessionScannerScreen`

| | |
|---|---|
| File | `lib/features/remote_session/remote_session_scanner_screen.dart` |
| Route | `remoteSessionScanner` |

| Element | Locator |
|---|---|
| Title | `Scan remote session` |
| Back | `Semantics(label: 'Back')` |
| Instruction | `Scan the QR code generated by /remote-control in Puku CLI.` |
| Camera preview | 🟢 `Key('remoteSessionScannerView')` (`MobileScanner`) |
| Error banner | 🟢 `Key('remoteSessionScannerError')` — text from the `FormatException` |

**Accepted payload formats** (`RemoteSessionPairingEntity.parse`):
1. URI with query `?s=<sessionId>&t=<token>` (e.g. `puku://remote?s=…&t=…`)
2. JSON `{"sessionId":…,"token":…}` or `{"s":…,"t":…}`
3. `key=value` pairs separated by `&`, `;` or newline

Invalid → error text `Unsupported QR payload. Expected sessionId and token.`
or `Empty pairing payload.`

On success it **replaces** the current route with `remoteChat`.

**Test seam:** the widget accepts a `scannerBuilder` override — used by widget
tests, but **not reachable from a black-box driver**.

---

## S-14 · Remote Chat — `RemoteChatScreen` / `RemoteChatView`

| | |
|---|---|
| Files | `lib/features/remote_session/remote_chat_screen.dart`, `widget/remote_chat_view.dart` |
| Route | `remoteChat`, arg `RemoteChatScreenArgs` (Dart object) |

| Element | Locator | Notes |
|---|---|---|
| Title | the raw `sessionId`; subtitle `Remote control` | dynamic |
| Back | `Semantics(label: 'Back')` | dismisses keyboard, pops next frame |
| Connection toggle | 🟢 `Key('remoteChatDisconnectButton')`; semantic label `Connected. Disconnect` / `Disconnected` | green/red link icon |
| Transcript | `RemoteChatTranscriptSection`; bubbles `Key('chatMessageBubble_<i>')`; thinking block `Key('remoteChatThinkingBlock')` | |
| Progress panel | 🟢 `Key('remoteChatProgressPanel')`, rows `remoteChatTurnProgressRow`, `remoteChatTurnCheckpointRow`, `remoteChatAgentProgressRow_<n>` | |
| Composer | shared `ChatComposer` (same keys as S-04) + mode chip `Key('chatComposerModeChipButton')`; voice button hidden | send enabled only when `state.canSend` |
| Attachment sheet | 🟢 `Key('remoteChatAttachmentSheet')`, options `remoteChatAttachCameraOption` / `remoteChatAttachGalleryOption` | |
| Attachment preview | 🟢 `remoteChatAttachmentPreview`, remove `remoteChatAttachmentRemoveButton` | |
| Model sheet | option keys `remoteChatModelOption_<model>`; title `Select model` | |
| Permission-mode sheet | option keys `remoteChatModeOption_<mode>`; title `Select Permission Mode` | |
| Tool permission card | 🟢 `remoteChatPermissionCard` + `remoteChatPermissionAllowOnceButton`, `remoteChatPermissionAlwaysAllowButton`, `remoteChatPermissionDenyButton` | replaces the composer while pending |
| Question wizard | 🟢 `remoteChatQuestionCard` + `remoteChatQuestionBackButton`, `remoteChatQuestionCancelButton`, `remoteChatQuestionNextButton`, `remoteChatQuestionSubmitButton` | |
| Exit-plan-mode card | 🟢 `exitPlanModeCard`, `exitPlanModeAutopilotButton`, `exitPlanModeManualButton`, `exitPlanModeTellPukuButton`, `exitPlanModeFeedbackField`, `exitPlanModeSendFeedbackButton`, `exitPlanModeBackButton` | |
| Errors | red `SnackBar` from `modelChangeError` / `permissionModeChangeError` | |

**Lifecycle coupling:** `didChangeAppLifecycleState` disconnects on
`paused`/`hidden` and reconnects on `resumed`. Any app-backgrounding during a
test (permission dialog, notification) drops the socket.

Defaults: `currentModel = 'puku-ai-2.7'`, `currentPermissionMode = 'default'`,
initial `statusMessage = 'Scan a pairing QR code to begin.'`.

---

## S-15 · Live Voice Chat — `LiveVoiceChatScreen`

| | |
|---|---|
| File | `lib/features/chat/live_voice_chat_screen.dart` |
| Route | `liveVoiceChat` |

| Element | Locator | Behaviour |
|---|---|---|
| Prompt | `Start talking` (`Semantics(header: true)`) | static |
| Settings button | `Semantics(label: 'Settings')` | opens `VoiceSettingsBottomSheet` |
| Stop button | `Semantics(label: 'Stop')` | **`onTap: () {}` — no-op** |
| Close button | `Semantics(label: 'Close')` | pops |

The settings sheet exposes voice selection, language, pace and mode; `onLanguageTap`
and `onPaceTap` are empty callbacks. **This screen is a UI shell — there is no
audio capture or streaming wired.** Not an automation target.

---

## S-16 · Settings — `SettingsScreen`

| | |
|---|---|
| File | `lib/features/settings/settings_screen.dart` |
| Route | `settings` |
| Root key | 🟢 `Key('settings')` (via `KeyedSubtree`) |

| Element | Visible text | Behaviour |
|---|---|---|
| Title | `Settings` | centered |
| Back | `AppScaffoldIconAction(semanticLabel: '')` | 🔴 empty label |
| Info action | `Semantics(label: 'Information')` | SnackBar `Information action placeholder` |
| Account header | email + org name from `ProfileBloc`; badge `Power` | switcher → SnackBar placeholder |
| `Profile` | → route `profile` | ✅ implemented |
| `Billing`, `Usage` | SnackBar placeholders | ❌ |
| `Capabilities` (subtitle `2 enabled`), `Permissions`, `Voice` | SnackBar placeholders | ❌ |
| `Haptic feedback` | local `Switch` only — **not persisted** | |
| `Notifications`, `Shared links` | SnackBar placeholders | ❌ |
| `Send Sentry test event` | only when `kDebugMode && isSentryEnabled` | |
| `Log out` | `AuthEvent.logout()` → clears tokens → `goLoginRoot()` | ✅ implemented |

Account header falls back to the literals `puku@puku.net` / `puku` when the
profile request fails — **do not assert on those as real data.**

---

## S-17 · Profile — `ProfileScreen`

| | |
|---|---|
| File | `lib/features/settings/profile_screen.dart` |
| Route | `profile` (Cupertino transition) |

| State | Content |
|---|---|
| Loading | `LoadingContent` |
| Error | centered `FilledButton` labelled `Retry` |
| Success | avatar (picture or initials) + name + email, then an info card |

Info card rows (each rendered only when the field is non-null):
`Name`, `Email`, `Sign-in provider`, `User ID`.

Back button uses the platform back tooltip
(`MaterialLocalizations.backButtonTooltip` → "Back" in English).

**Backend:** `GET {API_BASE_URL}/v1/me`.

---

## S-18 · Transcribe — `TranscribeScreen` (developer screen)

| | |
|---|---|
| File | `lib/features/transcribe/transcribe_screen.dart` |
| Route | `transcribe` — **registered but not linked from any UI** |

| Element | Locator |
|---|---|
| AppBar | `Transcribe` |
| Field 1 | label `Audio file path`, hint `/path/to/recording.m4a` |
| Field 2 | label `Language (optional)`, hint `e.g. en, bn, es — leave blank for auto-detect` |
| Button | `Transcribe` (disabled while loading) |
| Result | `Transcription ({n} words)` + text |
| Error | `An error occurred. Please try again.` |

Empty path defaults to the literal `mock_audio.m4a`. Backend:
`POST /v1/transcribe` (multipart `audio` + optional `language`).

Not reachable by a black-box user → **out of scope for UI automation.**

---

## Shared modal surfaces

| Surface | File | Keys / text |
|---|---|---|
| Chat attachment sheet | `features/chat/widget/chat_attachment_sheet.dart` | 🟢 `chatCameraTile`, `chatPhotosTile`, `chatResearchSwitch`; title `Add to chat`; rows `Camera`, `Photos`, `Files`, `Research`, `Add to project`, `Tool access` |
| Chat model sheet | `features/chat/widget/chat_model_selection_sheet.dart` | 🟢 `chatModelOpus48Option`, `chatModelPukuAi28Option`, `chatModelPukuAi27Option`, `chatMoreModelsButton`; title `Select model` |
| Sheet close button | `features/chat/widget/chat_bottom_sheet_scaffold.dart` | 🟢 `chatSheetCloseButton` |
| Code-block copy | `features/chat/widget/chat_markdown_code_block_builder.dart` | 🟢 `messageBubbleCodeCopyButton` |
| Chat project picker | `features/chat/widget/chat_project_picker_sheet.dart` | 🔴 no keys |
| Common confirm dialog | `widgets/common_dialog.dart` (`showCommonDialog`) | positive/negative labels vary per call site |
| Project add-content sheet | `features/projects/widget/project_add_content_sheet.dart` | text `Add Content to Project`, `Upload from device`, `Take picture`, `Choose image`, `Create new document` |

---

## Screen count summary

- **14 registered routes**, of which **13 are user-reachable** (`transcribe` is not).
- **18 distinct screen/view states** catalogued above (incl. `SplashView`,
  the drawer, and the two `CodeScreen` sub-views).
- **7 recurring modal surfaces**.

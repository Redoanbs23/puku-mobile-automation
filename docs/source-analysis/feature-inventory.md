# Feature Inventory

Status legend: ✅ implemented & backed by a real API · 🟨 partially implemented ·
❌ placeholder only (shows a SnackBar / no-op) · ❓ unverified from source alone.

---

## F-01 · Authentication

| Sub-feature | Status | Evidence |
|---|---|---|
| Google sign-in (OAuth 2.0 authorization code + PKCE S256) | ✅ | `google_sign_in_web_view_screen.dart`, `utils/pkce_utils.dart`, `service/auth/auth_service.dart` |
| Email sign-in | ❌ | `login_screen.dart` → SnackBar `Email sign-in flow is not connected yet` |
| Token persistence | ✅ | `TokenManager` + `SecureTokenStorage` over `shared_preferences` |
| Silent token refresh | ✅ | `RefreshCoordinator` + `AuthTokenInterceptor`; refresh threshold **60 min before expiry** (`TokenManager.refreshThresholdMs`) |
| Forced re-login on refresh failure | ✅ | `AuthTokenInterceptor.onRequest` → `goLoginRoot()` |
| Session-expired broadcast | ✅ | `AuthSessionManager.onSessionExpired` → `AuthEvent.sessionExpired` |
| Logout | ✅ | `AuthBloc._onLogout` → best-effort `POST /auth/logout`, then always clears local tokens |
| Token verify / health endpoints | ✅ (exposed, no UI) | `GET /auth/verify`, `GET /health` in `ChatAuthService` |

**Legal links** (Terms / Usage / Privacy) — ❌ placeholders.

---

## F-02 · Chat

| Sub-feature | Status | Notes |
|---|---|---|
| Create conversation | ✅ | `POST /v1/chat/conversations` |
| Load conversation history | ✅ | `GET /v1/chat/conversations/{id}` |
| Send message + **streamed** reply | ✅ | `POST /v1/chat/conversations/{id}/messages`, SSE `data: {...}` / `data: [DONE]`; malformed chunks silently skipped |
| Recent conversations in drawer | ✅ | refreshed on drawer open |
| Delete conversation (long-press in drawer) | ✅ | confirm dialog |
| New chat | ✅ | resets composer + bloc |
| Incognito view | 🟨 | UI-only toggle; `Learn more` is a placeholder |
| Image attachment (camera / gallery) | ✅ | `image_picker`, `maxWidth 2048`, `imageQuality 85`; upload `POST .../attachments` (multipart `file`) |
| File attachment | ❌ | `Files` row → placeholder |
| Research toggle | 🟨 | switch state kept in bloc; no observable effect |
| Model selection (`Opus 4.8`, `puku-ai-2.8`, `puku-ai-2.7`) | 🟨 | selection stored in state; `More models` and `Effort` are placeholders |
| Assign conversation to a project | ✅ | project-picker sheet, create-project inline |
| Voice input (mic → transcribe → fill composer) | ✅ | `record` + `POST /v1/transcribe` |
| Markdown + syntax-highlighted code blocks with copy | ✅ | `flutter_markdown_plus`, `highlight` |
| Live voice conversation | ❌ | `LiveVoiceChatScreen` is a static shell; Stop button is a no-op |

---

## F-03 · Chats management

✅ list · ✅ debounced search (300 ms) · ✅ multi-select via long-press ·
✅ bulk delete with confirm · ✅ empty/loading/error states ·
❌ archive (string `Archive` exists in ARB but no UI action).

---

## F-04 · Projects

✅ list · ✅ debounced search · ✅ create · ✅ update · ✅ delete (from list
long-press **and** from details ⋮) · ✅ project details with conversation list ·
✅ remove conversation from project · ✅ new chat scoped to a project.

🟨 Project *knowledge* (`Add knowledge`, add-content sheet) — UI exists;
placeholder copy `{option} flow will be wired later.` indicates it is not wired.
❌ Project filter menu — implemented as `ProjectFilterMenu` but **commented out**
in `projects_screen.dart`.

---

## F-05 · Artifacts

✅ list (`GET /v1/chat/artifacts`) · ✅ debounced search · ✅ navigate to the
owning conversation. Content fetch (`GET /v1/chat/artifacts/{id}/content`) and
creation (`POST /v1/chat/conversations/{id}/artifacts`) exist in the data layer;
no dedicated artifact-viewer screen is registered → ❓ how content is surfaced.

---

## F-06 · Code / Remote sessions

| Sub-feature | Status |
|---|---|
| Discover my sessions (`GET /v1/sessions?mine=1`) | ✅ |
| Auto-refresh on returning to the screen (`RouteAware`) | ✅ |
| Manual refresh | ✅ |
| Pair by QR scan (`mobile_scanner`) | ✅ |
| Pair by tapping an existing available session | ✅ |
| WebSocket attach (`wss://<relay>/client/{sessionId}?token=…`) | ✅ |
| Reconnect token handling | ✅ |
| Send prompt / attachment over the socket | ✅ |
| Approve / deny tool permission requests | ✅ |
| Answer multi-step question wizard | ✅ |
| Exit-plan-mode card (autopilot / manual / feedback) | ✅ |
| Change model at runtime (`set_model` control request) | ✅ |
| Change permission mode (`set_permission_mode`) | ✅ |
| Auto disconnect on background / reconnect on resume | ✅ |
| Create a *new* session from the app | ❓ — composer UI exists (`NewCodeSessionView`) but no creation API call is visible |

---

## F-07 · Settings & Profile

✅ Profile screen (`GET /v1/me`) · ✅ Logout · 🟨 Haptic feedback (local, not
persisted) · ❌ Billing, Usage, Capabilities, Permissions, Voice, Notifications,
Shared links, Account switcher, Info action.

Theme: `ThemeCubit` + `ThemeRepository` persist a theme mode, but
`lib/app/app.dart` supplies `theme.blackTheme()` for **both** light and dark, so
switching produces no visible change (matches `README.md`: "one production theme
only: the black theme").

---

## F-08 · Cross-cutting

| Capability | Status |
|---|---|
| Localization | ✅ generated, but **English only** |
| Crash/perf monitoring (Sentry, incl. screenshots, view hierarchy, session replay) | ✅ when `SENTRY_DSN` is defined at build time |
| Structured logging (`talker`, `talker_dio_logger`) | ✅ debug builds |
| Offline / no-network handling | ❌ no dedicated offline UI; failures surface as generic `ErrorContent` / SnackBars |
| Pull-to-refresh | ❌ none of the lists implement it |
| Pagination / infinite scroll | ❌ all lists load a single full page |
| Deep links into features | ❌ only the OAuth callback (`puku://callback/*`, `https://api.app.dev.puku.sh/callback`) |
| Push notifications | ❌ no plugin, no permission |
| Biometric / device auth | ❌ |

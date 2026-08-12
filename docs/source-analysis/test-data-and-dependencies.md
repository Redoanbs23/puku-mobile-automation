# Test Data, API & Backend Dependencies

> No credentials, tokens or secrets are reproduced in this repository or in this
> document. Environment values live in `assets/env/*.json`, which are gitignored
> and **absent** from the checkout.

---

## 1. Configuration surface

`AppConfig` (`lib/config/app_config.dart`) is built from a bundled JSON asset by
`AppEnv.loadFor(BuildType)` (`lib/config/app_env.dart`). Required keys — all
must be present and non-empty or the app throws `StateError` at startup:

| Key | Used for |
|---|---|
| `API_BASE_URL` | main Dio base URL: chat, projects, artifacts, transcribe, `/v1/me`, `/auth/*`, `/health` |
| `AUTH_BASE_URL` | OAuth authorize + token endpoints |
| `AUTH_CLIENT_ID` | OAuth `client_id` |
| `AUTH_REDIRECT_URI` | OAuth `redirect_uri`; its **scheme** is the `callbackUrlScheme` for `flutter_web_auth_2` |
| `REMOTE_SESSION_RELAY_HOST` | host (authority only) for `https://…/v1/sessions` and `wss://…/client/{sessionId}` |

Asset mapping: `debug`/`staging` → `.env.dev.json`, `qa` → `.env.qa.json`,
`release` → `.env.prod.json`.

Compile-time defines (`--dart-define`): `SENTRY_DSN`, `SENTRY_ENVIRONMENT`.

Hosts referenced literally in the repo (Sentry trace-propagation allowlist and
the Android App Link filter): `api.app.dev.puku.sh`, `web.dev.puku.sh`,
`localhost`.

---

## 2. HTTP endpoints observed in the client

### Auth — base `AUTH_BASE_URL` (`lib/data/network/service/auth/auth_service.dart`)

| Method | Path | Body (form-urlencoded) |
|---|---|---|
| GET (browser) | `/api/oauth/authorize` | `response_type=code`, `client_id`, `redirect_uri`, `scope=openid profile email`, `code_challenge`, `code_challenge_method=S256`, `state` |
| POST | `/api/oauth/token` | `grant_type`, `code`, `redirect_uri`, `client_id`, `code_verifier` |
| POST | `/api/oauth/token` | `grant_type`, `refresh_token`, `client_id` (refresh) |

### Session/account — base `API_BASE_URL`

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | `ChatAuthService` |
| GET | `/auth/verify` | `Authorization` header passed explicitly |
| POST | `/auth/logout` | `Authorization` header; best-effort, failure ignored |
| GET | `/v1/me` | profile (`ProfileService`) |

### Chat — base `API_BASE_URL` (`chat_network_data_source.dart`)

| Method | Path | Response shape |
|---|---|---|
| GET | `/v1/chat/conversations` | `{ conversations: [...] }` |
| GET | `/v1/chat/conversations/{id}` | conversation detail object |
| POST | `/v1/chat/conversations` | `{ conversation: {...} }` |
| PATCH | `/v1/chat/conversations/{id}` | `{ conversation: {...} }` |
| DELETE | `/v1/chat/conversations/{id}` | — |
| POST | `/v1/chat/conversations/{id}/attachments` | multipart field `file`; `{ attachment: {...} }` |
| POST | `/v1/chat/conversations/{id}/messages` | **SSE stream**, `data: {json}` lines, terminator `data: [DONE]`; reads `choices[0].delta.content` and `choices[0].finish_reason` |

### Projects — `projects_network_data_source.dart`

`GET /v1/chat/projects` → `{ projects: [...] }` · `POST /v1/chat/projects` →
`{ project: {...} }` · `PATCH /v1/chat/projects/{id}` · `DELETE /v1/chat/projects/{id}`

### Artifacts — `artifact_network_data_source.dart`

`GET /v1/chat/artifacts?conversationId=…` → `{ artifacts: [...] }` ·
`GET /v1/chat/artifacts/{id}/content?version=…` ·
`POST /v1/chat/conversations/{id}/artifacts` → `{ artifact: {...} }`

### Transcribe

`POST /v1/transcribe` — multipart: `audio` (file) + optional `language`.

### Remote session discovery — base `https://{REMOTE_SESSION_RELAY_HOST}`

`GET /v1/sessions?mine=1` → `RemoteSessionListDto`.

---

## 3. WebSocket contract (remote sessions)

`lib/data/network/data_source/remote_session_socket_data_source.dart`

- **URL:** `wss://{REMOTE_SESSION_RELAY_HOST}/client/{sessionId}?token={mobileToken}[&reconnectToken={t}]`
- **Headers:** `X-Puku-Mobile-Token`, `X-Puku-Account-Token`
- **Outbound frames:**
  - user message (built by `buildRemoteUserMessageFrame`, optional attachment)
  - `{"type":"control_response","response":{"subtype":"success","request_id":…,"response":{ behavior: allow|deny, … }}}`
  - `{"type":"control_request","request_id":…,"request":{"subtype":"set_model","model":…}}`
  - `{"type":"control_request","request_id":…,"request":{"subtype":"set_permission_mode","mode":…}}`
- **Inbound frame types** (`lib/constants/enums.dart`): `system`, `worker_connected`,
  `worker_disconnected`, `client_replaced`, `session_end`, `control_cancel_request`,
  `control_request`, `control_response`, `user`, `assistant`
- **Subtypes:** `reconnect_token`, `progress`, `agent_progress`, `checkpoint`,
  `init`, `success`, `error`
- **Constraint (from `_bmad-output/REMOTE_SESSION_GUIDE.md`):** only **one**
  client may be attached per session; a second client disconnects the first.
  ⚠️ Parallel test workers must not share a session id.

---

## 4. Authentication requirements for tests

Every `/v1/*` call goes through `AuthTokenInterceptor`, which calls
`RefreshCoordinator.refreshIfNeeded()` and sets `Authorization: Bearer <token>`.
Consequences for automation:

- Any test touching chat/projects/artifacts/profile **requires a valid session**.
- Tokens are stored via `SecureTokenStorage` on top of `shared_preferences`
  (Android: SharedPreferences XML under the app's data dir).
- `TokenManager.refreshThresholdMs = 3_600_000` — a token is refreshed when it is
  within 60 minutes of expiry, so long suites will trigger refresh mid-run.
- If refresh fails with an auth error, the interceptor **navigates to Login**
  from wherever you are. A test that suddenly finds itself on Login has almost
  certainly hit an expired/revoked refresh token.

### Recommended auth strategies (in preference order)

1. **Pre-seed storage.** Write valid tokens into the app's shared-preferences
   before launch (Android: push a prepared XML / use an instrumented setup step)
   so tests start on Chat. Fastest and most stable.
2. **Programmatic token exchange.** Obtain tokens out-of-band from the OAuth
   server (if the test client supports a non-interactive grant) and inject as
   above. Requires backend cooperation.
3. **Full UI OAuth once per session**, then reuse the app state across tests in
   the same run. Slow and browser-dependent.

---

## 5. Test data needed

| Data | Purpose | How to prepare |
|---|---|---|
| ≥ 1 test account with a working Google identity | all authenticated flows | provided by the team; must not require 2FA if the UI flow is ever automated |
| ≥ 3 seeded conversations with known titles | Chats list, search, multi-select delete | `POST /v1/chat/conversations` + a message each |
| ≥ 2 seeded projects with known names | Projects list, search, details | `POST /v1/chat/projects` |
| 1 project containing ≥ 1 conversation | project↔chat round trip, remove-from-project | create both, then assign |
| ≥ 1 artifact | Artifacts list & navigation | produced by a conversation that emits an artifact, or `POST /v1/chat/conversations/{id}/artifacts` |
| An empty account | empty-state assertions (`No conversations yet`, `No projects yet`, `No artifacts yet`) | a second clean account is easier than deleting everything |
| A small JPEG/PNG on the device gallery | attachment flow | push via `adb push` + media scan |
| A short `.m4a` | transcribe (if ever automated) | repo already ships `assets/audio/word_9.m4a` |
| A live `puku-cli` `/remote-control` session + its QR/pairing values | remote session flows | CI-managed side process |

**Uniqueness rule:** because list rows carry no `Key`, always create records with
a unique, greppable name (`qa-<suite>-<epoch>`), and clean them up in teardown.

---

## 6. External services

| Service | Role | Test impact |
|---|---|---|
| Google OAuth (via `AUTH_BASE_URL`) | identity | blocks UI-automated login |
| Puku API (`API_BASE_URL`) | all app data | full functional dependency |
| Remote-session relay (`REMOTE_SESSION_RELAY_HOST`) | WebSocket + session discovery | remote flows only |
| LLM provider behind `/v1/chat/.../messages` | reply content | non-deterministic latency & text |
| Sentry | crash/perf/replay | only if `SENTRY_DSN` is compiled in; prefer omitting for test builds |
| Google Fonts | typography | `google_fonts` may fetch at runtime unless fonts are bundled — a network-restricted device can alter layout |

---

## 7. Network behaviour to plan for

- **No retry policy** is configured on Dio; a single transient failure surfaces
  as an error state.
- **No timeouts** are set explicitly on the shared Dio instance (defaults apply).
- Errors are stringified (`ApiResult.error(e.toString())`) → user-facing text is
  generic; you cannot assert specific HTTP codes from the UI.
- SSE parsing silently swallows malformed chunks — a partially broken stream
  looks like a short reply, not an error.
- No offline mode: with the network off, lists show `ErrorContent` + `Try Again`.

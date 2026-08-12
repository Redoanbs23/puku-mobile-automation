# Application Overview — Puku (Flutter Mobile)

> **Scope of this document set:** black-box mobile test automation analysis.
> No application or automation code was modified. All statements below are
> derived from files in this repository; anything not verifiable is explicitly
> marked **UNVERIFIED**.

---

## 1. Identity

| Property | Value | Evidence |
|---|---|---|
| Flutter package name | `puku_app` | `pubspec.yaml` |
| Display name | `Puku` | `android/app/src/main/AndroidManifest.xml` (`android:label`), `intl_en.arb: appTitle` |
| Version | `1.0.3+8` | `pubspec.yaml` |
| Android applicationId | `sh.puku.app` (+ `.dev` / `.qa` suffixes) | `android/app/build.gradle.kts` |
| Dart SDK / Flutter | `>=3.8.0 <4.0.0` / `>=3.19.2` | `pubspec.yaml` |
| Supported locales | English only (`en`) | `lib/app/localization.dart` |
| Theme | Single black theme for both `theme` and `darkTheme` | `lib/app/app.dart`, `README.md` |
| Orientation | Locked to `portraitUp` | `lib/app_runner.dart` |

## 2. Purpose

Puku is a mobile client for an AI coding assistant. It provides:

1. A **conversational chat** surface against a hosted AI API (streaming SSE).
2. **Project** containers that group conversations and carry custom instructions.
3. **Artifacts** — code/document outputs produced inside conversations.
4. **Code / Remote Session** — pairs the phone with a running `puku-cli`
   `/remote-control` session over a WebSocket relay, so the phone becomes a
   remote input/output surface for a CLI agent (approve tool calls, answer
   questions, switch model/permission mode).
5. **Settings / Profile** — account info and app preferences.

Supporting evidence: `_bmad-output/REMOTE_SESSION_GUIDE.md`,
`lib/features/*`, `lib/data/network/data_source/*`.

## 3. Architecture (relevant to automation)

- **State management:** BLoC / Cubit (`flutter_bloc`), `freezed` unions for
  many states. Screens are `BlocBuilder`/`BlocConsumer` driven → UI updates are
  asynchronous relative to taps.
- **DI:** `get_it` + `injectable` (`lib/di/`). Repositories are provided
  app-wide via `MultiRepositoryProvider` in `lib/app/app.dart`.
- **Networking:** `dio` (+ `retrofit` for `AuthService`, `ProfileService`,
  `ChatAuthService`, `RemoteSessionDiscoveryService`). Auth header is injected
  by `AuthTokenInterceptor` which can silently refresh tokens or force-navigate
  to Login.
- **Realtime:** `web_socket_channel` (`IOWebSocketChannel`) for remote sessions.
- **Navigation:** imperative named routes via a single
  `NavigationService` + global `appNavigatorKey`. No deep-link routing table
  inside the app for feature screens (only the OAuth callback deep link).
- **Observability:** Sentry (`sentry_flutter`, `sentry_dio`) — enabled only if
  `SENTRY_DSN` is passed via `--dart-define` at build time.

## 4. Build flavors & entry points

| Flavor | Entry point | `BuildType` | Env asset |
|---|---|---|---|
| dev | `lib/main_dev.dart` | `BuildType.staging` | `assets/env/.env.dev.json` |
| qa | `lib/main_qa.dart` | (see file) | `assets/env/.env.qa.json` |
| prod | `lib/main_prod.dart` | `BuildType.release` | `assets/env/.env.prod.json` |
| default | `lib/main.dart` | — | — |

Evidence: `lib/config/app_env.dart`, `lib/main_dev.dart`, `README.md`, `Makefile`.

> **BLOCKER:** `assets/env/*.json` are **not present in the repository**
> (gitignored). `AppEnv.loadFor()` throws `StateError` if the asset is missing
> or any key is absent. A build cannot start without these files. Required
> keys: `API_BASE_URL`, `AUTH_BASE_URL`, `AUTH_CLIENT_ID`, `AUTH_REDIRECT_URI`,
> `REMOTE_SESSION_RELAY_HOST`.

## 5. User roles

No role/permission model is visible in the client. There is exactly one
authenticated end-user role. `lib/features/settings/settings_screen.dart`
renders a static "Power" account badge (`settingsAccountBadgePower`) that is
hard-coded, not derived from the profile response — it is **not** a role.

Within a *remote session* there is a second actor (the `puku-cli` "worker"),
but that is a peer process, not an app user.

## 6. Navigation structure

Routes are registered in `lib/routes/router.dart` / `navigation_service.dart`:

```
login ──(Continue with Google)──> googleSignIn (fullscreen dialog, external browser tab)
  │                                    │ on token exchange success
  └────────────────────────────────────┴──> chat  (root, replaces stack)

chat (drawer host)
 ├─ drawer → chats           → chat(conversationId)
 ├─ drawer → projects        → projectDetails → chat(projectId | conversationId)
 ├─ drawer → artifacts       → chat(conversationId)
 ├─ drawer → code            → remoteSessionScanner → remoteChat
 └─ drawer avatar → settings → profile
composer → liveVoiceChat

transcribe   (route registered, NOT reachable from any UI — dev/debug screen)
```

Unknown route names fall back to `SplashView` (a bare
`CircularProgressIndicator`) — see `NavigationService.onGenerateRoute`.

**Startup behaviour** (`lib/app/app.dart`): `InitBloc` emits `OpenApp`; the app
reads stored tokens via `TokenManager.getTokens()`. Tokens present →
`goChatRoot()`. Otherwise → `goLoginRoot()`. Both use
`pushNamedAndRemoveUntil(..., (route) => false)`, so there is no back stack
after launch.

## 7. Major user journeys

1. **First launch → Google OAuth (PKCE) → Chat**
2. **Send a chat message → streamed assistant reply**
3. **Browse / search / delete conversations (Chats)**
4. **Create, update, delete a Project; open a project chat**
5. **Browse / search Artifacts; open the owning conversation**
6. **Code: list remote sessions → scan QR → remote chat → approve tool calls**
7. **Settings → Profile; Settings → Log out**

Detailed step-by-step versions are in `user-flows.md`.

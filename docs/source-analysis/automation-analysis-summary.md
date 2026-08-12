# Automation Analysis — Executive Summary

**App:** Puku (Flutter, `puku_app` v1.0.3+8, Android `sh.puku.app`)
**Analysis type:** static, evidence-based, read-only. No app or automation code
was written or modified.

---

## What was analysed

| Dimension | Count |
|---|---|
| Registered routes | 14 (13 user-reachable; `transcribe` is orphaned) |
| Distinct screens / view states documented | 18 |
| Recurring modal surfaces (sheets & dialogs) | 7 |
| Feature areas | 8 (Auth, Chat, Chats, Projects, Artifacts, Code/Remote sessions, Settings/Profile, cross-cutting) |
| Declared widget `Key`s available as locators | ~60 |
| HTTP operations observed in the client | 23 (across 18 distinct paths) |
| WebSocket frame types / subtypes | 10 / 7 |
| Existing Dart unit & widget tests | 48 |
| Existing integration tests | 5 — **all stale template tests, none valid** |

---

## Best automation candidates

1. **Project CRUD** — deterministic, self-cleaning, real backend round trip.
2. **Chat composer mechanics + send** — the most densely keyed surface in the app.
3. **Logout & session persistence** — one tap, unambiguous, security-relevant.
4. **Drawer navigation smoke** — five screens for the price of one test.
5. **List search / empty / error states** — shared `SearchField` and shared
   `ErrorContent` mean one pattern covers three screens.
6. **Remote session via an existing session row** — heavily keyed, but needs a
   live CLI peer.

---

## Priority recommendation

- **P0:** launch→home, launch→login, chat send, **Project CRUD**, logout,
  drawer navigation smoke.
- **P1:** chats search/multi-select/delete, project↔chat round trip, artifacts,
  profile, empty & error matrices, composer rules, incognito toggle.
- **P2:** remote sessions, QR pairing, attachments, full browser OAuth,
  voice input, token refresh, lifecycle edge cases.

**First target: Project CRUD.**

---

## Major blockers

| Severity | Blocker |
|---|---|
| 🔴 Critical | `assets/env/*.json` are gitignored and absent — **the app cannot be built at all** without them (5 required keys). |
| 🔴 Critical | No test accounts, no QA backend, no API access for seeding/teardown have been identified. |
| 🔴 Critical | Google OAuth leaves the app for an external browser tab; without a token pre-seeding strategy every test pays that cost. |
| 🟠 High | List rows (conversations, projects, artifacts, sessions, drawer items) have **no keys** — they can only be matched by server-supplied text. |
| 🟠 High | Whether Flutter `Key`s are exposed as accessibility ids to Appium is **unverified** and must be checked on a real build before framework commitment. |
| 🟠 High | Remote-session flows need a live `puku-cli` peer and allow only **one client per session** — parallel workers will collide. |
| 🟡 Medium | Existing `integration_test/` files are stale SpaceX-template tests (`Launches`, `Rockets`, `Cores`) and will mislead anyone who runs them; `Makefile`'s `integration_test` target is empty and `make apk` mixes flavour `dev` with `main_prod.dart`. |
| 🟡 Medium | Two back buttons ship `semanticLabel: ''`; composer and search fields have no keys. |
| 🟡 Medium | Large parts of Settings, plus Live Voice Chat, are placeholders — automating them would encode temporary behaviour. |

---

## Required prerequisites (short list)

1. QA `assets/env/.env.qa.json` (or the dev equivalent) — **first thing to request**.
2. A `qa`-flavour APK built **without** `SENTRY_DSN`.
3. Two test accounts (one seeded, one empty) on a non-production backend.
4. Direct API access + tokens for seeding and teardown.
5. An agreed authentication strategy — pre-seeding `shared_preferences` is
   recommended; needs the `SecureTokenStorage` key names from the dev team.
6. Android emulator (API 33+) baseline, plus a physical device for camera/mic.
7. A separate automation repository and framework decision (**Appium**
   recommended; Maestro as a fast smoke layer).
8. For remote-session tests only: a CI-managed `puku-cli` `/remote-control` peer
   and confirmed `wss://` reachability.

---

## Suggested sequencing

| Phase | Duration (indicative) | Output |
|---|---|---|
| 0 — unblock | before any coding | env asset, build, accounts, auth strategy validated by hand |
| 1 — foundation | ~1 week | Appium harness, token seeding, page objects for Chat/Projects/Settings |
| 2 — P0 suite | ~1 week | 6 tests, green on a clean emulator in < 10 min |
| 3 — P1 suite | ~2–3 weeks | ~10 tests, seeded data + teardown, CI job |
| 4 — P2 | ongoing | remote sessions, device-specific surfaces, nightly OAuth check |

---

## Documents in this set

`application-overview.md` · `screen-inventory.md` · `feature-inventory.md` ·
`automation-candidates.md` · `user-flows.md` · `automation-readiness.md` ·
`test-data-and-dependencies.md` · `automation-priority.md` ·
`automation-analysis-summary.md` · **`MOBILE-AUTOMATION-ANALYSIS.md`**
(consolidated hand-off document, in the repository root).

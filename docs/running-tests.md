# Running Tests

Single reference for how to run every test in this project.

## Prerequisites

- **Appium** — started automatically by `@wdio/appium-service` when you run `npm test` (see `config/wdio.android.conf.ts`). You do not need to start it manually; it listens on `127.0.0.1:4723` for the duration of the run and is killed automatically afterward.
- **A device or emulator connected** — `adb devices` should show at least one. If both a physical device and the emulator are connected simultaneously, `DEVICE_UDID` (below) is what disambiguates which one Appium targets; without it, ambiguous multi-device setups will fail with `adb: more than one device/emulator`.
- **`DEVICE_UDID` environment variable** — required only for tests that need a physical, pre-authenticated device (see ADR-006, `docs/adr/ADR-006-oauth-consent-automation.md`). These will not run meaningfully against a fresh emulator or in CI — they `this.skip()` themselves when `DEVICE_UDID` is unset:
  - `AUTH-E2E-015`
  - `AUTH-E2E-016`
  - `CHAT-E2E-001`
  - `CHAT-E2E-002`
  - `CHAT-E2E-003`
  - `SETTINGS-E2E-001` through `SETTINGS-E2E-005`

  Set `DEVICE_UDID` to the phone or emulator you are using (`adb devices`). Chat-core pixel baselines were recorded at 1080×2408; Settings locators are structural and the hamburger fallback scales to the current screen. Everything else (e.g. `LOGIN-E2E-002`) runs against either an emulator or a physical device, whichever `adb` resolves to.

- **`APP_NO_RESET` environment variable** (optional, default unset/`false`) — every test session resets PUKU's app data before the test body runs, which is what guarantees `LOGIN-E2E-002`/`AUTH-E2E-015`/`016` reliably start from the login screen. Set `APP_NO_RESET=true` only if you need an already-logged-in session to survive into the test run instead of being reset out from under it (see `docs/emulator-vs-device-comparison.md`'s 2026-08-07 entry). Do not set this for the standard suite — it will break every test that expects to start logged out.

## The general pattern

```bash
npm test -- --mochaOpts.grep="<SCENARIO-ID>"
```

**Example — a scenario that doesn't need a physical device:**

```bash
npm test -- --mochaOpts.grep="LOGIN-E2E-002"
```

**Example — a scenario that requires the pre-authenticated physical device:**

```bash
DEVICE_UDID=RF8T802226Y npm test -- --mochaOpts.grep="AUTH-E2E-015"
```

The grep pattern matches anywhere in a test's title, so it also accepts a substring or a regex alternation, e.g. `--mochaOpts.grep="CHAT-E2E-001|CHAT-E2E-003"` to run two scenarios in one invocation.

## Priority-based runs

```bash
npm run test:p0   # wdio run wdio.conf.ts --mochaOpts.grep=@p0
npm run test:p1   # wdio run wdio.conf.ts --mochaOpts.grep=@p1
```

These grep on the literal `@p0`/`@p1` tag in each test's title (confirmed in `package.json`). `AUTH-E2E-015` and `AUTH-E2E-016` were found missing this tag entirely — fixed, both now carry `@p0` and are picked up by `npm run test:p0` like every other active scenario.

Physical-device-only scenarios that carry the tag (`AUTH-E2E-015`, `AUTH-E2E-016`, `CHAT-E2E-001`/`002`/`003`) still require `DEVICE_UDID` to actually execute rather than skip when run this way — e.g.:

```bash
DEVICE_UDID=RF8T802226Y npm run test:p0
```

will run every `@p0` test, skipping only the ones among them that still need a device you haven't provided.

## Running the full suite

```bash
npm test
```

Runs every spec. Any test gated on `DEVICE_UDID` will `this.skip()` if it's not set — set it if you want the physical-device-only scenarios included:

```bash
DEVICE_UDID=RF8T802226Y npm test
```

## Currently implemented scenarios

Pulled directly from the spec files — only active (`it(...)`) tests are listed; `it.skip(...)` stubs are scaffolds for scenarios not yet automated.

| Scenario ID | File | Requires `DEVICE_UDID` |
|---|---|---|
| `LOGIN-E2E-002` | `tests/specs/auth/login-screen.spec.ts` | No |
| `AUTH-E2E-015` | `tests/specs/auth/oauth-consent.spec.ts` | Yes |
| `AUTH-E2E-016` | `tests/specs/auth/logout.spec.ts` | Yes |
| `CHAT-E2E-001` | `tests/specs/chat/home-screen.spec.ts` | Yes |
| `CHAT-E2E-002` | `tests/specs/chat/send-message.spec.ts` | Yes |
| `CHAT-E2E-003` | `tests/specs/chat/drawer.spec.ts` | Yes |
| `SETTINGS-E2E-001`–`005` | `tests/specs/settings/settings-profile.spec.ts` | Yes (`APP_NO_RESET=true` recommended) |

Settings details (locators, flow, manual case): [`docs/settings-screen-verification.md`](settings-screen-verification.md).

Everything else across `tests/specs/` is currently an `it.skip()` stub (see `tests/specs/auth/login-screen.spec.ts` and `tests/specs/auth/auth-secondary.spec.ts` for the full list of scaffolded-but-not-yet-automated scenarios).

## A note on R8 — don't run cost-triggering scenarios repeatedly

`CHAT-E2E-002` sends a real message to a live AI backend on every execution — real inference cost, rate-limit/ToS exposure. See **R8** in `_bmad-output/test-artifacts/test-design-epic-chat-core.md` for full context. Concretely:

- Never wire `CHAT-E2E-002` (or any future cost-triggering scenario) into a burn-in loop, a retry mechanism, or a high-frequency schedule.
- If it fails, don't re-run it to debug — investigate from the failure output first (logcat/screenshot/video are captured automatically on failure, see `src/hooks/failure-capture.ts`). Every execution has a real cost and a small but non-zero chance of tripping rate-limiting on the shared test account, which would block both the `auth-login` and `chat-core` epics at once.
- This applies to any future P1/P3 scenario in the same coverage plan that also sends a message (`CHAT-E2E-008`, `CHAT-E2E-016` once implemented) — same gate, same reasoning.

# puku-mobile-automation

Black-box mobile test automation framework for **PUKU Editor** (`sh.puku.app`) — an AI code editor Android app built with Flutter. TypeScript + WebdriverIO + Appium/UiAutomator2, testing against a real emulator/device with no source access to the app under test.

This is also a public portfolio project demonstrating AI-assisted QA engineering across the full STLC.

## Why this stack

- **WebdriverIO + Appium/UiAutomator2** for mobile UI automation — chosen over BMad's TF workflow, which only supports Playwright/Cypress or backend unit-test frameworks and has no mobile branch (see `docs/adr/ADR-004-tf-workflow-gap.md`).
- **Playwright** is reserved for API-layer test data only, not used here — no backend endpoints have been identified yet.
- Locators target Android's `content-desc` (accessibility id) attribute — PUKU's Flutter semantics tree exposes high-coverage `content-desc` values on interactive elements, confirmed via Appium Inspector.

## Prerequisites

- Node.js 24.x (see `ai-log/daily-progress.md` for the exact toolchain used)
- JDK 17 (Temurin)
- Android SDK + an emulator or physical device (`Pixel_7`, API 34, Google Play used in development)
- Appium server 2.x with the `uiautomator2` driver installed
- `adb` on PATH

## Setup

```bash
npm install
cp .env.example .env   # only needed if overriding defaults (device name, APK path, etc.)
```

## Running tests

```bash
npm test           # full suite
npm run test:p0    # P0 only
npm run test:p1    # P1 only
```

## Reports

- **JUnit** (`test-results/junit/`) — machine-readable, CI-friendly
- **Allure** (`allure-results/` → `npm run report:allure:generate`, then `npm run report:allure:open`) — visual HTML report, useful for portfolio presentation

On any test failure, a screenshot, `adb logcat` dump, and screen recording are captured automatically under `test-results/failures/{test-name}/` (see `src/hooks/failure-capture.ts`) — there's no source access or server-side observability to fall back on otherwise.

## Project structure

```
config/           WebdriverIO configuration (shared, Android/Appium-specific, environment overrides)
src/screens/      Screen Object Model
src/flows/        Composed user flows over screen objects
src/hooks/        Test lifecycle hooks (failure capture)
src/utils/        adb helpers, logger, env accessor
tests/specs/      Automated test specs
test-cases/       Manual test cases, traced 1:1 to automated scenario IDs
```

## Documentation

- Test design & risk register: `_bmad-output/test-artifacts/test-design-epic-auth-login.md`
- APK reconnaissance: `docs/00-apk-reconnaissance.md`
- Architecture decisions: `docs/adr/`
- Session log: `ai-log/daily-progress.md`

## Status

Login-screen scope only. Further screens are blocked on a dev-team fix for the broken email sign-in flow (tracked as risk R1 in the test design) — `LOGIN-E2E-008` / `LOGIN-TC-008` is the regression guard that signals when that unblocks. Automated specs are currently stubs (`it.skip`); implementation is next, via the ATDD/automate workflow.

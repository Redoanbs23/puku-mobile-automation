# ADR-004: Scaffold the Mobile Test Framework Directly, Bypassing BMad TF

**Status:** Accepted
**Date:** 2026-08-04

## Context

BMad's Test Architect module (Murat) offers a `bmad-testarch-framework` workflow (menu code **TF**) to scaffold a production-ready test framework. Its framework-selection logic (`step-02-select-framework.md`) only covers two branches:

- **Frontend/fullstack (browser-based):** Playwright or Cypress
- **Backend:** a unit-test framework matching the detected language (pytest, JUnit 5, Go test, xUnit, RSpec, cargo test)

There is no Appium, WebdriverIO, or mobile branch anywhere in this workflow. Its preflight step (`step-01-preflight.md`) also hard-requires a `package.json` to already exist before proceeding down the frontend path — which this greenfield repo doesn't have yet — so running TF as-is would either halt immediately on a missing prerequisite, or (if forced) scaffold the wrong tool: a browser-automation framework for an app that isn't a website.

Our actual target stack, established during the completed Test Design workflow (`_bmad-output/test-artifacts/test-design-epic-auth-login.md`), is:

- **TypeScript + WebdriverIO + Appium/UiAutomator2** for mobile UI automation (the login screen and auth entry points of the PUKU Editor Android app)
- **Playwright scoped to API-layer test data only** — not used for UI automation, since PUKU is a native Flutter Android app, not a website

## Decision

Scaffold the WebdriverIO + Appium + TypeScript framework **directly**, without routing through BMad's TF workflow. The scaffold will still be fully informed by everything the completed test design already established:

- **Locator strategy:** `content-desc`-based locators (Appium/UiAutomator2), since the login screen's semantics tree exposes high-coverage `content-desc` values on all interactive elements (confirmed via Appium Inspector)
- **Failure-capture requirements (R6 mitigation):** every test failure captures `adb logcat`, a screenshot, and video, since there's no source access or server-side observability to fall back on
- **Secrets handling (R3 mitigation):** no credentials committed to the repo — disposable test accounts only, secrets via environment variables or a CI secrets store, `.gitignore`'d credential/session files — required before this becomes a public portfolio repo

BMad's TF workflow remains available and appropriate for a future, narrower use: scaffolding the Playwright API-layer test-data harness, if and when backend API endpoints are identified (none are known yet).

## Consequences

- The mobile framework scaffold won't carry BMad TF's usual progress-tracking artifact (`framework-setup-progress.md`) or its own validation checklist — this ADR and the resulting file structure serve as the equivalent record instead.
- Framework setup decisions (folder structure, dependencies, config) are made directly with the user rather than through TF's guided step sequence.
- If BMad's TF workflow gains mobile/Appium support in a future version, this decision should be revisited — the manually-scaffolded framework may need reconciling with whatever conventions a native TF mobile branch would produce.
- Downstream BMad workflows that assume TF ran (e.g. `bmad-testarch-atdd`, `bmad-testarch-automate`) will need to work against this manually-scaffolded framework instead of a TF-generated one; nothing in those workflows appears to hard-require TF's specific output format, but this hasn't been verified yet and should be checked when those workflows are actually run.

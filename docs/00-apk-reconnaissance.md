# APK Reconnaissance Report

**Date:** 2026-08-04
**Scope:** Initial black-box reconnaissance of the PUKU Editor Android app, ahead of building automated test coverage.

This document is a plain-language "how we got here" record — separate from the formal test-design artifact produced by the BMad Test Architect agent (`_bmad-output/test-artifacts/test-design-epic-auth-login.md`). It exists for portfolio readers who want to understand what was found and how, without wading into risk-scoring tables.

---

## App Info

| Field | Value |
|---|---|
| Product name | Puku Editor |
| Package name | `sh.puku.app` |
| Platform | Android only (no iOS access) |
| APK source | AppTester |
| APK file | `app-prod-release.apk` (~93MB) |
| Install method | Sideloaded via `adb` onto a local emulator |
| Install result | Successful — no ABI or signature issues |

**Test device:** Android emulator `Pixel_7`, API 34, Google Play image, arm64.

---

## Tech Stack Findings

PUKU is built with **Flutter**, confirmed via inspection of the running app's UI tree.

This matters for test strategy: Flutter apps render their own custom widget tree rather than native Android platform widgets, so standard Android locator strategies (resource IDs, native widget classes) are often unreliable. The relevant signal instead is the **semantics tree** — the accessibility layer Flutter exposes for screen readers, which Appium/UiAutomator2 can also read via `content-desc` attributes.

An initial Appium Inspector session against the login screen showed **high semantics-tree coverage**: every interactive element observed — the "Continue with Google" button, the "Enter your email" button, and the legal/terms links — exposes a usable `content-desc` value. This means Appium/UiAutomator2 locators (targeting `content-desc`) are viable as the primary locator strategy for this app, at least on the screens explored so far.

---

## Auth Mechanism Findings

The login screen exposes two authentication entry points:

1. **"Continue with Google"** — this opens **external Chrome**, not an in-app WebView. This confirms the app's OAuth implementation relies on external browser context switching (the OS hands off to Chrome, then presumably deep-links back into the app after consent). Practically, this means:
   - Automating this path end-to-end requires a pre-configured, live Google account on the test device/emulator
   - The flow crosses an app boundary into a system browser, which is inherently harder to control and more environment-dependent than an in-app flow

2. **"Enter your email"** — see Known Blockers below; this path does not currently function.

---

## Known Blockers

### Email sign-in flow not connected

Tapping **"Enter your email"** on the login screen shows a toast: **"Email sign in flow is not connected."** The flow does not proceed any further.

- **Status:** Reported to the dev team.
- **Impact:** This blocks all exploration of screens beyond login. Until this is fixed, nothing past the login screen has been observed or can be tested.
- **Next step:** Once the dev team resolves this, re-run manual exploration to map whatever screen(s) become reachable, and re-open test-design scope accordingly.

### Google OAuth is not a practical automation target

While the "Continue with Google" redirect itself can be verified (does tapping the button correctly launch Chrome with a Google consent screen?), completing the OAuth flow end-to-end is not being pursued as an automation target. Reasons:

- Requires a live, pre-configured Google account tied to the test environment
- Crosses out of the app into a system browser and back — inherently more fragile than in-app flows
- Google actively works to detect and resist automated sign-in attempts

This is treated as a permanent manual/exploratory-only testing lane rather than a gap to close later.

---

## What's Testable Today

Given the above, only the **login screen itself** is currently explorable: its rendering, its two auth entry points (as entry points, not completed flows), and app launch/install behavior. Everything past login is gated on the email sign-in fix. A full risk-scored breakdown of this scope lives in the companion test-design document.

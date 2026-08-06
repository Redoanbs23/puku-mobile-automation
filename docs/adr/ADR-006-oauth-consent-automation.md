# ADR-006: Automate Through Google OAuth Consent Tap on Pre-Authenticated Physical Devices

**Status:** Accepted
**Date:** 2026-08-06

## Context

The completed Test Design (`_bmad-output/test-artifacts/test-design-epic-auth-login.md`) assessed Google OAuth completion as risk **R2** (TECH, score 6): "Google OAuth not practically automatable (external Chrome redirect, live account required, environment-dependent, high fragility)." That assessment assumed the full sign-in path — typing a Google email/password and potentially clearing 2FA — inside an external Chrome-hosted flow the automation has no reliable hooks into. R2's mitigation was to treat OAuth completion as a permanent manual/exploratory-only lane: `LOGIN-E2E-007` verifies only that tapping "Continue with Google" redirects to the external Chrome OAuth screen, and automation never proceeds past that redirect. This was, and remains, a correct assessment for the general case.

New finding, observed on Redoan's physical device (`RF8T802226Y`): a Google account is already signed in at the OS level on that device. Tapping "Continue with Google" does not land on the credential-entry screen R2 assumed — it triggers Google's silent OS-level re-auth (no account picker, no prompt) and opens `com.android.chrome` (`CustomTabActivity`). No credentials are typed and no 2FA challenge appears, because there's no fresh authentication happening at all — only a permission grant for an identity that's already signed in.

**Correction from live exploration:** the "Authorize Puku app" consent screen this opens to is **not** Google's native consent UI, as originally assumed. It's a Chrome Custom Tab rendering PUKU's own web page, hosted at `puku.sh` — PUKU's code, not Google's. Google's role ends at the silent re-auth; the consent screen itself, its "Authorize Puku App" / "Cancel" buttons, and its copy ("Signed in as editorpuku@gmail.com. Grant access to Puku App...") all belong to PUKU.

This changes what's automatable, but only conditionally: it's a property of *this device's pre-existing sign-in state*, not something true of OAuth automation in general.

## Decision

Automate through the consent tap — **Continue with Google → Authorize → logged in** — but only on devices with a pre-configured, already-signed-in Google account. R2's original risk and mitigation stand unchanged for every other case.

## Scope

**In scope:**

- Automating the full round trip (tap "Continue with Google" → tap "Authorize" → assert logged-in state) on a device where a Google account is already authenticated at the OS level.

**Explicitly out of scope (R2 still applies):**

- **CI/emulator execution** — CI runners and fresh emulators have no pre-configured Google account, so the flow there still lands on full credential entry, not a one-tap consent screen. This test cannot run in CI.
- **Any flow requiring credential entry or 2FA** — still manual-only, per the original R2 assessment. This ADR does not change that; it only carves out the narrower case where no credentials are needed at all.
- **Any interaction with Google's account picker UI beyond the single authorize tap** — e.g. choosing between multiple signed-in accounts, adding a new account, or any other account-chooser interaction. Only the single-account, single-tap "Authorize" case is in scope.

## Consequences

- This test is **device-dependent, not CI-portable**. It can only run against a device/emulator with a pre-authenticated Google account provisioned ahead of time — something CI cannot guarantee and this ADR does not attempt to solve. The test must be excluded from CI-run suites (e.g. tagged or grep-excluded) until/unless a CI-safe pre-authenticated-account strategy exists.
- When this test is implemented, its own code comments must state the device-dependency plainly (mirroring this ADR), so a future maintainer reading the spec file alone — without this ADR open — still understands why it can't run in CI and what precondition it silently assumes.
- R2 in the test design remains otherwise unchanged: it is not resolved or downgraded, only narrowed for the specific case of a pre-authenticated device. Full OAuth completion via credential entry remains a permanent manual/exploratory-only lane.
- No test code is implemented by this ADR. Implementation (the actual WebdriverIO spec, its skip/grep tagging strategy for CI exclusion, and its precondition check for a pre-authenticated account) is deferred to a follow-up task.
- The consent screen being PUKU's own page (not Google's) is arguably **more** stable than originally assumed — PUKU controls this page's markup, so it isn't exposed to Google unilaterally changing its consent UI out from under the test. The prior fragility concern in R2 was scoped to Google's own screens; this narrower flow isn't subject to that particular risk.
- **New named risk:** this flow depends on `editorpuku@gmail.com` remaining signed in at the OS level on device `RF8T802226Y`, and on that account's standing OAuth grant to PUKU remaining valid. If either is revoked (account signed out, grant revoked, device wiped/re-provisioned), the test breaks — not from PUKU or Google changing anything, but from this specific device/account state lapsing. `editorpuku@gmail.com` is a named test asset and must receive the same credential-hygiene handling as R3 in the original test design: never exposed outside this device and this documentation. It is a real account, not a disposable/synthetic one. `editorpuku@gmail.com` is a dedicated test account, not a personal account, consistent with the disposable-test-account practice R3 already recommends.

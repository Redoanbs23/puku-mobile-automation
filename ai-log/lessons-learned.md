# Lessons Learned

## 2026-08-04 — npm audit findings on initial scaffold install

`npm audit` found 38 vulnerabilities after the initial framework scaffold install, all nested inside `appium-uiautomator2-driver`'s own bundled dependency tree. Plain `npm audit fix` resolved 0 of them — every fix requires `npm audit fix --force`, which bumps `appium` to a breaking major version (3.6.0). Decision: not forcing the fix yet — this framework only talks to localhost (Appium ↔ local/CI emulator, no untrusted network exposure), so a breaking Appium bump this early is riskier than the vulnerabilities themselves. Revisit once P0/P1 tests are passing: re-run `--force` on a branch and verify the suite still passes before merging.

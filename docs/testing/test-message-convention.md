# Test Message Convention (chat-core)

Satisfies the R14 entry criterion in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`: every automated test that sends a chat message to PUKU must use content following this convention. Required before `CHAT-E2E-002`, `CHAT-E2E-008`, or `CHAT-E2E-016` are authored.

## Why this exists

Every message sent by automation lands in a real, shared account's chat history (`editorpuku@gmail.com`) with no known deletion mechanism (R10), and could be captured verbatim in failure-diagnostic artifacts — logcat, screenshots, video (R6) — that get committed to a public portfolio repo (R14). This convention makes test-generated messages identifiable and guarantees their content is safe to appear anywhere, including in public artifacts.

## Naming pattern

Every test-authored message must start with a tag identifying it as automation-generated and which scenario sent it:

```
[PUKU-QA-TEST:<SCENARIO-ID>] <message body>
```

Example: `[PUKU-QA-TEST:CHAT-E2E-002] What is 2 + 2?`

- The `[PUKU-QA-TEST:...]` prefix makes every test message instantly recognizable in the Chats history list, distinguishing it from any real usage of the account.
- The scenario ID inside the tag traces a given message back to the test that sent it, without needing to cross-reference logs.
- If/when a chat-deletion capability is confirmed to exist (R10's open follow-up), this prefix is exactly what a cleanup pass would filter on.

## Content rule

Test message content must never contain:

- Real names, emails, addresses, phone numbers, or any other PII
- Credentials, tokens, API keys, or any other secret
- Any content that isn't safe to appear in a public GitHub repo, in a screenshot, or in a screen recording

Content must be generic, synthetic, and inconsequential — trivia, arithmetic, or simple factual questions. Never ask PUKU to echo back, summarize, or process anything sensitive, since the AI's response could itself land in a failure-capture artifact (R14 covers both directions: what we send and what comes back).

## Example prompts

| Scenario | Prompt | Why this content |
|---|---|---|
| `CHAT-E2E-002` (core send) | `[PUKU-QA-TEST:CHAT-E2E-002] What is 2 + 2?` | Trivial, deterministic-ish, nothing to leak — only used to confirm a response renders and the input clears (R9: never asserted on the response text itself) |
| `CHAT-E2E-008` (network-loss-mid-send) | `[PUKU-QA-TEST:CHAT-E2E-008] Say hello in one word.` | Short by design — the test interrupts the network mid-request, so a short prompt keeps the send/interrupt timing easy to control |
| `CHAT-E2E-016` (latency benchmark) | `[PUKU-QA-TEST:CHAT-E2E-016] Write a one-sentence fun fact about volcanoes.` | Generic knowledge topic, stable prompt shape for comparing latency across runs; content itself is never asserted on, only response time |

## Scope

This convention covers chat *message content* only. It doesn't change R3's existing rule that the account itself (`editorpuku@gmail.com`) is a dedicated test account, never a personal one — R14 extends that same discipline to what gets typed into it.

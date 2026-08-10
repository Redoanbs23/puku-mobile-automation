import { BaseScreen } from './base.screen.js';

/**
 * The chat history list, opened via drawerScreen.chatsMenuItem. Smoke-only
 * per R10 — deliberately does not assert on the list's specific contents,
 * since test-generated messages accumulate indefinitely in the shared
 * account's history with no known deletion mechanism (see
 * test-design-epic-chat-core.md). Confirmed via live exploration against
 * the emulator's logged-in session on 2026-08-07. Uses the shared
 * backButton locator from BaseScreen.
 */
class ChatHistoryScreen extends BaseScreen {}

export const chatHistoryScreen = new ChatHistoryScreen();

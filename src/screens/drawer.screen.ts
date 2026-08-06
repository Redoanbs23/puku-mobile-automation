import { BaseScreen } from './base.screen.js';

/**
 * The navigation drawer, opened via settingsScreen.tapHamburgerMenuTrigger()
 * (the trigger icon itself has no locator — see settings.screen.ts and
 * ai-log/lessons-learned.md). All drawer items below have clean,
 * single-value content-desc, confirmed via a live page-source dump
 * against RF8T802226Y on 2026-08-06.
 */
class DrawerScreen extends BaseScreen {
  get chatsMenuItem(): ChainablePromiseElement {
    return this.byContentDesc('Chats');
  }

  get projectsMenuItem(): ChainablePromiseElement {
    return this.byContentDesc('Projects');
  }

  get artifactsMenuItem(): ChainablePromiseElement {
    return this.byContentDesc('Artifacts');
  }

  get codeMenuItem(): ChainablePromiseElement {
    return this.byContentDesc('Code');
  }

  get newChatButton(): ChainablePromiseElement {
    return this.byContentDesc('New chat');
  }
}

export const drawerScreen = new DrawerScreen();

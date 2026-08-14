import { BaseScreen } from './base.screen.js';

/**
 * Navigation drawer. Open via settingsScreen.tapHamburgerMenuTrigger()
 * (settings-nav.screen.ts). Items use ~ content-desc.
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

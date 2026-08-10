import { BaseScreen } from './base.screen.js';

/**
 * Smoke-only screen objects for Projects, Artifacts, and Code — R13 (no
 * prior exploration existed before 2026-08-07). All locators confirmed via
 * live exploration against the emulator's logged-in session that day.
 * Deliberately shallow: only enough to confirm each section opens without
 * crashing, per the coverage plan's smoke-level scope for these sections.
 *
 * Artifacts and Code both expose the shared BaseScreen.backButton
 * ("Back"). Projects does not — its equivalent control has no
 * content-desc at all (a gap, same class as the hamburger trigger) — so
 * callers there use driver.back() (the Android system back action)
 * instead, confirmed live to return cleanly to the home screen.
 */
class SectionsScreen extends BaseScreen {
  get projectsHeader(): ChainablePromiseElement {
    return this.byContentDesc('Projects');
  }

  get projectsEmptyState(): ChainablePromiseElement {
    return this.byContentDesc('No projects yet');
  }

  get artifactsHeader(): ChainablePromiseElement {
    return this.byContentDesc('Artifacts');
  }

  get artifactsEmptyState(): ChainablePromiseElement {
    return this.byContentDesc('No artifacts yet');
  }

  get codeHeader(): ChainablePromiseElement {
    return this.byContentDesc('Code');
  }

  get codeEmptyState(): ChainablePromiseElement {
    return this.byContentDesc('No sessions found');
  }
}

export const sectionsScreen = new SectionsScreen();

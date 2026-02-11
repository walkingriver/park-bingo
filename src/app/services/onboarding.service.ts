import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class OnboardingService {
  private readonly ONBOARDING_KEY = 'park-bingo-onboarding';
  private readonly LAST_VERSION_KEY = 'park-bingo-last-version';

  // Current app version - update when adding new onboarding content
  private readonly CURRENT_VERSION = '1.0.0';

  readonly hasSeenOnboarding = signal(false);
  readonly showOnboarding = signal(false);

  constructor() {
    this.checkOnboardingStatus();
  }

  private async checkOnboardingStatus() {
    try {
      const { value } = await Preferences.get({ key: this.ONBOARDING_KEY });
      const { value: lastVersion } = await Preferences.get({ key: this.LAST_VERSION_KEY });

      // Show onboarding if never seen or if major version changed
      if (!value) {
        this.hasSeenOnboarding.set(false);
        this.showOnboarding.set(true);
      } else {
        this.hasSeenOnboarding.set(true);
        this.showOnboarding.set(false);

        // Check for major version updates (optional: show "what's new")
        if (lastVersion !== this.CURRENT_VERSION) {
          await Preferences.set({ key: this.LAST_VERSION_KEY, value: this.CURRENT_VERSION });
        }
      }
    } catch (error) {
      console.warn('Error checking onboarding status:', error);
      // Default to showing onboarding if storage fails
      this.showOnboarding.set(true);
    }
  }

  async completeOnboarding() {
    try {
      await Preferences.set({ key: this.ONBOARDING_KEY, value: 'true' });
      await Preferences.set({ key: this.LAST_VERSION_KEY, value: this.CURRENT_VERSION });
      this.hasSeenOnboarding.set(true);
      this.showOnboarding.set(false);
    } catch (error) {
      console.warn('Error saving onboarding status:', error);
    }
  }

  async resetOnboarding() {
    try {
      await Preferences.remove({ key: this.ONBOARDING_KEY });
      await Preferences.remove({ key: this.LAST_VERSION_KEY });
      this.hasSeenOnboarding.set(false);
      this.showOnboarding.set(true);
    } catch (error) {
      console.warn('Error resetting onboarding:', error);
    }
  }

  triggerOnboarding() {
    this.showOnboarding.set(true);
  }
}

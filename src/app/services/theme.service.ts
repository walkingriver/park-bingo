import { Injectable, signal, effect } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_KEY = 'park-bingo-theme';
  readonly isDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();

    // Apply theme changes
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  private async initializeTheme() {
    // Check stored preference first
    const { value } = await Preferences.get({ key: this.THEME_KEY });

    if (value !== null) {
      this.isDarkMode.set(value === 'dark');
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
      this.isDarkMode.set(prefersDark.matches);

      // Listen for system changes
      prefersDark.addEventListener('change', (e) => {
        // Only update if no user preference is stored
        Preferences.get({ key: this.THEME_KEY }).then(({ value }) => {
          if (value === null) {
            this.isDarkMode.set(e.matches);
          }
        });
      });
    }
  }

  async toggleDarkMode() {
    const newValue = !this.isDarkMode();
    this.isDarkMode.set(newValue);

    await Preferences.set({
      key: this.THEME_KEY,
      value: newValue ? 'dark' : 'light',
    });
  }

  async setDarkMode(isDark: boolean) {
    this.isDarkMode.set(isDark);

    await Preferences.set({
      key: this.THEME_KEY,
      value: isDark ? 'dark' : 'light',
    });
  }

  private applyTheme(isDark: boolean) {
    document.documentElement.classList.toggle('ion-palette-dark', isDark);
    document.body.classList.toggle('dark', isDark);

    // Update meta theme-color for browser/PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#1e293b' : '#4f46e5');
    }
  }
}

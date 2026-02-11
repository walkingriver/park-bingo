import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

type SoundEffect = 'tap' | 'complete' | 'bingo' | 'celebration';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private readonly SOUND_ENABLED_KEY = 'park-bingo-sound-enabled';

  readonly isEnabled = signal(true);

  // Audio elements cache
  private audioCache = new Map<SoundEffect, HTMLAudioElement>();

  // Sound file URLs (using Web Audio API frequencies for now - no external files needed)
  private readonly sounds: Record<SoundEffect, () => void> = {
    tap: () => this.playTone(800, 0.05),
    complete: () => this.playTone(1200, 0.1),
    bingo: () => this.playBingoFanfare(),
    celebration: () => this.playCelebration(),
  };

  private audioContext: AudioContext | null = null;

  constructor() {
    this.loadPreference();
  }

  private async loadPreference() {
    try {
      const { value } = await Preferences.get({ key: this.SOUND_ENABLED_KEY });
      // Default to enabled if not set
      this.isEnabled.set(value !== 'false');
    } catch (error) {
      console.warn('Error loading sound preference:', error);
    }
  }

  async toggleSound(): Promise<boolean> {
    const newValue = !this.isEnabled();
    this.isEnabled.set(newValue);

    try {
      await Preferences.set({
        key: this.SOUND_ENABLED_KEY,
        value: String(newValue),
      });
    } catch (error) {
      console.warn('Error saving sound preference:', error);
    }

    // Play a test sound when enabling
    if (newValue) {
      this.play('tap');
    }

    return newValue;
  }

  async setEnabled(enabled: boolean) {
    this.isEnabled.set(enabled);

    try {
      await Preferences.set({
        key: this.SOUND_ENABLED_KEY,
        value: String(enabled),
      });
    } catch (error) {
      console.warn('Error saving sound preference:', error);
    }
  }

  play(effect: SoundEffect) {
    if (!this.isEnabled()) return;

    try {
      this.sounds[effect]();
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playTone(frequency: number, duration: number) {
    try {
      const ctx = this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      // Fade out
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.warn('Error playing tone:', error);
    }
  }

  private playBingoFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const duration = 0.15;

    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, duration), i * 100);
    });
  }

  private playCelebration() {
    // Victory sound - ascending notes
    const notes = [392, 440, 494, 523, 587, 659, 698, 784]; // G4 to G5
    const duration = 0.1;

    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, duration), i * 80);
    });
  }
}

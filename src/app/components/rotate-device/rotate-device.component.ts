import { Component, signal, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Shows a "rotate your device" overlay when:
 * - Device is in landscape orientation
 * - Viewport height is less than 768px (smaller than iPad Mini)
 * 
 * This ensures the bingo card is playable on small devices.
 */
@Component({
  selector: 'app-rotate-device',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (showPrompt()) {
      <div class="rotate-overlay">
        <div class="rotate-content">
          <div class="rotate-icon">📱</div>
          <h2>Please Rotate Your Device</h2>
          <p>This app works best in portrait mode on smaller screens.</p>
          <div class="rotate-arrow">↻</div>
        </div>
      </div>
    }
  `,
  styles: [`
    .rotate-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .rotate-content {
      text-align: center;
      color: white;
      padding: 24px;
    }

    .rotate-icon {
      font-size: 4rem;
      margin-bottom: 16px;
      animation: tilt 1.5s ease-in-out infinite;
    }

    @keyframes tilt {
      0%, 100% { transform: rotate(-15deg); }
      50% { transform: rotate(15deg); }
    }

    h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 12px 0;
    }

    p {
      font-size: 1rem;
      margin: 0 0 24px 0;
      opacity: 0.9;
    }

    .rotate-arrow {
      font-size: 3rem;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class RotateDeviceComponent implements OnInit {
  readonly showPrompt = signal(false);

  // iPad Mini is 768px tall in portrait, so in landscape it would be 768px wide
  // We want to show the prompt when height < 768 AND in landscape
  private readonly MIN_LANDSCAPE_HEIGHT = 768;

  ngOnInit() {
    this.checkOrientation();
  }

  @HostListener('window:resize')
  @HostListener('window:orientationchange')
  onOrientationChange() {
    // Small delay to let the orientation change complete
    setTimeout(() => this.checkOrientation(), 100);
  }

  private checkOrientation() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;
    const isSmallDevice = height < this.MIN_LANDSCAPE_HEIGHT;

    this.showPrompt.set(isLandscape && isSmallDevice);
  }
}

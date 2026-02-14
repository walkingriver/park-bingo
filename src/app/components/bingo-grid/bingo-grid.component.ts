import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BingoSquare } from '../../models/park.model';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-bingo-grid',
  standalone: true,
  imports: [NgOptimizedImage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bingo-grid.component.html',
  styleUrls: ['./bingo-grid.component.scss'],
})
export class BingoGridComponent {
  /** The 5x5 grid of squares */
  squares = input.required<BingoSquare[][]>();

  /** Emitted when a square is clicked */
  squareClick = output<{ row: number; col: number }>();

  /** Emitted when a square is long-pressed */
  squarePress = output<BingoSquare>();

  // Long-press detection
  private readonly LONG_PRESS_DURATION = 500; // ms
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private isLongPress = false;
  private startX = 0;
  private startY = 0;
  private readonly MOVE_THRESHOLD = 10; // pixels

  onPointerDown(event: PointerEvent, square: BingoSquare) {
    this.isLongPress = false;
    this.startX = event.clientX;
    this.startY = event.clientY;

    this.pressTimer = setTimeout(async () => {
      this.isLongPress = true;
      // Haptic feedback for long press
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }
      this.squarePress.emit(square);
    }, this.LONG_PRESS_DURATION);
  }

  onPointerUp() {
    this.cancelLongPress();
  }

  onPointerMove(event: PointerEvent) {
    // Cancel if moved too far
    const dx = Math.abs(event.clientX - this.startX);
    const dy = Math.abs(event.clientY - this.startY);
    if (dx > this.MOVE_THRESHOLD || dy > this.MOVE_THRESHOLD) {
      this.cancelLongPress();
    }
  }

  onPointerCancel() {
    this.cancelLongPress();
  }

  private cancelLongPress() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  onSquareClick(row: number, col: number) {
    // Don't trigger click if this was a long press
    if (this.isLongPress) {
      this.isLongPress = false;
      return;
    }
    this.squareClick.emit({ row, col });
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      ride: '🎢',
      show: '🎭',
      character: '👤',
      exhibit: '🦁',
      experience: '✨',
      food: '🍽️',
      transportation: '🚂',
      detail: '📍',
    };
    return icons[type] || '📍';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

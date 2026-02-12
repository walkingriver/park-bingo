import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { BingoSquare } from '../../models/park.model';

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

  onSquareClick(row: number, col: number) {
    this.squareClick.emit({ row, col });
  }

  onSquarePress(square: BingoSquare) {
    this.squarePress.emit(square);
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

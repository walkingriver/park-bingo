import { Component, computed, inject } from '@angular/core';
import { BingoService } from '../../services/bingo.service';
import { BingoSquare } from '../../models/park.model';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-bingo-card',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="bingo-card">
      <h1 class="park-title">{{ parkName() }}</h1>

      <div class="grid">
        @for (row of card()?.squares; track $index; let rowIndex = $index) {
        <div class="row">
          @for (square of row; track square.id; let colIndex = $index) {
          <div
            class="square"
            [class.completed]="square.status === 'completed'"
            [class.skipped]="square.status === 'skipped'"
            [class.in-progress]="square.status === 'in-progress'"
            (click)="toggleSquareStatus(rowIndex, colIndex)"
          >
            <div class="square-content">
              @if (square.parkItem.imageUrl && !imageError(square.id)) {
              <div class="image-container">
                <img
                  [src]="square.parkItem.imageUrl"
                  [alt]="square.parkItem.name"
                  class="square-image"
                  [class.loaded]="imageLoaded(square.id)"
                  loading="lazy"
                  (load)="onImageLoad(square.id)"
                  (error)="onImageError(square.id, $event)"
                />
                <div class="image-overlay"></div>
                @if (!imageLoaded(square.id)) {
                <div class="image-skeleton"></div>
                }
              </div>
              } @else {
              <div class="placeholder-image" [attr.data-type]="square.parkItem.type">
                @switch (square.parkItem.type) {
                @case ('ride') {
                <span class="type-icon">🎢</span>
                }
                @case ('show') {
                <span class="type-icon">🎭</span>
                }
                @case ('character') {
                <span class="type-icon">👤</span>
                }
                @case ('food') {
                <span class="type-icon">🍽️</span>
                }
                @case ('transportation') {
                <span class="type-icon">🚂</span>
                }
                @default {
                <span class="type-icon">📍</span>
                }
                }
              </div>
              }
              <div class="square-text">{{ square.parkItem.name || 'Unknown' }}</div>
              @if (square.status === 'completed') {
              <div class="status-icon completed-icon">✓</div>
              } @else if (square.status === 'skipped') {
              <div class="status-icon skipped-icon">✕</div>
              } @else if (square.status === 'in-progress') {
              <div class="status-icon in-progress-icon">⏳</div>
              }
            </div>
          </div>
          }
        </div>
        }
      </div>

      <div class="stats">
        <p>BINGOs: {{ card()?.bingos || 0 }}</p>
        <p>Started: {{ card()?.createdAt | date : 'short' }}</p>
      </div>
    </div>
  `,
  styles: [
    `
      .bingo-card {
        max-width: 800px;
        margin: 0 auto;
        padding: 0.25rem;
      }

      .park-title {
        text-align: center;
        margin-bottom: 0.75rem;
        color: var(--ion-text-color, #333);
      }

      .grid {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .row {
        display: flex;
        gap: 0;
        height: 140px;
      }

      .square {
        flex: 1;
        border: 1px solid var(--ion-border-color, #ddd);
        border-radius: 4px;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        background: var(--ion-card-background, white);
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;

        &:hover {
          transform: scale(1.03);
          z-index: 1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.completed {
          background-color: rgba(var(--ion-color-success-rgb, 76, 175, 80), 0.15);
          border-color: var(--ion-color-success, #4caf50);
        }

        &.skipped {
          background-color: rgba(var(--ion-color-danger-rgb, 244, 67, 54), 0.15);
          border-color: var(--ion-color-danger, #f44336);
          opacity: 0.7;
        }

        &.in-progress {
          background-color: rgba(var(--ion-color-warning-rgb, 255, 152, 0), 0.15);
          border-color: var(--ion-color-warning, #ff9800);
        }
      }

      .square-content {
        padding: 0.25rem;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 0.25rem;
        position: relative;
      }

      .square-text {
        font-size: 0.65rem;
        line-height: 1.1;
        text-align: center;
        font-weight: 600;
        color: var(--ion-text-color, #333);
        position: relative;
        z-index: 2;
      }

      .image-container {
        position: relative;
        width: 100%;
        height: 70px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--ion-color-light, #f5f5f5);
      }

      .square-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;

        &.loaded {
          opacity: 1;
        }

        &.error {
          display: none;
        }
      }

      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.1) 50%,
          rgba(0, 0, 0, 0.3) 100%
        );
        pointer-events: none;
        z-index: 1;
      }

      .image-skeleton {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(
          90deg,
          #f0f0f0 25%,
          #e0e0e0 50%,
          #f0f0f0 75%
        );
        background-size: 200% 100%;
        animation: loading 1.5s ease-in-out infinite;
      }

      @keyframes loading {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      .placeholder-image {
        display: flex;
        width: 100%;
        height: 70px;
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        position: relative;

        &[data-type='ride'] {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
        }

        &[data-type='show'] {
          background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
        }

        &[data-type='character'] {
          background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
        }

        &[data-type='food'] {
          background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
        }

        &[data-type='transportation'] {
          background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
        }

        .type-icon {
          font-size: 2rem;
          opacity: 0.7;
        }
      }

      .status-icon {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 1.2rem;
        font-weight: bold;
        z-index: 3;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;

        &.completed-icon {
          color: #4caf50;
        }

        &.skipped-icon {
          color: #f44336;
        }

        &.in-progress-icon {
          color: #ff9800;
          animation: pulse 2s ease-in-out infinite;
        }
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }

      .stats {
        margin-top: 0.75rem;
        text-align: center;
        color: var(--ion-color-medium, #666);
        font-size: 0.9rem;
      }

      /* Dark mode adjustments */
      @media (prefers-color-scheme: dark) {
        .square {
          background: var(--ion-color-step-100, #1e1e1e);
          border-color: var(--ion-color-step-150, #2d2d2d);
        }

        .square-text {
          color: var(--ion-text-color, #fff);
        }

        .placeholder-image {
          background: var(--ion-color-step-150, #2d2d2d);

          &[data-type='ride'],
          &[data-type='show'],
          &[data-type='character'],
          &[data-type='food'],
          &[data-type='transportation'] {
            background: var(--ion-color-step-150, #2d2d2d);
          }
        }

        .image-container {
          background: var(--ion-color-step-100, #1e1e1e);
        }

        .status-icon {
          background: rgba(30, 30, 30, 0.95);
        }
      }
    `,
  ],
})
export class BingoCardComponent {
  private bingoService = inject(BingoService);

  readonly card = this.bingoService.currentCard;
  private loadedImages = new Set<string>();
  private errorImages = new Set<string>();

  readonly parkName = computed(() => {
    const parkId = this.card()?.parkId;
    if (!parkId) return '';
    const park = this.bingoService.parks().find((p) => p.id === parkId);
    return park?.name || '';
  });

  toggleSquareStatus(row: number, col: number) {
    const square = this.card()?.squares?.[row]?.[col];
    if (!square) return;

    const statuses: Array<BingoSquare['status']> = [
      'unmarked',
      'completed',
      'skipped',
      'in-progress',
    ];
    const currentIndex = statuses.indexOf(square.status);
    const nextIndex = (currentIndex + 1) % statuses.length;

    this.bingoService.updateSquareStatus(row, col, statuses[nextIndex]);
  }

  imageLoaded(squareId: string): boolean {
    return this.loadedImages.has(squareId);
  }

  imageError(squareId: string): boolean {
    return this.errorImages.has(squareId);
  }

  onImageLoad(squareId: string) {
    this.loadedImages.add(squareId);
  }

  onImageError(squareId: string, event: Event) {
    this.errorImages.add(squareId);
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BingoService } from '../../services/bingo.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-park-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="park-selector">
      @if (bingoService.parks().length === 0) {
      <div class="loading">
        <p>Loading parks...</p>
      </div>
      } @else {
      <div class="park-grid">
        @for (park of bingoService.parks(); track park.id) {
        <button class="park-card" (click)="selectPark(park.id)">
          <span class="park-icon">{{ park.icon }}</span>
          <h2>{{ park.name }}</h2>
        </button>
        }
      </div>
      }
    </div>
  `,
  styles: [
    `
      .park-selector {
        padding: 1rem;
      }

      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50vh;
        font-size: 1.2rem;
        color: #666;
      }

      .park-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }

      .park-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
        border: 2px solid #ccc;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
      }

      .park-icon {
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
    `,
  ],
})
export class ParkSelectorComponent {
  private router = inject(Router);
  bingoService = inject(BingoService);

  selectPark(parkId: string) {
    this.bingoService.generateCard(parkId);
    this.router.navigate(['/play']);
  }
}

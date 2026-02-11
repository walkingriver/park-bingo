import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav>
      <button (click)="goHome()">🏠 Home</button>
      <button (click)="goToPlay()" [disabled]="!hasActiveCard()">🎮 Continue Game</button>
    </nav>
  `,
  styles: [
    `
      nav {
        background: #3f51b5;
        padding: 1rem;
        display: flex;
        gap: 1rem;
        justify-content: center;

        button {
          background: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;

          &:hover:not(:disabled) {
            background: #e8eaf6;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }
      }
    `,
  ],
})
export class NavComponent {
  private router = inject(Router);

  hasActiveCard() {
    // Check if there's an active game in localStorage
    return !!localStorage.getItem('park-bingo-cards');
  }

  goHome() {
    this.router.navigate(['/']);
  }

  goToPlay() {
    this.router.navigate(['/play']);
  }
}

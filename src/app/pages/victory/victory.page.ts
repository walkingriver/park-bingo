import { Component, inject, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonFooter,
} from '@ionic/angular/standalone';
import { BingoService } from '../../services/bingo.service';
import { addIcons } from 'ionicons';
import { trophy, share, home, arrowForward } from 'ionicons/icons';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-victory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonFooter,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="success">
        <ion-title>BINGO!</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="victory-hero">
        <div class="trophy-icon">
          <ion-icon name="trophy" color="warning"></ion-icon>
        </div>
        <h1>Congratulations!</h1>
        <p class="victory-message">
          You got {{ bingoCount() }} BINGO{{ bingoCount() > 1 ? 's' : '' }} at
          {{ parkName() }}!
        </p>
        <p class="completed-stats">
          {{ completedCount() }}/25 squares completed
        </p>
      </div>

      <div class="action-buttons">
        <ion-button expand="block" (click)="shareVictory()">
          <ion-icon name="share" slot="start"></ion-icon>
          Share Your Victory
        </ion-button>
        <ion-button expand="block" fill="outline" routerLink="/play">
          <ion-icon name="arrow-forward" slot="start"></ion-icon>
          Keep Playing
        </ion-button>
      </div>

    </ion-content>

    <ion-footer>
      <ion-toolbar>
        <ion-button expand="block" fill="clear" routerLink="/">
          <ion-icon name="home" slot="start"></ion-icon>
          Back to Parks
        </ion-button>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .victory-hero {
        text-align: center;
        padding: 32px 16px;
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        margin: -16px -16px 24px -16px;
        padding-top: 48px;
      }

      .trophy-icon {
        font-size: 4rem;
        margin-bottom: 16px;

        ion-icon {
          font-size: 4rem;
        }
      }

      .victory-hero h1 {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 8px;
      }

      .victory-message {
        font-size: 1.1rem;
        opacity: 0.95;
      }

      .completed-stats {
        font-size: 0.9rem;
        opacity: 0.8;
        margin-top: 8px;
      }

      .action-buttons {
        padding: 0 16px;
        margin-bottom: 32px;

        ion-button {
          margin-bottom: 12px;
        }
      }

    `,
  ],
})
export class VictoryPage implements OnInit {
  private bingoService = inject(BingoService);

  readonly card = this.bingoService.currentCard;

  readonly parkName = computed(() => {
    const parkId = this.card()?.parkId;
    if (!parkId) return 'Disney Park';
    const park = this.bingoService.parks().find((p) => p.id === parkId);
    return park?.name || 'Disney Park';
  });

  readonly bingoCount = computed(() => this.card()?.bingos || 0);

  readonly completedCount = computed(() => {
    const card = this.card();
    if (!card) return 0;
    return card.squares.flat().filter((s) => s.status === 'completed').length;
  });

  constructor() {
    addIcons({ trophy, share, home, arrowForward });
  }

  ngOnInit() {
    // Celebration confetti
    this.launchConfetti();
  }

  private launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#22c55e', '#f59e0b', '#4f46e5'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#22c55e', '#f59e0b', '#4f46e5'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  async shareVictory() {
    const { Share } = await import('@capacitor/share');
    const card = this.card();

    if (!card) return;

    const parkName = this.parkName();
    const gameCode = card.seed.substring(0, 8).toUpperCase();
    const bingos = card.bingos;
    const completed = this.completedCount();

    const text = `🎯 I got ${bingos} BINGO${bingos > 1 ? 's' : ''} at ${parkName}!

✅ ${completed}/25 squares completed
📋 Game Code: ${gameCode}

Download Park Pursuit Bingo to play your own game! #ParkPursuitBingo #Disney`;

    try {
      await Share.share({
        title: 'My Park Pursuit Bingo Victory!',
        text,
        dialogTitle: 'Share your Park Pursuit Bingo victory',
      });
    } catch (error) {
      console.log('Share cancelled or failed:', error);
    }
  }

}

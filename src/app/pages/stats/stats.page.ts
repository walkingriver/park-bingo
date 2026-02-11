import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonText,
  IonButton,
  AlertController,
} from '@ionic/angular/standalone';
import { BingoService } from '../../services/bingo.service';
import { addIcons } from 'ionicons';
import { trophy, flame, gameController, statsChart, trash, refresh } from 'ionicons/icons';

@Component({
  selector: 'app-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonText,
    IonButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Statistics</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Overview Stats -->
      <div class="stats-grid">
        <ion-card class="stat-card">
          <ion-card-content>
            <ion-icon name="game-controller" color="primary"></ion-icon>
            <div class="stat-value">{{ stats().totalGames }}</div>
            <div class="stat-label">Games Played</div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card">
          <ion-card-content>
            <ion-icon name="trophy" color="warning"></ion-icon>
            <div class="stat-value">{{ stats().totalBingos }}</div>
            <div class="stat-label">Total BINGOs</div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card">
          <ion-card-content>
            <ion-icon name="flame" color="danger"></ion-icon>
            <div class="stat-value">{{ stats().currentStreak }}</div>
            <div class="stat-label">Current Streak</div>
          </ion-card-content>
        </ion-card>

        <ion-card class="stat-card">
          <ion-card-content>
            <ion-icon name="stats-chart" color="success"></ion-icon>
            <div class="stat-value">{{ stats().bestStreak }}</div>
            <div class="stat-label">Best Streak</div>
          </ion-card-content>
        </ion-card>
      </div>

      <!-- Win Rate -->
      @if (stats().totalGames > 0) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>Win Rate</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="win-rate">
              <div class="win-rate-value">{{ winRate() }}%</div>
              <div class="win-rate-bar">
                <div class="win-rate-fill" [style.width.%]="winRate()"></div>
              </div>
              <div class="win-rate-label">
                {{ stats().totalBingos }} BINGOs in {{ stats().totalGames }} games
              </div>
            </div>
          </ion-card-content>
        </ion-card>
      }

      <!-- Parks Breakdown -->
      @if (parkStats().length > 0) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>Parks Breakdown</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              @for (park of parkStats(); track park.id) {
                <ion-item>
                  <div class="park-icon" slot="start">{{ park.icon }}</div>
                  <ion-label>
                    <h3>{{ park.name }}</h3>
                    <p>{{ park.games }} games, {{ park.bingos }} BINGOs</p>
                  </ion-label>
                  <ion-text slot="end" color="success">
                    {{ park.winRate }}%
                  </ion-text>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>
      }

      <!-- Game History -->
      @if (recentGames().length > 0) {
        <ion-card>
          <ion-card-header>
            <ion-card-title>Recent Games</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              @for (game of recentGames(); track game.id) {
                <ion-item>
                  <ion-label>
                    <h3>{{ game.parkName }}</h3>
                    <p>{{ game.date }}</p>
                  </ion-label>
                  <ion-text slot="end" [color]="game.bingos > 0 ? 'success' : 'medium'">
                    @if (game.bingos > 0) {
                      {{ game.bingos }} BINGO{{ game.bingos > 1 ? 's' : '' }}
                    } @else {
                      In Progress
                    }
                  </ion-text>
                </ion-item>
              }
            </ion-list>
          </ion-card-content>
        </ion-card>
      }

      <!-- Empty State -->
      @if (stats().totalGames === 0) {
        <div class="empty-state">
          <ion-icon name="game-controller" color="medium"></ion-icon>
          <h2>No Games Yet</h2>
          <p>Play some BINGO to see your statistics!</p>
          <ion-button routerLink="/" fill="solid">
            Start Playing
          </ion-button>
        </div>
      }

      <!-- Clear Stats -->
      @if (stats().totalGames > 0) {
        <div class="actions">
          <ion-button fill="outline" color="danger" (click)="confirmClearStats()">
            <ion-icon name="trash" slot="start"></ion-icon>
            Clear Statistics
          </ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }

      .stat-card {
        ion-card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          text-align: center;

          ion-icon {
            font-size: 2rem;
            margin-bottom: 8px;
          }
        }
      }

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--ion-text-color);
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--ion-color-medium);
        margin-top: 4px;
      }

      .win-rate {
        text-align: center;
      }

      .win-rate-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--ion-color-success);
      }

      .win-rate-bar {
        height: 8px;
        background: var(--ion-color-light);
        border-radius: 4px;
        margin: 12px 0;
        overflow: hidden;
      }

      .win-rate-fill {
        height: 100%;
        background: var(--ion-color-success);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .win-rate-label {
        font-size: 0.9rem;
        color: var(--ion-color-medium);
      }

      .park-icon {
        font-size: 1.5rem;
        width: 40px;
        text-align: center;
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 24px;
        text-align: center;

        ion-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        h2 {
          font-size: 1.3rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        p {
          color: var(--ion-color-medium);
          margin-bottom: 24px;
        }
      }

      .actions {
        display: flex;
        justify-content: center;
        margin-top: 24px;
        padding-bottom: 24px;
      }
    `,
  ],
})
export class StatsPage {
  private bingoService = inject(BingoService);
  private alertController = inject(AlertController);

  readonly stats = this.bingoService.stats;

  // Icon mapping
  private readonly iconMap: Record<string, string> = {
    mk: '🏰',
    epcot: '🌐',
    hs: '🎬',
    ak: '🌴',
    dl: '🏰',
    dca: '🎢',
  };

  private readonly parkNames: Record<string, string> = {
    mk: 'Magic Kingdom',
    epcot: 'EPCOT',
    hs: 'Hollywood Studios',
    ak: 'Animal Kingdom',
    dl: 'Disneyland',
    dca: 'California Adventure',
  };

  readonly winRate = computed(() => {
    const s = this.stats();
    if (s.totalGames === 0) return 0;
    return Math.round((s.totalBingos / s.totalGames) * 100);
  });

  readonly parkStats = computed(() => {
    const s = this.stats();
    const parks: Array<{
      id: string;
      name: string;
      icon: string;
      games: number;
      bingos: number;
      winRate: number;
    }> = [];

    for (const [id, games] of Object.entries(s.gamesPerPark)) {
      const bingos = s.bingosPerPark[id] || 0;
      parks.push({
        id,
        name: this.parkNames[id] || id,
        icon: this.iconMap[id] || '🎢',
        games,
        bingos,
        winRate: games > 0 ? Math.round((bingos / games) * 100) : 0,
      });
    }

    return parks.sort((a, b) => b.games - a.games);
  });

  readonly recentGames = computed(() => {
    const cards = this.bingoService.getAllCards();
    return cards
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((card) => ({
        id: card.id,
        parkName: this.parkNames[card.parkId] || card.parkId,
        date: new Date(card.createdAt).toLocaleDateString(),
        bingos: card.bingos,
      }));
  });

  constructor() {
    addIcons({ trophy, flame, gameController, statsChart, trash, refresh });
  }

  async confirmClearStats() {
    const alert = await this.alertController.create({
      header: 'Clear Statistics',
      message: 'Are you sure you want to clear all your statistics? This cannot be undone.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Clear',
          role: 'destructive',
          handler: () => {
            this.bingoService.clearStats();
          },
        },
      ],
    });

    await alert.present();
  }
}

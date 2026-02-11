import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonFooter,
  IonButtons,
} from '@ionic/angular/standalone';
import { BingoService } from '../../services/bingo.service';
import { addIcons } from 'ionicons';
import { playCircle, settings, informationCircle } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
    IonFooter,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="app-title">Park Bingo</span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button routerLink="/settings">
            <ion-icon name="settings" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="hero-section">
        <h1>Choose Your Park</h1>
        <p>Select a Disney park to generate your unique BINGO card</p>
      </div>

      @if (bingoService.parks().length === 0) {
        <div class="loading-container">
          <ion-text color="medium">Loading parks...</ion-text>
        </div>
      } @else {
        <ion-grid>
          <ion-row>
            @for (park of bingoService.parks(); track park.id) {
              <ion-col size="6" size-md="4">
                <ion-card
                  class="park-card"
                  [class.has-active-card]="hasCardForPark(park.id)"
                  (click)="selectPark(park.id)"
                  button
                >
                  <ion-card-header>
                    <div class="park-icon">{{ park.icon }}</div>
                    <ion-card-title>{{ park.name }}</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <p class="item-count">{{ park.items.length }} attractions</p>
                    @if (hasCardForPark(park.id)) {
                      <ion-button fill="clear" size="small" color="success">
                        Continue Game
                      </ion-button>
                    } @else {
                      <ion-button fill="clear" size="small">
                        <ion-icon name="play-circle" slot="start"></ion-icon>
                        New Game
                      </ion-button>
                    }
                  </ion-card-content>
                </ion-card>
              </ion-col>
            }
          </ion-row>
        </ion-grid>
      }
    </ion-content>

    <ion-footer>
      <ion-toolbar class="footer-toolbar">
        <ion-text color="medium" class="disclaimer">
          Not affiliated with The Walt Disney Company
        </ion-text>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .app-title {
        font-weight: 700;
        letter-spacing: -0.5px;
      }

      .hero-section {
        text-align: center;
        padding: 24px 16px;

        h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--ion-color-primary);
          margin-bottom: 8px;
        }

        p {
          color: var(--ion-color-medium);
          font-size: 0.95rem;
        }
      }

      .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
      }

      .park-card {
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        text-align: center;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        &.has-active-card {
          border: 2px solid var(--ion-color-success);
        }

        ion-card-header {
          padding-bottom: 8px;
        }

        ion-card-title {
          font-size: 1rem;
          font-weight: 600;
        }
      }

      .park-icon {
        font-size: 3rem;
        margin-bottom: 8px;
      }

      .item-count {
        font-size: 0.85rem;
        color: var(--ion-color-medium);
        margin-bottom: 8px;
      }

      .footer-toolbar {
        --background: transparent;
        --border-width: 0;
      }

      .disclaimer {
        display: block;
        text-align: center;
        font-size: 0.7rem;
        padding: 8px;
      }
    `,
  ],
})
export class HomePage {
  private router = inject(Router);
  bingoService = inject(BingoService);

  constructor() {
    addIcons({ playCircle, settings, informationCircle });
  }

  hasCardForPark(parkId: string): boolean {
    const currentCard = this.bingoService.currentCard();
    return currentCard?.parkId === parkId;
  }

  selectPark(parkId: string) {
    const currentCard = this.bingoService.currentCard();

    if (currentCard?.parkId === parkId) {
      // Continue existing game
      this.router.navigate(['/play']);
    } else {
      // Start new game
      this.bingoService.generateCard(parkId);
      this.router.navigate(['/play']);
    }
  }
}

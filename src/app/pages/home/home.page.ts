import { Component, inject, ChangeDetectionStrategy, signal, effect } from '@angular/core';
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
import { OnboardingService } from '../../services/onboarding.service';
import { HelpModalComponent } from '../../components/help-modal/help-modal.component';
import { addIcons } from 'ionicons';
import { playCircle, settings, helpCircle, cloudOffline } from 'ionicons/icons';

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
    HelpModalComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="app-title">Park Pursuit Bingo</span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp.set(true)" aria-label="Help">
            <ion-icon name="help-circle" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button routerLink="/settings">
            <ion-icon name="settings" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (bingoService.isOffline()) {
        <div class="offline-banner">
          <ion-icon name="cloud-offline"></ion-icon>
          <span>Offline mode - using cached data</span>
        </div>
      }

      <div class="hero-section">
        <h1>Choose Your Park</h1>
        <p>Select a Disney park to generate your unique BINGO card</p>
      </div>

      @if (bingoService.isLoading()) {
        <div class="loading-container">
          <ion-text color="medium">Loading parks...</ion-text>
        </div>
      } @else if (bingoService.parks().length === 0) {
        <div class="loading-container">
          <ion-text color="danger">Failed to load parks. Please try again.</ion-text>
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
                    <div class="park-icon">
                      @if (getParkImage(park.id)) {
                        <img [src]="getParkImage(park.id)" [alt]="park.name" class="park-image" />
                      } @else {
                        <span class="park-emoji">{{ getParkIcon(park.icon) }}</span>
                      }
                    </div>
                    <ion-card-title>{{ park.shortName || park.name }}</ion-card-title>
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

      <!-- Onboarding/Help Modal -->
      <app-help-modal [isOpen]="showHelp()" (closed)="closeHelp()"></app-help-modal>
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
        width: 80px;
        height: 80px;
        margin: 0 auto 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 12px;
      }

      .park-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 12px;
      }

      .park-emoji {
        font-size: 3rem;
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

      .offline-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--ion-color-warning);
        color: var(--ion-color-warning-contrast);
        font-size: 0.85rem;

        ion-icon {
          font-size: 1.2rem;
        }
      }
    `,
  ],
})
export class HomePage {
  private router = inject(Router);
  bingoService = inject(BingoService);
  private onboardingService = inject(OnboardingService);

  readonly showHelp = signal(false);

  // Icon mapping from string to emoji
  private readonly iconMap: Record<string, string> = {
    castle: '🏰',
    globe: '🌐',
    film: '🎬',
    leaf: '🌴',
    sunny: '🎢',
  };

  constructor() {
    addIcons({ playCircle, settings, helpCircle, cloudOffline });

    // Auto-show help on first launch
    effect(() => {
      if (this.onboardingService.showOnboarding()) {
        this.showHelp.set(true);
      }
    });
  }

  getParkIcon(icon: string): string {
    return this.iconMap[icon] || icon;
  }

  getParkImage(parkId: string): string | null {
    // Map park IDs to their iconic attraction images
    const parkImages: Record<string, string> = {
      'mk': '/images/parks/mk/cinderella-castle.jpg',
      'epcot': '/images/parks/epcot/spaceship-earth.jpg',
      'hs': '/images/parks/hs/twilight-zone-tower-of-terror.jpg',
      'ak': '/images/parks/ak/expedition-everest.jpg',
      'dl': '/images/parks/dl/sleeping-beauty-castle-walkthrough.jpg',
      'dca': '/images/parks/dca/radiator-springs-racers.jpg',
    };
    return parkImages[parkId] || null;
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

  closeHelp() {
    this.showHelp.set(false);
    // Mark onboarding as complete
    if (this.onboardingService.showOnboarding()) {
      this.onboardingService.completeOnboarding();
    }
  }
}

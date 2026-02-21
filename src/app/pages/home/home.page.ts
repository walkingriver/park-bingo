import { Component, inject, ChangeDetectionStrategy, signal, effect, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
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
import { playCircle, play, addCircle, settings, helpCircle, cloudOffline } from 'ionicons/icons';

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
    IonCardSubtitle,
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
              <ion-col size="12" size-sm="6" size-md="4">
                <ion-card
                  class="park-card"
                  [class.has-active-card]="hasCardForPark(park.id)"
                  (click)="selectPark(park.id)"
                  button
                >
                  @if (getParkImage(park.id)) {
                    <img [src]="getParkImage(park.id)" [alt]="park.name" class="card-banner" />
                  } @else {
                    <div class="card-banner-placeholder">
                      <span class="park-emoji">{{ getParkIcon(park.icon) }}</span>
                    </div>
                  }
                  <ion-card-header>
                    <ion-card-title>{{ park.shortName || park.name }}</ion-card-title>
                    <ion-card-subtitle>{{ park.items.length }} attractions</ion-card-subtitle>
                  </ion-card-header>
                  <ion-card-content>
                    @if (hasCardForPark(park.id)) {
                      <ion-button expand="block" fill="solid" color="success" size="small">
                        <ion-icon name="play" slot="start"></ion-icon>
                        Continue Game
                      </ion-button>
                    } @else {
                      <ion-button expand="block" fill="outline" color="primary" size="small">
                        <ion-icon name="add-circle" slot="start"></ion-icon>
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
        overflow: hidden;
        margin: 8px;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        &.has-active-card {
          border: 2px solid var(--ion-color-success);
        }

        ion-card-header {
          padding: 12px 16px 8px;
        }

        ion-card-title {
          font-size: 1.1rem;
          font-weight: 600;
        }

        ion-card-subtitle {
          font-size: 0.85rem;
          margin-top: 4px;
        }

        ion-card-content {
          padding: 8px 16px 16px;
        }
      }

      .card-banner {
        width: 100%;
        height: 140px;
        object-fit: cover;
        display: block;
      }

      .card-banner-placeholder {
        width: 100%;
        height: 140px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--ion-color-light);
      }

      .park-emoji {
        font-size: 4rem;
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
export class HomePage implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  bingoService = inject(BingoService);
  private onboardingService = inject(OnboardingService);

  readonly showHelp = signal(false);

  // Valid park IDs for query parameter validation
  private readonly validParkIds = ['mk', 'epcot', 'hs', 'ak', 'dl', 'dca'];

  // Icon mapping from string to emoji
  private readonly iconMap: Record<string, string> = {
    castle: '🏰',
    globe: '🌐',
    film: '🎬',
    leaf: '🌴',
    sunny: '🎢',
  };

  constructor() {
    addIcons({ playCircle, play, addCircle, settings, helpCircle, cloudOffline });

    // Auto-show help on first launch
    effect(() => {
      if (this.onboardingService.showOnboarding()) {
        this.showHelp.set(true);
      }
    });
  }

  ngOnInit() {
    // Check for park query parameter to auto-start a game
    // Usage: https://park-bingo.pages.dev/?park=mk
    this.route.queryParams.subscribe((params) => {
      const parkId = params['park'];
      if (parkId && this.validParkIds.includes(parkId)) {
        // Wait for parks to load, then auto-select the park
        const checkParks = () => {
          if (!this.bingoService.isLoading() && this.bingoService.parks().length > 0) {
            // Mark onboarding complete to skip modal
            this.onboardingService.completeOnboarding();
            // Generate new card and navigate to play
            this.bingoService.generateCard(parkId);
            this.router.navigate(['/play'], { replaceUrl: true });
          } else {
            // Parks still loading, check again shortly
            setTimeout(checkParks, 100);
          }
        };
        checkParks();
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

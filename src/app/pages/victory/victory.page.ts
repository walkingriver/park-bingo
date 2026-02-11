import { Component, inject, computed, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonFooter,
} from '@ionic/angular/standalone';
import { BingoService } from '../../services/bingo.service';
import { AffiliateService, AffiliateProduct } from '../../services/affiliate.service';
import { addIcons } from 'ionicons';
import { trophy, share, home, arrowForward, cart, star } from 'ionicons/icons';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-victory',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonText,
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

      @if (affiliateService.isEnabled() && recommendedProducts.length > 0) {
        <div class="affiliate-section">
          <h2>Enhance Your Next Trip</h2>
          <p class="affiliate-subtitle">
            Recommended gear for Disney park adventurers
          </p>

          <ion-grid>
            <ion-row>
              @for (product of recommendedProducts; track product.asin) {
                <ion-col size="6">
                  <ion-card class="product-card" button (click)="openProduct(product)">
                    <div class="product-image-container">
                      <img
                        [src]="product.imageUrl"
                        [alt]="product.name"
                        class="product-image"
                        (error)="onImageError($event)"
                      />
                    </div>
                    <ion-card-header>
                      <ion-card-title class="product-title">
                        {{ product.name }}
                      </ion-card-title>
                    </ion-card-header>
                    <ion-card-content>
                      <p class="product-description">{{ product.description }}</p>
                      <ion-button fill="clear" size="small" color="warning">
                        <ion-icon name="cart" slot="start"></ion-icon>
                        View on Amazon
                      </ion-button>
                    </ion-card-content>
                  </ion-card>
                </ion-col>
              }
            </ion-row>
          </ion-grid>

          <ion-text color="medium" class="affiliate-disclosure">
            <p>
              As an Amazon Associate, we earn from qualifying purchases.
              Thank you for supporting Park Bingo!
            </p>
          </ion-text>
        </div>
      }
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

      .affiliate-section {
        padding: 0 16px;

        h2 {
          font-size: 1.3rem;
          font-weight: 700;
          color: var(--ion-text-color);
          margin-bottom: 4px;
        }

        .affiliate-subtitle {
          color: var(--ion-color-medium);
          font-size: 0.9rem;
          margin-bottom: 16px;
        }
      }

      .product-card {
        height: 100%;

        .product-image-container {
          padding: 12px;
          background: #f8f9fa;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100px;
        }

        .product-image {
          max-width: 80px;
          max-height: 80px;
          object-fit: contain;
        }

        ion-card-header {
          padding: 8px 12px 4px;
        }

        .product-title {
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        ion-card-content {
          padding: 4px 12px 12px;
        }

        .product-description {
          font-size: 0.7rem;
          color: var(--ion-color-medium);
          margin-bottom: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-price {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--ion-color-success);
          margin-bottom: 4px;
        }
      }

      .affiliate-disclosure {
        display: block;
        text-align: center;
        font-size: 0.7rem;
        padding: 16px;
        margin-top: 16px;
      }
    `,
  ],
})
export class VictoryPage implements OnInit {
  private router = inject(Router);
  private bingoService = inject(BingoService);
  affiliateService = inject(AffiliateService);

  recommendedProducts: AffiliateProduct[] = [];

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
    addIcons({ trophy, share, home, arrowForward, cart, star });
  }

  ngOnInit() {
    // Load recommended products based on park
    const parkId = this.card()?.parkId || '';
    this.recommendedProducts = this.affiliateService.getProductsForPark(parkId, 4);

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

Download Park Bingo to play your own game! #ParkBingo #Disney`;

    try {
      await Share.share({
        title: 'My Park Bingo Victory!',
        text,
        dialogTitle: 'Share your Park Bingo victory',
      });
    } catch (error) {
      console.log('Share cancelled or failed:', error);
    }
  }

  openProduct(product: AffiliateProduct) {
    this.affiliateService.openProductLink(product);
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Hide broken image
    img.style.display = 'none';
  }
}

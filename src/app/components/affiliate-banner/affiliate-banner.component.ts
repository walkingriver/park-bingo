import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { AffiliateService, AffiliateProduct } from '../../services/affiliate.service';
import { addIcons } from 'ionicons';
import { cart } from 'ionicons/icons';

@Component({
  selector: 'app-affiliate-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    @if (affiliateService.showBanner() && currentProduct()) {
      <div class="affiliate-banner" [class.visible]="isVisible()">
        <div class="banner-content" (click)="openProduct()">
          <div class="product-image-container">
            @if (currentProduct()?.imageUrl) {
              <img
                [src]="currentProduct()?.imageUrl"
                [alt]="currentProduct()?.name"
                class="product-image"
                loading="lazy"
                (error)="onImageError($event)"
              />
            } @else {
              <div class="product-placeholder">
                {{ getCategoryIcon(currentProduct()?.category) }}
              </div>
            }
          </div>
          <div class="product-info">
            <span class="product-name">{{ currentProduct()?.name }}</span>
            <span class="product-cta">
              <ion-icon name="cart"></ion-icon>
              View on Amazon
            </span>
          </div>
        </div>
        <span class="sponsored-label">Sponsored</span>
      </div>
    }
  `,
  styles: [
    `
      .affiliate-banner {
        position: relative;
        background: var(--ion-card-background, #fff);
        border-radius: 12px;
        padding: 0;
        margin: 4px 0 2px 0; /* Minimal margin: 4px top, 2px bottom */
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        border: 1px solid var(--ion-color-light);
        overflow: hidden;
        /* Constrain banner height to 12% of viewport */
        max-height: 12vh;
      }

      .affiliate-banner.visible {
        opacity: 1;
        transform: translateY(0);
      }


      .banner-content {
        display: flex;
        align-items: stretch;
        cursor: pointer;
        height: 12vh;
        max-height: 12vh;
      }

      .product-image-container {
        width: 20%;
        flex-shrink: 0;
        background: #f8f9fa;
      }

      .product-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: top; /* Anchor to top for book covers */
        display: block;
      }

      .product-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        font-size: 1.5rem;
      }

      .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
        min-width: 0;
        padding: 6px 8px 14px 10px; /* Tighter padding, more room for text */
        overflow: hidden;
      }

      .product-name {
        font-weight: 600;
        font-size: 0.8rem;
        line-height: 1.2;
        color: var(--ion-text-color);
        /* Allow 2 lines before ellipsis */
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .product-cta {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.7rem;
        color: var(--ion-color-warning);
        font-weight: 600;

        ion-icon {
          font-size: 12px;
        }
      }

      .sponsored-label {
        position: absolute;
        bottom: 2px;
        right: 8px;
        font-size: 0.55rem;
        color: var(--ion-color-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `,
  ],
})
export class AffiliateBannerComponent implements OnInit, OnDestroy {
  affiliateService = inject(AffiliateService);

  readonly currentProduct = signal<AffiliateProduct | null>(null);
  readonly isVisible = signal(false);

  private rotationInterval: ReturnType<typeof setInterval> | null = null;
  private dismissed = false;

  constructor() {
    addIcons({ cart });
  }

  ngOnInit() {
    // Delay showing banner for 5 seconds after component mounts (reduced for testing)
    setTimeout(() => {
      if (!this.dismissed) {
        console.log('Affiliate banner: showing first product');
        this.showNextProduct();
        this.startRotation();
      }
    }, 5000);
  }

  ngOnDestroy() {
    this.stopRotation();
  }

  private startRotation() {
    const interval = this.affiliateService.bannerInterval();
    if (interval > 0) {
      this.rotationInterval = setInterval(() => {
        if (!this.dismissed) {
          this.showNextProduct();
        }
      }, interval);
    }
  }

  private stopRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  private showNextProduct() {
    const product = this.affiliateService.getRandomProduct();
    if (product) {
      this.isVisible.set(false);
      setTimeout(() => {
        this.currentProduct.set(product);
        this.isVisible.set(true);
      }, 300);
    }
  }

  openProduct() {
    const product = this.currentProduct();
    if (product) {
      this.affiliateService.openProductLink(product);
    }
  }

  dismiss() {
    this.dismissed = true;
    this.isVisible.set(false);
    this.stopRotation();
    setTimeout(() => {
      this.currentProduct.set(null);
    }, 300);
  }

  getCategoryIcon(category?: string): string {
    const icons: Record<string, string> = {
      book: '📚',
      accessory: '🎒',
      apparel: '👕',
      collectible: '✨',
    };
    return icons[category || 'accessory'] || '🛒';
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

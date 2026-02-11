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
import { cart, closeCircle } from 'ionicons/icons';

@Component({
  selector: 'app-affiliate-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonIcon],
  template: `
    @if (affiliateService.showBanner() && currentProduct()) {
      <div class="affiliate-banner" [class.visible]="isVisible()">
        <button class="close-btn" (click)="dismiss()" aria-label="Close ad">
          <ion-icon name="close-circle"></ion-icon>
        </button>
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
        padding: 12px;
        margin: 16px 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s ease, transform 0.3s ease;
        border: 1px solid var(--ion-color-light);
      }

      .affiliate-banner.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .close-btn {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--ion-background-color);
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 1;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

        ion-icon {
          font-size: 20px;
          color: var(--ion-color-medium);
        }
      }

      .banner-content {
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
      }

      .product-image-container {
        width: 60px;
        height: 60px;
        flex-shrink: 0;
      }

      .product-image {
        width: 60px;
        height: 60px;
        object-fit: contain;
        border-radius: 8px;
        background: #f8f9fa;
      }

      .product-placeholder {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 8px;
        font-size: 1.5rem;
      }

      .product-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
      }

      .product-name {
        font-weight: 600;
        font-size: 0.85rem;
        color: var(--ion-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .product-cta {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.75rem;
        color: var(--ion-color-warning);
        font-weight: 600;

        ion-icon {
          font-size: 14px;
        }
      }

      .sponsored-label {
        position: absolute;
        bottom: 4px;
        right: 8px;
        font-size: 0.6rem;
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
    addIcons({ cart, closeCircle });
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

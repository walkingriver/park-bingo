import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
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
  IonButton,
  IonIcon,
  IonText,
  IonChip,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { AffiliateService, AffiliateProduct } from '../../services/affiliate.service';
import { addIcons } from 'ionicons';
import { cart, book, bag, shirt, sparkles, alertCircle } from 'ionicons/icons';
import { signal } from '@angular/core';

@Component({
  selector: 'app-products',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
    IonButton,
    IonIcon,
    IonText,
    IonChip,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Recommended Products</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="selectedCategory()" (ionChange)="onCategoryChange($event)">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="book">
            <ion-label>Books</ion-label>
          </ion-segment-button>
          <ion-segment-button value="accessory">
            <ion-label>Gear</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @if (!affiliateService.isEnabled()) {
        <div class="no-products">
          <ion-icon name="alert-circle" color="medium"></ion-icon>
          <ion-text color="medium">
            <p>Products are not available at this time.</p>
          </ion-text>
        </div>
      } @else {
        <p class="intro-text">
          Gear we recommend for your next Disney adventure. Tap any product to view on Amazon.
        </p>

        <div class="products-grid">
          @for (product of filteredProducts(); track product.asin) {
            <ion-card class="product-card" button (click)="openProduct(product)">
              <div class="product-image-container">
                @if (product.imageUrl) {
                  <img
                    [src]="product.imageUrl"
                    [alt]="product.name"
                    class="product-image"
                    loading="lazy"
                    (error)="onImageError($event)"
                  />
                } @else {
                  <div class="product-placeholder">
                    {{ getCategoryIcon(product.category) }}
                  </div>
                }
              </div>
              <ion-card-header>
                <ion-chip size="small" color="medium">
                  {{ getCategoryLabel(product.category) }}
                </ion-chip>
                <ion-card-title>{{ product.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p class="product-description">{{ product.description }}</p>
                <div class="park-tags">
                  @for (park of product.parks.slice(0, 3); track park) {
                    <span class="park-tag">{{ getParkLabel(park) }}</span>
                  }
                  @if (product.parks.length > 3) {
                    <span class="park-tag">+{{ product.parks.length - 3 }}</span>
                  }
                </div>
                <ion-button expand="block" fill="outline" color="warning" size="small">
                  <ion-icon name="cart" slot="start"></ion-icon>
                  View on Amazon
                </ion-button>
              </ion-card-content>
            </ion-card>
          } @empty {
            <div class="no-products">
              <ion-text color="medium">
                <p>No products in this category.</p>
              </ion-text>
            </div>
          }
        </div>

        <ion-text color="medium" class="affiliate-disclosure">
          <p>
            As an Amazon Associate, we earn from qualifying purchases.
            Thank you for supporting Park Bingo!
          </p>
        </ion-text>
      }
    </ion-content>
  `,
  styles: [
    `
      .intro-text {
        color: var(--ion-color-medium);
        font-size: 0.9rem;
        margin-bottom: 16px;
        text-align: center;
      }

      .products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }

      .product-card {
        margin: 0;

        ion-card-header {
          padding: 8px 12px;
        }

        ion-card-title {
          font-size: 0.85rem;
          font-weight: 600;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-top: 8px;
        }

        ion-card-content {
          padding: 8px 12px 12px;
        }

        ion-chip {
          height: 20px;
          font-size: 0.65rem;
        }
      }

      .product-image-container {
        width: 100%;
        height: 120px;
        background: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .product-image {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      .product-placeholder {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        font-size: 2rem;
      }

      .product-description {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        margin-bottom: 8px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .park-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-bottom: 12px;
      }

      .park-tag {
        font-size: 0.6rem;
        padding: 2px 6px;
        background: var(--ion-color-light);
        border-radius: 4px;
        color: var(--ion-color-medium);
      }

      .no-products {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px 16px;
        text-align: center;

        ion-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }
      }

      .affiliate-disclosure {
        display: block;
        text-align: center;
        font-size: 0.7rem;
        padding: 24px 16px;
        margin-top: 16px;
      }
    `,
  ],
})
export class ProductsPage {
  affiliateService = inject(AffiliateService);

  readonly selectedCategory = signal<string>('all');

  readonly allProducts = computed(() => this.affiliateService.config().products);

  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const products = this.allProducts();

    if (category === 'all') {
      return products;
    }
    return products.filter((p) => p.category === category);
  });

  constructor() {
    addIcons({ cart, book, bag, shirt, sparkles, alertCircle });
  }

  onCategoryChange(event: CustomEvent) {
    this.selectedCategory.set(event.detail.value);
  }

  openProduct(product: AffiliateProduct) {
    this.affiliateService.openProductLink(product);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      book: '📚',
      accessory: '🎒',
      apparel: '👕',
      collectible: '✨',
    };
    return icons[category] || '🛒';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      book: 'Book',
      accessory: 'Gear',
      apparel: 'Apparel',
      collectible: 'Collectible',
    };
    return labels[category] || category;
  }

  getParkLabel(parkId: string): string {
    const labels: Record<string, string> = {
      mk: 'MK',
      epcot: 'EPCOT',
      hs: 'HS',
      ak: 'AK',
      dl: 'DL',
      dca: 'DCA',
    };
    return labels[parkId] || parkId.toUpperCase();
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    // Show placeholder instead
    const container = img.parentElement;
    if (container) {
      const placeholder = document.createElement('div');
      placeholder.className = 'product-placeholder';
      placeholder.textContent = '🛒';
      container.appendChild(placeholder);
    }
  }
}

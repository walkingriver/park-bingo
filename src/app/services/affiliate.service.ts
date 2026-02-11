import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Browser } from '@capacitor/browser';
import { catchError, of, tap } from 'rxjs';

export interface AffiliateProduct {
  asin: string;
  name: string;
  description: string;
  category: 'book' | 'accessory' | 'apparel' | 'collectible';
  parks: string[];
  // Computed at runtime
  imageUrl?: string;
  amazonUrl?: string;
  price?: string;
}

export interface AffiliateConfig {
  associatesTag: string;
  enabled: boolean;
  showInCardBanner: boolean;
  bannerRotationSeconds: number;
  products: AffiliateProduct[];
}

@Injectable({
  providedIn: 'root',
})
export class AffiliateService {
  private http = inject(HttpClient);

  private readonly CONFIG_URL = 'data/affiliate-products.json';

  // Default config if JSON fails to load or is empty
  private readonly DEFAULT_CONFIG: AffiliateConfig = {
    associatesTag: '',
    enabled: false,
    showInCardBanner: false,
    bannerRotationSeconds: 60,
    products: [],
  };

  private configSignal = signal<AffiliateConfig>(this.DEFAULT_CONFIG);

  readonly config = this.configSignal.asReadonly();
  readonly isEnabled = computed(() => {
    const cfg = this.config();
    return cfg.enabled && cfg.associatesTag && cfg.associatesTag !== 'REPLACE_WITH_YOUR_TAG';
  });
  readonly showBanner = computed(() => this.isEnabled() && this.config().showInCardBanner);
  readonly bannerInterval = computed(() => this.config().bannerRotationSeconds * 1000);

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    this.http
      .get<AffiliateConfig>(this.CONFIG_URL)
      .pipe(
        tap((config) => {
          console.log('Affiliate config loaded:', config);
          // Validate and enrich products
          if (config && config.products) {
            config.products = config.products
              .filter((p) => p.asin && p.asin !== 'REPLACE_ASIN')
              .map((p) => this.enrichProduct(p, config.associatesTag));
          }
          this.configSignal.set(config);
          console.log('Affiliate enabled:', this.isEnabled(), 'showBanner:', this.showBanner());
        }),
        catchError((error) => {
          console.warn('Failed to load affiliate config:', error);
          return of(this.DEFAULT_CONFIG);
        })
      )
      .subscribe();
  }

  private enrichProduct(product: AffiliateProduct, tag: string): AffiliateProduct {
    return {
      ...product,
      // Use manual imageUrl if provided, otherwise leave undefined (component will show placeholder)
      imageUrl: product.imageUrl || undefined,
      // Amazon product URL with affiliate tag
      amazonUrl: `https://www.amazon.com/dp/${product.asin}?tag=${tag}`,
    };
  }

  getProductsForPark(parkId: string, limit = 4): AffiliateProduct[] {
    if (!this.isEnabled()) return [];

    const products = this.config().products;
    const parkProducts = products.filter((p) => p.parks.includes(parkId));

    // Return park-specific products first, then fill with random others
    if (parkProducts.length >= limit) {
      return this.shuffle(parkProducts).slice(0, limit);
    }

    const remaining = products.filter((p) => !p.parks.includes(parkId));
    const combined = [...parkProducts, ...this.shuffle(remaining)];
    return combined.slice(0, limit);
  }

  getRandomProduct(): AffiliateProduct | null {
    if (!this.isEnabled()) return null;

    const products = this.config().products;
    if (products.length === 0) return null;

    return products[Math.floor(Math.random() * products.length)];
  }

  getRandomProducts(limit = 4): AffiliateProduct[] {
    if (!this.isEnabled()) return [];
    return this.shuffle([...this.config().products]).slice(0, limit);
  }

  async openProductLink(product: AffiliateProduct): Promise<void> {
    if (!product.amazonUrl) return;

    try {
      await Browser.open({ url: product.amazonUrl });
    } catch {
      // Fallback to window.open for web
      window.open(product.amazonUrl, '_blank');
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

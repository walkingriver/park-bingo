import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Browser } from '@capacitor/browser';
import { catchError, of, tap, timeout } from 'rxjs';

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

  // Remote gist URL for affiliate products config
  // Edit at: https://gist.github.com/walkingriver/c2afc9315f3c4456daaa4133b53d1230
  private readonly REMOTE_CONFIG_URL =
    'https://gist.githubusercontent.com/walkingriver/c2afc9315f3c4456daaa4133b53d1230/raw/affiliate-products.json';

  // Timeout for remote fetch (5 seconds)
  private readonly FETCH_TIMEOUT_MS = 5000;

  // Default config - ads disabled (used when remote fetch fails or offline)
  private readonly DEFAULT_CONFIG: AffiliateConfig = {
    associatesTag: '',
    enabled: false,
    showInCardBanner: false,
    bannerRotationSeconds: 60,
    products: [],
  };

  private configSignal = signal<AffiliateConfig>(this.DEFAULT_CONFIG);
  private loadingSignal = signal<boolean>(true);

  readonly config = this.configSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
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
    // Check if we're offline first
    if (!navigator.onLine) {
      console.log('Offline - affiliate ads disabled');
      this.loadingSignal.set(false);
      return;
    }

    this.http
      .get<AffiliateConfig>(this.REMOTE_CONFIG_URL)
      .pipe(
        timeout(this.FETCH_TIMEOUT_MS),
        tap((config) => {
          console.log('Affiliate config loaded from remote:', config);
          // Validate and enrich products
          if (config && config.products) {
            config.products = config.products
              .filter((p) => p.asin && p.asin !== 'REPLACE_ASIN')
              .map((p) => this.enrichProduct(p, config.associatesTag));
          }
          this.configSignal.set(config);
          this.loadingSignal.set(false);
          console.log('Affiliate enabled:', this.isEnabled(), 'showBanner:', this.showBanner());
        }),
        catchError((error) => {
          // If remote fetch fails for any reason, just disable ads silently
          console.log('Remote affiliate config unavailable - ads disabled:', error.message || error);
          this.loadingSignal.set(false);
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

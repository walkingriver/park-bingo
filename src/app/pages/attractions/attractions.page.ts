import { Component, inject, computed, ChangeDetectionStrategy, signal } from '@angular/core';
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
  IonText,
  IonChip,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { BingoService } from '../../services/bingo.service';
import { ParkItem } from '../../models/park.model';

@Component({
  selector: 'app-attractions',
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
    IonText,
    IonChip,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonBadge,
    IonSearchbar,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Attractions Browser</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [value]="selectedPark()" (ionChange)="onParkChange($event)" [scrollable]="true">
          <ion-segment-button value="all">
            <ion-label>All</ion-label>
          </ion-segment-button>
          @for (park of parks(); track park.id) {
            <ion-segment-button [value]="park.id">
              <ion-label>{{ park.shortName }}</ion-label>
            </ion-segment-button>
          }
        </ion-segment>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar 
          [value]="searchQuery()" 
          (ionInput)="onSearch($event)"
          placeholder="Search attractions..."
          [debounce]="300"
        ></ion-searchbar>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="stats-bar">
        <ion-badge color="primary">{{ filteredAttractions().length }} attractions</ion-badge>
        <ion-badge color="success">{{ withImages() }} with images</ion-badge>
        <ion-badge color="warning">{{ withoutImages() }} missing images</ion-badge>
      </div>

      @if (selectedPark() === 'all') {
        @for (park of parks(); track park.id) {
          @if (getAttractionsForPark(park.id).length > 0) {
            <h2 class="park-header">{{ park.name }}</h2>
            <div class="attractions-grid">
              @for (item of getAttractionsForPark(park.id); track item.id) {
                <ion-card class="attraction-card" [class.missing-image]="!item.imageUrl">
                  <div class="attraction-image-container">
                    @if (item.imageUrl) {
                      <img
                        [src]="item.imageUrl"
                        [alt]="item.name"
                        class="attraction-image"
                        loading="lazy"
                        (error)="onImageError($event, item)"
                      />
                    } @else {
                      <div class="attraction-placeholder">
                        {{ getTypeIcon(item.type) }}
                      </div>
                    }
                    <ion-chip class="type-chip" size="small">{{ item.type }}</ion-chip>
                  </div>
                  <ion-card-header>
                    <ion-card-title>{{ item.name }}</ion-card-title>
                  </ion-card-header>
                  <ion-card-content>
                    <p class="attraction-description">{{ item.description }}</p>
                    <p class="attraction-id">ID: {{ item.id }}</p>
                    @if (item.imageUrl) {
                      <p class="image-path">{{ item.imageUrl }}</p>
                    } @else {
                      <p class="no-image-warning">⚠️ No image</p>
                    }
                  </ion-card-content>
                </ion-card>
              }
            </div>
          }
        }
      } @else {
        <div class="attractions-grid">
          @for (item of filteredAttractions(); track item.id) {
            <ion-card class="attraction-card" [class.missing-image]="!item.imageUrl">
              <div class="attraction-image-container">
                @if (item.imageUrl) {
                  <img
                    [src]="item.imageUrl"
                    [alt]="item.name"
                    class="attraction-image"
                    loading="lazy"
                    (error)="onImageError($event, item)"
                  />
                } @else {
                  <div class="attraction-placeholder">
                    {{ getTypeIcon(item.type) }}
                  </div>
                }
                <ion-chip class="type-chip" size="small">{{ item.type }}</ion-chip>
              </div>
              <ion-card-header>
                <ion-card-title>{{ item.name }}</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p class="attraction-description">{{ item.description }}</p>
                <p class="attraction-id">ID: {{ item.id }}</p>
                @if (item.imageUrl) {
                  <p class="image-path">{{ item.imageUrl }}</p>
                } @else {
                  <p class="no-image-warning">⚠️ No image</p>
                }
              </ion-card-content>
            </ion-card>
          } @empty {
            <div class="no-results">
              <ion-text color="medium">
                <p>No attractions found.</p>
              </ion-text>
            </div>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [
    `
      ion-segment {
        --background: var(--ion-color-light);
      }

      ion-segment-button {
        --color: var(--ion-color-medium);
        --color-checked: var(--ion-color-primary-contrast);
        --background-checked: var(--ion-color-primary);
        --indicator-color: transparent;
        font-weight: 600;
        min-width: 80px;
      }

      .stats-bar {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .park-header {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--ion-color-primary);
        margin: 24px 0 12px;
        padding-bottom: 8px;
        border-bottom: 2px solid var(--ion-color-primary);
      }

      .park-header:first-of-type {
        margin-top: 0;
      }

      .attractions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
        gap: 12px;
      }

      .attraction-card {
        margin: 0;

        &.missing-image {
          border: 2px solid var(--ion-color-warning);
        }

        ion-card-header {
          padding: 8px 12px;
        }

        ion-card-title {
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        ion-card-content {
          padding: 8px 12px 12px;
        }
      }

      .attraction-image-container {
        position: relative;
        width: 100%;
        height: 100px;
        background: var(--ion-color-light);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .attraction-image {
        width: 100%;
        height: 100%;
      }

      .attraction-placeholder {
        width: 60px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        font-size: 1.5rem;
      }

      .type-chip {
        position: absolute;
        top: 4px;
        right: 4px;
        height: 18px;
        font-size: 0.6rem;
        --background: rgba(0, 0, 0, 0.7);
        --color: white;
      }

      .attraction-description {
        font-size: 0.7rem;
        color: var(--ion-color-medium);
        margin-bottom: 4px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .attraction-id {
        font-size: 0.6rem;
        font-family: monospace;
        color: var(--ion-color-medium);
        margin-bottom: 2px;
      }

      .image-path {
        font-size: 0.55rem;
        font-family: monospace;
        color: var(--ion-color-success);
        word-break: break-all;
      }

      .no-image-warning {
        font-size: 0.7rem;
        color: var(--ion-color-warning);
        font-weight: 600;
      }

      .no-results {
        grid-column: 1 / -1;
        text-align: center;
        padding: 48px 16px;
      }
    `,
  ],
})
export class AttractionsPage {
  private bingoService = inject(BingoService);

  readonly selectedPark = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly parks = this.bingoService.parks;

  readonly allAttractions = computed(() => {
    const parks = this.parks();
    const items: (ParkItem & { parkId: string })[] = [];
    for (const park of parks) {
      for (const item of park.items) {
        items.push({ ...item, parkId: park.id });
      }
    }
    return items;
  });

  readonly filteredAttractions = computed(() => {
    const parkId = this.selectedPark();
    const query = this.searchQuery().toLowerCase();
    let items = this.allAttractions();

    if (parkId !== 'all') {
      items = items.filter((item) => item.parkId === parkId);
    }

    if (query) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  });

  readonly withImages = computed(() => {
    return this.filteredAttractions().filter((item) => item.imageUrl).length;
  });

  readonly withoutImages = computed(() => {
    return this.filteredAttractions().filter((item) => !item.imageUrl).length;
  });

  onParkChange(event: CustomEvent) {
    this.selectedPark.set(event.detail.value);
  }

  onSearch(event: CustomEvent) {
    this.searchQuery.set(event.detail.value || '');
  }

  getAttractionsForPark(parkId: string): (ParkItem & { parkId: string })[] {
    const query = this.searchQuery().toLowerCase();
    let items = this.allAttractions().filter((item) => item.parkId === parkId);

    if (query) {
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    }

    return items;
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      ride: '🎢',
      show: '🎭',
      character: '👤',
      food: '🍽️',
      transportation: '🚂',
      detail: '📍',
    };
    return icons[type] || '📍';
  }

  onImageError(event: Event, item: ParkItem) {
    console.warn(`Failed to load image for ${item.name}: ${item.imageUrl}`);
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

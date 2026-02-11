import {
  Component,
  inject,
  computed,
  signal,
  ChangeDetectionStrategy,
  effect,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonFooter,
  IonText,
  IonBackButton,
  IonModal,
  IonList,
  IonItem,
  IonLabel,
  IonChip,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { BingoService } from '../../services/bingo.service';
import { SoundService } from '../../services/sound.service';
import { BingoSquare } from '../../models/park.model';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import {
  home,
  share,
  refresh,
  checkmarkCircle,
  closeCircle,
  time,
  informationCircle,
  trophy,
  helpCircle,
} from 'ionicons/icons';
import confetti from 'canvas-confetti';
import { AffiliateBannerComponent } from '../../components/affiliate-banner/affiliate-banner.component';
import { HelpModalComponent } from '../../components/help-modal/help-modal.component';

@Component({
  selector: 'app-play',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonFooter,
    IonText,
    IonBackButton,
    IonModal,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    AffiliateBannerComponent,
    HelpModalComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ parkName() }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="showHelp.set(true)" aria-label="Help">
            <ion-icon name="help-circle" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="shareCard()">
            <ion-icon name="share" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (card()) {
        <div class="stats-bar">
          <div class="stat">
            <ion-icon name="trophy" color="warning"></ion-icon>
            <span>{{ card()?.bingos || 0 }} BINGOs</span>
          </div>
          <div class="stat">
            <ion-icon name="checkmark-circle" color="success"></ion-icon>
            <span>{{ completedCount() }}/25</span>
          </div>
        </div>

        <div class="bingo-grid" id="bingo-card">
          @for (row of card()?.squares; track rowIdx; let rowIdx = $index) {
            @for (square of row; track square.id; let colIdx = $index) {
              <div
                class="bingo-square"
                [class.completed]="square.status === 'completed'"
                [class.skipped]="square.status === 'skipped'"
                [class.in-progress]="square.status === 'in-progress'"
                [class.free-space]="square.id === 'free'"
                (click)="cycleStatus(rowIdx, colIdx)"
                (press)="showDetails(square)"
              >
                @if (square.parkItem.imageUrl) {
                  <img
                    [src]="square.parkItem.imageUrl"
                    [alt]="square.parkItem.name"
                    class="square-image"
                    loading="lazy"
                    (error)="onImageError($event)"
                  />
                } @else {
                  <div class="placeholder-icon">
                    {{ getTypeIcon(square.parkItem.type) }}
                  </div>
                }
                <span class="square-name">{{ square.parkItem.name }}</span>
                @if (square.status !== 'unmarked') {
                  <div class="status-badge">
                    @switch (square.status) {
                      @case ('completed') {
                        <span class="badge-icon completed">✓</span>
                      }
                      @case ('skipped') {
                        <span class="badge-icon skipped">✕</span>
                      }
                      @case ('in-progress') {
                        <span class="badge-icon in-progress">⏳</span>
                      }
                    }
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Affiliate Banner (rotates every 60s, appears after 30s delay) -->
        <app-affiliate-banner></app-affiliate-banner>

        <div class="action-buttons">
          @if ((card()?.bingos || 0) > 0) {
            <ion-button expand="block" routerLink="/victory" color="success">
              <ion-icon name="trophy" slot="start"></ion-icon>
              View Victory ({{ card()?.bingos }} BINGO{{ (card()?.bingos || 0) > 1 ? 's' : '' }})
            </ion-button>
          }
          <ion-button expand="block" (click)="newCard()" fill="outline">
            <ion-icon name="refresh" slot="start"></ion-icon>
            New Card
          </ion-button>
        </div>
      } @else {
        <div class="no-card">
          <ion-text color="medium">
            <p>No active game. Go back and select a park!</p>
          </ion-text>
          <ion-button routerLink="/">
            <ion-icon name="home" slot="start"></ion-icon>
            Choose Park
          </ion-button>
        </div>
      }

      <!-- Help Modal -->
      <app-help-modal [isOpen]="showHelp()" (closed)="showHelp.set(false)"></app-help-modal>

      <!-- Item Details Modal -->
      <ion-modal [isOpen]="showModal()" (didDismiss)="closeModal()">
        <ng-template>
          @if (selectedSquare(); as square) {
            <ion-header>
              <ion-toolbar>
                <ion-title>{{ square.parkItem.name }}</ion-title>
                <ion-buttons slot="end">
                  <ion-button (click)="closeModal()">Done</ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content class="ion-padding">
              @if (square.parkItem.imageUrl) {
                <img
                  [src]="square.parkItem.imageUrl"
                  [alt]="square.parkItem.name"
                  class="modal-image"
                />
              }
              <ion-list>
                <ion-item>
                  <ion-label>
                    <h3>Description</h3>
                    <p>{{ square.parkItem.description }}</p>
                  </ion-label>
                </ion-item>
                @if (square.parkItem.waitTime) {
                  <ion-item>
                    <ion-label>
                      <h3>Typical Wait</h3>
                      <p>{{ square.parkItem.waitTime }} minutes</p>
                    </ion-label>
                  </ion-item>
                }
                @if (square.parkItem.heightRequirement) {
                  <ion-item>
                    <ion-label>
                      <h3>Height Requirement</h3>
                      <p>{{ square.parkItem.heightRequirement }}</p>
                    </ion-label>
                  </ion-item>
                }
                @if (square.parkItem.bestTime) {
                  <ion-item>
                    <ion-label>
                      <h3>Best Time to Visit</h3>
                      <p>{{ square.parkItem.bestTime }}</p>
                    </ion-label>
                  </ion-item>
                }
                @if (square.parkItem.categories.length) {
                  <ion-item>
                    <ion-label>
                      <h3>Categories</h3>
                      <div class="chip-container">
                        @for (cat of square.parkItem.categories; track cat) {
                          <ion-chip size="small">{{ cat }}</ion-chip>
                        }
                      </div>
                    </ion-label>
                  </ion-item>
                }
              </ion-list>
            </ion-content>
          }
        </ng-template>
      </ion-modal>
    </ion-content>

    <ion-footer>
      <ion-toolbar class="footer-toolbar">
        <ion-text color="medium" class="game-code">
          Game: {{ gameCode() }}
        </ion-text>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [
    `
      .stats-bar {
        display: flex;
        justify-content: center;
        gap: 24px;
        padding: 12px;
        background: var(--ion-card-background);
        border-radius: 12px;
        margin-bottom: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .stat {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 600;
        font-size: 0.95rem;

        ion-icon {
          font-size: 1.2rem;
        }
      }

      .bingo-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 4px;
        padding: 8px;
        background: var(--ion-card-background);
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }

      .bingo-square {
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        border-radius: 8px;
        padding: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
        background: var(--ion-color-light);
        border: 2px solid transparent;

        &:active {
          transform: scale(0.95);
        }

        &.completed {
          background: rgba(34, 197, 94, 0.2);
          border-color: var(--ion-color-success);
        }

        &.skipped {
          background: rgba(239, 68, 68, 0.2);
          border-color: var(--ion-color-danger);
          opacity: 0.7;
        }

        &.in-progress {
          background: rgba(234, 179, 8, 0.2);
          border-color: var(--ion-color-warning);
        }

        &.free-space {
          background: linear-gradient(
            135deg,
            var(--ion-color-primary),
            var(--ion-color-secondary)
          );
          border-color: var(--ion-color-primary);

          .square-name {
            color: white;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          }
        }
      }

      .square-image {
        width: 100%;
        height: 55%;
        object-fit: cover;
        border-radius: 4px;
      }

      .placeholder-icon {
        width: 100%;
        height: 55%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
        border-radius: 4px;
      }

      .square-name {
        font-size: 0.55rem;
        font-weight: 600;
        text-align: center;
        line-height: 1.1;
        margin-top: 2px;
        color: var(--ion-text-color);
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        flex: 1;
      }

      .status-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);

        .badge-icon {
          font-size: 11px;
          font-weight: bold;

          &.completed {
            color: var(--ion-color-success);
          }
          &.skipped {
            color: var(--ion-color-danger);
          }
          &.in-progress {
            color: var(--ion-color-warning);
          }
        }
      }

      .action-buttons {
        margin-top: 16px;
        padding: 0 8px;
      }

      .no-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 60vh;
        text-align: center;
        gap: 16px;
      }

      .modal-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 12px;
        margin-bottom: 16px;
      }

      .chip-container {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }

      .footer-toolbar {
        --background: transparent;
        --border-width: 0;
      }

      .game-code {
        display: block;
        text-align: center;
        font-size: 0.75rem;
        font-family: monospace;
        padding: 8px;
      }
    `,
  ],
})
export class PlayPage {
  private router = inject(Router);
  private bingoService = inject(BingoService);
  private soundService = inject(SoundService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  readonly card = this.bingoService.currentCard;
  readonly showModal = signal(false);
  readonly showHelp = signal(false);
  readonly selectedSquare = signal<BingoSquare | null>(null);
  private previousBingos = 0;

  readonly parkName = computed(() => {
    const parkId = this.card()?.parkId;
    if (!parkId) return 'Park Bingo';
    const park = this.bingoService.parks().find((p) => p.id === parkId);
    return park?.name || 'Park Bingo';
  });

  readonly completedCount = computed(() => {
    const card = this.card();
    if (!card) return 0;
    return card.squares.flat().filter((s) => s.status === 'completed').length;
  });

  readonly gameCode = computed(() => {
    const seed = this.card()?.seed;
    return seed ? seed.substring(0, 8).toUpperCase() : '';
  });

  constructor() {
    addIcons({
      home,
      share,
      refresh,
      checkmarkCircle,
      closeCircle,
      time,
      informationCircle,
      trophy,
      helpCircle,
    });

    // Watch for new bingos
    effect(() => {
      const card = this.card();
      if (card && card.bingos > this.previousBingos) {
        this.celebrateBingo();
      }
      this.previousBingos = card?.bingos || 0;
    });
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

  async cycleStatus(row: number, col: number) {
    const square = this.card()?.squares?.[row]?.[col];
    if (!square || square.id === 'free') return;

    const statuses: Array<BingoSquare['status']> = [
      'unmarked',
      'completed',
      'skipped',
      'in-progress',
    ];
    const currentIndex = statuses.indexOf(square.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const newStatus = statuses[nextIndex];

    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
      if (newStatus === 'completed') {
        await Haptics.notification({ type: NotificationType.Success });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    }

    // Sound effects
    if (newStatus === 'completed') {
      this.soundService.play('complete');
    } else {
      this.soundService.play('tap');
    }

    this.bingoService.updateSquareStatus(row, col, newStatus);
  }

  showDetails(square: BingoSquare) {
    this.selectedSquare.set(square);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.selectedSquare.set(null);
  }

  async celebrateBingo() {
    // Haptic feedback
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    }

    // Sound effect
    this.soundService.play('bingo');

    // Confetti animation
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#4f46e5', '#f59e0b', '#22c55e'],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#4f46e5', '#f59e0b', '#22c55e'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Show toast
    const toast = await this.toastController.create({
      message: '🎉 BINGO! You got a line!',
      duration: 3000,
      position: 'top',
      color: 'success',
      buttons: [
        {
          text: 'Share',
          handler: () => {
            this.shareCard();
          },
        },
      ],
    });
    await toast.present();
  }

  async newCard() {
    const alert = await this.alertController.create({
      header: 'Start New Game?',
      message: 'This will replace your current card. Are you sure?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'New Card',
          handler: () => {
            const parkId = this.card()?.parkId;
            if (parkId) {
              this.bingoService.generateCard(parkId);
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async shareCard() {
    const { Share } = await import('@capacitor/share');
    const card = this.card();

    if (!card) return;

    const parkName = this.parkName();
    const gameCode = card.seed.substring(0, 8).toUpperCase();
    const bingos = card.bingos;
    const completed = this.completedCount();

    const text = `🎯 Park Bingo at ${parkName}!\n\n🏆 ${bingos} BINGOs achieved\n✅ ${completed}/25 squares completed\n\n📋 Game Code: ${gameCode}\n\nDownload Park Bingo to play!`;

    try {
      await Share.share({
        title: 'My Park Bingo Card',
        text,
        dialogTitle: 'Share your Park Bingo progress',
      });
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', error);
    }
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}

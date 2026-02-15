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
  IonText,
  IonBackButton,
  IonModal,
  IonPopover,
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
  ellipsisVertical,
  fingerPrint,
} from 'ionicons/icons';
import confetti from 'canvas-confetti';
import { AffiliateBannerComponent } from '../../components/affiliate-banner/affiliate-banner.component';
import { HelpModalComponent } from '../../components/help-modal/help-modal.component';
import { BingoGridComponent } from '../../components/bingo-grid/bingo-grid.component';

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
    IonText,
    IonBackButton,
    IonModal,
    IonPopover,
    IonList,
    IonItem,
    IonLabel,
    IonChip,
    AffiliateBannerComponent,
    HelpModalComponent,
    BingoGridComponent,
  ],
  templateUrl: './play.page.html',
  styleUrls: ['./play.page.scss'],
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
    if (!parkId) return 'Park Pursuit Bingo';
    const park = this.bingoService.parks().find((p) => p.id === parkId);
    return park?.name || 'Park Pursuit Bingo';
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
      ellipsisVertical,
      fingerPrint,
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

  async cycleStatus(row: number, col: number) {
    const square = this.card()?.squares?.[row]?.[col];
    if (!square) return;

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

    const text = `🎯 Park Pursuit Bingo at ${parkName}!\n\n🏆 ${bingos} BINGOs achieved\n✅ ${completed}/25 squares completed\n\n📋 Game Code: ${gameCode}\n\nDownload Park Pursuit Bingo to play!\nhttps://park-bingo.pages.dev`;

    try {
      await Share.share({
        title: 'My Park Pursuit Bingo Card',
        text,
        url: 'https://park-bingo.pages.dev',
        dialogTitle: 'Share your Park Pursuit Bingo progress',
      });
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', error);
    }
  }

}

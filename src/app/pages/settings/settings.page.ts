import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonIcon,
  IonButtons,
  IonBackButton,
  IonNote,
  IonItemGroup,
  IonItemDivider,
  AlertController,
} from '@ionic/angular/standalone';
import { ThemeService } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { ParksDataService } from '../../services/parks-data.service';
import { addIcons } from 'ionicons';
import {
  moon,
  informationCircle,
  trash,
  heart,
  logoGithub,
  mail,
  star,
  statsChart,
  volumeHigh,
  refresh,
  cart,
  images,
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonIcon,
    IonButtons,
    IonBackButton,
    IonNote,
    IonItemGroup,
    IonItemDivider,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list inset>
        <ion-item-group>
          <ion-item-divider>
            <ion-label>Appearance</ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-icon name="moon" slot="start" color="primary"></ion-icon>
            <ion-label>Dark Mode</ion-label>
            <ion-toggle
              [checked]="themeService.isDarkMode()"
              (ionChange)="themeService.toggleDarkMode()"
            ></ion-toggle>
          </ion-item>
          <ion-item>
            <ion-icon name="volume-high" slot="start" color="tertiary"></ion-icon>
            <ion-label>Sound Effects</ion-label>
            <ion-toggle
              [checked]="soundService.isEnabled()"
              (ionChange)="soundService.toggleSound()"
            ></ion-toggle>
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Game</ion-label>
          </ion-item-divider>
          <ion-item button routerLink="/stats" detail>
            <ion-icon name="stats-chart" slot="start" color="success"></ion-icon>
            <ion-label>Statistics</ion-label>
          </ion-item>
          <ion-item button routerLink="/products" detail>
            <ion-icon name="cart" slot="start" color="warning"></ion-icon>
            <ion-label>Recommended Products</ion-label>
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Data</ion-label>
          </ion-item-divider>
          <ion-item button routerLink="/attractions" detail>
            <ion-icon name="images" slot="start" color="secondary"></ion-icon>
            <ion-label>
              <h2>Attractions Browser</h2>
              <p>View all attractions and images</p>
            </ion-label>
          </ion-item>
          <ion-item button (click)="refreshParksData()">
            <ion-icon name="refresh" slot="start" color="primary"></ion-icon>
            <ion-label>
              <h2>Refresh Parks Data</h2>
              <p>Clear cache and reload fresh data</p>
            </ion-label>
          </ion-item>
          <ion-item button (click)="clearData()">
            <ion-icon name="trash" slot="start" color="danger"></ion-icon>
            <ion-label color="danger">Clear All Game Data</ion-label>
          </ion-item>
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>About</ion-label>
          </ion-item-divider>
          <ion-item>
            <ion-icon
              name="information-circle"
              slot="start"
              color="primary"
            ></ion-icon>
            <ion-label>
              <h2>Park Pursuit Bingo</h2>
              <p>Version 1.0.0</p>
            </ion-label>
          </ion-item>
          <ion-item button href="mailto:michael@walkingriver.com">
            <ion-icon name="mail" slot="start" color="tertiary"></ion-icon>
            <ion-label>Contact Support</ion-label>
          </ion-item>
          <ion-item button (click)="rateApp()">
            <ion-icon name="star" slot="start" color="warning"></ion-icon>
            <ion-label>Rate This App</ion-label>
          </ion-item>
        </ion-item-group>
      </ion-list>

      <div class="disclaimer-section">
        <ion-note>
          <p class="disclaimer">
            <strong>Disclaimer:</strong> Park Pursuit Bingo is not affiliated with,
            endorsed by, or sponsored by The Walt Disney Company or its
            subsidiaries. All park names, attraction names, and related content
            are used for informational purposes only.
          </p>
        </ion-note>
      </div>

      <div class="credits">
        <p>Made with <ion-icon name="heart" color="danger"></ion-icon> for Disney fans</p>
        <p class="version">© 2026 Michael D. Callaghan</p>
      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-list {
        margin-top: 16px;
      }

      .disclaimer-section {
        padding: 16px;
        margin: 16px;
        background: var(--ion-color-light);
        border-radius: 8px;
      }

      .disclaimer {
        font-size: 0.8rem;
        color: var(--ion-color-medium);
        line-height: 1.4;
      }

      .credits {
        text-align: center;
        padding: 24px;
        color: var(--ion-color-medium);

        ion-icon {
          vertical-align: middle;
        }

        .version {
          font-size: 0.75rem;
          margin-top: 8px;
        }
      }
    `,
  ],
})
export class SettingsPage {
  themeService = inject(ThemeService);
  soundService = inject(SoundService);
  private parksDataService = inject(ParksDataService);
  private alertController = inject(AlertController);

  constructor() {
    addIcons({
      moon,
      informationCircle,
      trash,
      heart,
      logoGithub,
      mail,
      star,
      statsChart,
      volumeHigh,
      cart,
      refresh,
      images,
    });
  }

  async refreshParksData() {
    const alert = await this.alertController.create({
      header: 'Refresh Parks Data?',
      message:
        'This will clear the cached parks data and reload fresh data with updated images. Your saved games will not be affected.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Refresh',
          handler: async () => {
            await this.parksDataService.clearCache();
            await this.parksDataService.loadParksData();
            
            const successAlert = await this.alertController.create({
              header: 'Success',
              message: 'Parks data refreshed successfully! Images should now load.',
              buttons: ['OK'],
            });
            await successAlert.present();
          },
        },
      ],
    });
    await alert.present();
  }

  async clearData() {
    const alert = await this.alertController.create({
      header: 'Clear All Data?',
      message:
        'This will delete all your saved games and progress. This cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear',
          role: 'destructive',
          handler: () => {
            localStorage.removeItem('park-bingo-cards');
            window.location.reload();
          },
        },
      ],
    });
    await alert.present();
  }

  async rateApp() {
    // Will link to app stores when published
    const alert = await this.alertController.create({
      header: 'Rate Park Pursuit Bingo',
      message: 'App store links will be available after launch!',
      buttons: ['OK'],
    });
    await alert.present();
  }
}

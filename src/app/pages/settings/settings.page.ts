import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
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
import { addIcons } from 'ionicons';
import {
  moon,
  informationCircle,
  trash,
  heart,
  logoGithub,
  mail,
  star,
} from 'ionicons/icons';

@Component({
  selector: 'app-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
        </ion-item-group>

        <ion-item-group>
          <ion-item-divider>
            <ion-label>Data</ion-label>
          </ion-item-divider>
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
              <h2>Park Bingo</h2>
              <p>Version 1.0.0</p>
            </ion-label>
          </ion-item>
          <ion-item button href="mailto:support@parkbingo.app">
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
            <strong>Disclaimer:</strong> Park Bingo is not affiliated with,
            endorsed by, or sponsored by The Walt Disney Company or its
            subsidiaries. All park names, attraction names, and related content
            are used for informational purposes only.
          </p>
        </ion-note>
      </div>

      <div class="credits">
        <p>Made with <ion-icon name="heart" color="danger"></ion-icon> for Disney fans</p>
        <p class="version">© 2026 [YOUR COMPANY NAME]</p>
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
    });
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
      header: 'Rate Park Bingo',
      message: 'App store links will be available after launch!',
      buttons: ['OK'],
    });
    await alert.present();
  }
}

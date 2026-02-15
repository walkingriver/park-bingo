import { Component, OnInit, inject } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { RotateDeviceComponent } from './components/rotate-device/rotate-device.component';

@Component({
  selector: 'app-root',
  imports: [IonApp, IonRouterOutlet, RotateDeviceComponent],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
      <app-rotate-device />
    </ion-app>
  `,
})
export class App implements OnInit {
  async ngOnInit() {
    if (Capacitor.isNativePlatform()) {
      await this.initializeApp();
    }
  }

  private async initializeApp() {
    try {
      // Set status bar style
      await StatusBar.setStyle({ style: Style.Dark });

      // Hide splash screen after app is ready
      await SplashScreen.hide();
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }
}

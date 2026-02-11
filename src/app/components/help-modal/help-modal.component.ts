import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircle, checkmarkCircle, close, time, helpCircle } from 'ionicons/icons';

@Component({
  selector: 'app-help-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
  template: `
    <ion-modal [isOpen]="isOpen()" (didDismiss)="closed.emit()">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>How to Play</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closed.emit()">Done</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div class="help-section">
            <h2>Welcome to Park Bingo!</h2>
            <p>
              Turn your Disney park visit into an exciting scavenger hunt.
              Complete 5 squares in a row to get BINGO!
            </p>
          </div>

          <div class="help-section">
            <h3>Getting Started</h3>
            <ol>
              <li>Choose a park from the home screen</li>
              <li>You'll get a unique 5x5 BINGO card</li>
              <li>Tap squares as you experience attractions</li>
              <li>Get 5 in a row (horizontal, vertical, or diagonal)</li>
              <li>Celebrate your BINGO and share with friends!</li>
            </ol>
          </div>

          <div class="help-section">
            <h3>Square States</h3>
            <p>Tap a square to cycle through states:</p>

            <ion-list>
              <ion-item>
                <div class="state-demo unmarked" slot="start"></div>
                <ion-label>
                  <h4>Not Visited</h4>
                  <p>You haven't experienced this yet</p>
                </ion-label>
              </ion-item>

              <ion-item>
                <div class="state-demo completed" slot="start">
                  <span>✓</span>
                </div>
                <ion-label>
                  <h4>Completed</h4>
                  <p>You've done it! This counts toward BINGO</p>
                </ion-label>
              </ion-item>

              <ion-item>
                <div class="state-demo in-progress" slot="start">
                  <span>⏳</span>
                </div>
                <ion-label>
                  <h4>In Progress</h4>
                  <p>Currently in line or watching</p>
                </ion-label>
              </ion-item>

              <ion-item>
                <div class="state-demo skipped" slot="start">
                  <span>✕</span>
                </div>
                <ion-label>
                  <h4>Skipped</h4>
                  <p>Closed or not interested (doesn't count)</p>
                </ion-label>
              </ion-item>

              <ion-item>
                <div class="state-demo free" slot="start">
                  <span>🏰</span>
                </div>
                <ion-label>
                  <h4>Free Space</h4>
                  <p>Center square - always counts!</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </div>

          <div class="help-section">
            <h3>Tips</h3>
            <ul>
              <li><strong>Long-press</strong> any square to see attraction details</li>
              <li>The <strong>game code</strong> lets you recreate the same card</li>
              <li>Works <strong>offline</strong> - no Wi-Fi needed in the park!</li>
              <li><strong>Share</strong> your victories using the share button</li>
            </ul>
          </div>

          <div class="help-section">
            <h3>What Counts as BINGO?</h3>
            <p>Any 5 squares in a row:</p>
            <div class="bingo-examples">
              <div class="bingo-example">
                <div class="mini-grid horizontal">
                  <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell lit"></div><div class="cell lit"></div><div class="cell lit"></div><div class="cell lit"></div><div class="cell lit"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                </div>
                <span>Horizontal</span>
              </div>
              <div class="bingo-example">
                <div class="mini-grid vertical">
                  <div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div>
                </div>
                <span>Vertical</span>
              </div>
              <div class="bingo-example">
                <div class="mini-grid diagonal">
                  <div class="cell lit"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell lit"></div><div class="cell"></div>
                  <div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell"></div><div class="cell lit"></div>
                </div>
                <span>Diagonal</span>
              </div>
            </div>
          </div>

          <div class="help-section disclaimer">
            <p>
              <strong>Note:</strong> Park Bingo is not affiliated with The Walt Disney Company.
              Attraction availability may vary.
            </p>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      .help-section {
        margin-bottom: 24px;

        h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--ion-color-primary);
        }

        h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 12px;
          color: var(--ion-text-color);
        }

        p {
          color: var(--ion-color-medium-shade);
          line-height: 1.6;
        }

        ol,
        ul {
          padding-left: 20px;
          color: var(--ion-color-medium-shade);

          li {
            margin-bottom: 8px;
            line-height: 1.5;
          }
        }
      }

      .state-demo {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;

        &.unmarked {
          background: #e0e7ff;
          border: 2px solid #4f46e5;
        }

        &.completed {
          background: rgba(34, 197, 94, 0.3);
          border: 2px solid #22c55e;
          color: #22c55e;
        }

        &.in-progress {
          background: rgba(234, 179, 8, 0.3);
          border: 2px solid #eab308;
        }

        &.skipped {
          background: rgba(239, 68, 68, 0.3);
          border: 2px solid #ef4444;
          color: #ef4444;
        }

        &.free {
          background: linear-gradient(135deg, #4f46e5, #f59e0b);
          border: 2px solid #f59e0b;
        }
      }

      ion-item h4 {
        font-weight: 600;
        font-size: 0.95rem;
      }

      ion-item p {
        font-size: 0.85rem;
      }

      .bingo-examples {
        display: flex;
        justify-content: space-around;
        margin-top: 16px;
        gap: 16px;
      }

      .bingo-example {
        text-align: center;

        span {
          display: block;
          margin-top: 8px;
          font-size: 0.8rem;
          color: var(--ion-color-medium);
        }
      }

      .mini-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 2px;
        width: 60px;

        .cell {
          width: 10px;
          height: 10px;
          background: #e0e7ff;
          border-radius: 2px;

          &.lit {
            background: #22c55e;
          }
        }
      }

      .disclaimer {
        background: var(--ion-color-light);
        padding: 12px;
        border-radius: 8px;

        p {
          font-size: 0.8rem;
          margin: 0;
        }
      }
    `,
  ],
})
export class HelpModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly closed = output<void>();

  constructor() {
    addIcons({ closeCircle, checkmarkCircle, close, time, helpCircle });
  }
}

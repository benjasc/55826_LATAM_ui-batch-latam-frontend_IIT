import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Tarjeta de carga con spinner y mensaje (mismo tamaño y forma que los modales). */
@Component({
  selector: 'app-loading-card',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-card" role="status" aria-live="polite">
      <mat-progress-spinner mode="indeterminate" diameter="48" strokeWidth="4" />
      <p class="message">{{ message() }}</p>
      @if (hint()) {
        <p class="hint">{{ hint() }}</p>
      }
    </div>
  `,
  styleUrl: './loading-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingCard {
  readonly message = input('Cargando…');
  readonly hint = input('');
}

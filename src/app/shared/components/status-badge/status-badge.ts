import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { statusTone } from '@core/models/batch-process.model';

/**
 * Etiqueta de estado de un proceso batch.
 * El texto es el que envía el API (status); el color se elige según el código (statusCode).
 */
@Component({
  selector: 'app-status-badge',
  template: `<span [class]="'badge badge--' + tone()">{{ label() || 'Desconocido' }}</span>`,
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  /** Código de estado (statusCode), por ejemplo "001". */
  readonly status = input.required<string>();
  /** Nombre del estado (status), por ejemplo "PENDIENTE". */
  readonly label = input.required<string>();

  protected readonly tone = computed(() => statusTone(this.status()));
}

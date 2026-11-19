import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ProcessStatus, STATUS_LABEL, VISIBLE_STATUS } from '@core/models/batch-process.model';

/** Etiqueta de color para el estado de un proceso batch. */
@Component({
  selector: 'app-status-badge',
  template: `<span [class]="'badge badge--' + visible()">{{ label() }}</span>`,
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<ProcessStatus>();

  /** Si el backend envía un código desconocido se muestra "Desconocido" en gris. */
  private readonly known = computed(() => VISIBLE_STATUS[this.status()] ?? null);
  protected readonly visible = computed(() => this.known() ?? 'validation');
  protected readonly label = computed(() => {
    const known = this.known();
    return known ? STATUS_LABEL[known] : 'Desconocido';
  });
}

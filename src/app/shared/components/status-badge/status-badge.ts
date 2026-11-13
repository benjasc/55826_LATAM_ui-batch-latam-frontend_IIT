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

  protected readonly visible = computed(() => VISIBLE_STATUS[this.status()]);
  protected readonly label = computed(() => STATUS_LABEL[this.visible()]);
}

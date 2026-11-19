import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';

import {
  BatchProcess,
  canDownloadObservations,
  canDownloadOutput,
} from '@core/models/batch-process.model';
import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { saveFile, withSuffix } from '@shared/utils/save-file';

/** Fila de la tabla: proceso + número correlativo y permisos de descarga ya calculados. */
interface WorkboardRow extends BatchProcess {
  number: number;
  outputEnabled: boolean;
  observationsEnabled: boolean;
}

@Component({
  selector: 'app-workboard-page',
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
    StatusBadge,
  ],
  templateUrl: './workboard-page.html',
  styleUrl: './workboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkboardPage {
  private readonly processService = inject(BatchProcessService);
  private readonly context = inject(ContextService);

  protected readonly displayedColumns = [
    'number',
    'fileName',
    'recordsQuantity',
    'createdAt',
    'status',
    'output',
    'observations',
  ];
  protected readonly pageSizeOptions = [15, 30, 50];

  /**
   * Procesos del usuario (el backend los filtra por el usuario del token).
   * Se recarga sola al cambiar la organización u orquestación.
   */
  protected readonly processes = rxResource({
    params: () => {
      const organization = this.context.organization();
      const orchestration = this.context.orchestration();
      return organization && orchestration
        ? { organization: organization.name, orchestration: orchestration.name }
        : undefined;
    },
    stream: ({ params }) =>
      params ? this.processService.getProcesses(params.organization, params.orchestration) : of([]),
  });

  /** Más recientes primero; el número correlativo más alto es el más reciente. */
  protected readonly rows = computed<WorkboardRow[]>(() => {
    const list = this.processes.hasValue() ? this.processes.value() : [];
    return [...list]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
      .map((process, index, sorted) => ({
        ...process,
        number: sorted.length - index,
        outputEnabled: canDownloadOutput(process),
        observationsEnabled: canDownloadObservations(process),
      }));
  });

  protected readonly dataSource = new MatTableDataSource<WorkboardRow>([]);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.rows();
    });
    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });
  }

  protected refresh(): void {
    this.processes.reload();
  }

  protected downloadOutput(row: WorkboardRow): void {
    this.processService
      .downloadOutput(row)
      .subscribe((blob) => saveFile(blob, row.successFileName ?? withSuffix(row.fileName, 'salida', 'csv')));
  }

  protected downloadObservations(row: WorkboardRow): void {
    this.processService
      .downloadObservations(row)
      .subscribe((blob) => saveFile(blob, row.errorFileName ?? withSuffix(row.fileName, 'observaciones', 'txt')));
  }
}

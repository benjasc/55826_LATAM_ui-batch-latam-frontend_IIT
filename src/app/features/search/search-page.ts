import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';

import { BatchProcess } from '@core/models/batch-process.model';
import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { UserService } from '@core/services/user.service';
import { StatusBadge } from '@shared/components/status-badge/status-badge';
import { MAX_RANGE_DAYS, dateRangeValidator } from './date-range.validator';

/** Filtros confirmados al presionar Buscar. */
interface SearchFilters {
  startDate: Date;
  endDate: Date;
  userId: number;
}

interface SearchRow extends BatchProcess {
  number: number;
}

@Component({
  selector: 'app-search-page',
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    StatusBadge,
  ],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPage {
  private readonly processService = inject(BatchProcessService);
  private readonly userService = inject(UserService);
  private readonly context = inject(ContextService);

  protected readonly maxRangeDays = MAX_RANGE_DAYS;
  protected readonly today = new Date();
  protected readonly isAdmin = this.userService.isAdmin;
  protected readonly displayedColumns = ['number', 'fileName', 'processDate', 'status', 'recordsQuantity'];
  protected readonly pageSizeOptions = [15, 30, 50];

  protected readonly form = new FormGroup(
    {
      startDate: new FormControl<Date | null>(null, Validators.required),
      endDate: new FormControl<Date | null>(null, Validators.required),
      userId: new FormControl<number>(this.userService.currentUser().id, { nonNullable: true }),
    },
    { validators: dateRangeValidator() },
  );

  /** Usuarios de la organización activa (solo se cargan para administradores). */
  protected readonly users = rxResource({
    params: () => (this.isAdmin() ? this.context.organization()?.id : undefined),
    stream: ({ params }) => (params ? this.userService.getOrganizationUsers(params) : of([])),
  });

  /** null = todavía no se ha buscado (o se presionó Limpiar). */
  private readonly filters = signal<SearchFilters | null>(null);
  protected readonly searched = computed(() => this.filters() !== null);

  /** Se vuelve a ejecutar al buscar y al cambiar de organización/orquestación. */
  protected readonly results = rxResource({
    params: () => {
      const filters = this.filters();
      const organization = this.context.organization();
      const orchestration = this.context.orchestration();
      return filters && organization && orchestration
        ? { ...filters, organizationId: organization.id, orchestrationId: orchestration.id }
        : undefined;
    },
    stream: ({ params }) => (params ? this.processService.searchProcesses(params) : of([])),
  });

  /** Orden cronológico: el No. 1 es el más antiguo del rango. */
  protected readonly rows = computed<SearchRow[]>(() => {
    const list = this.results.hasValue() ? this.results.value() : [];
    return [...list]
      .sort((a, b) => a.processDate.localeCompare(b.processDate))
      .map((process, index) => ({ ...process, number: index + 1 }));
  });

  protected readonly dataSource = new MatTableDataSource<SearchRow>([]);
  private readonly paginator = viewChild(MatPaginator);

  constructor() {
    effect(() => {
      this.dataSource.data = this.rows();
    });
    effect(() => {
      this.dataSource.paginator = this.paginator() ?? null;
    });
  }

  protected search(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { startDate, endDate, userId } = this.form.getRawValue();
    this.filters.set({ startDate: startDate!, endDate: endDate!, userId });
  }

  protected clear(): void {
    this.form.reset();
    this.filters.set(null);
  }
}

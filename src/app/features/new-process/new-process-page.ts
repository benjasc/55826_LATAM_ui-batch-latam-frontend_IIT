import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { BatchProcessService } from '@core/services/batch-process.service';
import { ContextService } from '@core/services/context.service';
import { NotificationService } from '@core/services/notification.service';
import { countCsvRecords } from './count-csv-records';
import { formatFileSize, validateCsvFile } from './csv-file.validator';

@Component({
  selector: 'app-new-process-page',
  imports: [DecimalPipe, RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './new-process-page.html',
  styleUrl: './new-process-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProcessPage {
  private readonly processService = inject(BatchProcessService);
  private readonly context = inject(ContextService);
  private readonly notification = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly file = signal<File | null>(null);
  /** Registros del CSV, contados en el navegador (null mientras no hay archivo o se está contando). */
  protected readonly recordsQuantity = signal<number | null>(null);
  protected readonly counting = signal(false);
  protected readonly fileError = signal<string | null>(null);
  protected readonly uploading = signal(false);

  /** Evita que el conteo de un archivo anterior pise al del archivo recién elegido. */
  private selectionId = 0;

  protected readonly fileSize = computed(() => {
    const file = this.file();
    return file ? formatFileSize(file.size) : '';
  });
  protected readonly canFinish = computed(
    () => !!this.file() && this.recordsQuantity() !== null && !this.counting() && !this.uploading(),
  );

  protected readonly requirements = [
    'El archivo no debe venir vacío.',
    'El archivo debe estar en formato csv.',
    'El nombre del archivo debe tener más de 3 letras, además de su extensión.',
  ];

  protected openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    // Limpia el input para poder volver a elegir el mismo archivo.
    input.value = '';
    if (!selected) {
      return;
    }

    const selection = ++this.selectionId;
    this.recordsQuantity.set(null);

    const error = validateCsvFile(selected);
    if (error) {
      this.rejectFile(error);
      return;
    }

    this.fileError.set(null);
    this.file.set(selected);
    this.counting.set(true);
    try {
      const records = await countCsvRecords(selected);
      if (selection !== this.selectionId) {
        return; // El usuario ya eligió otro archivo.
      }
      if (records === 0) {
        this.rejectFile('El archivo no debe venir vacío.');
        return;
      }
      this.recordsQuantity.set(records);
    } catch {
      if (selection === this.selectionId) {
        this.rejectFile('No fue posible leer el archivo.');
      }
    } finally {
      if (selection === this.selectionId) {
        this.counting.set(false);
      }
    }
  }

  protected removeFile(): void {
    this.selectionId++;
    this.file.set(null);
    this.recordsQuantity.set(null);
    this.counting.set(false);
    this.fileError.set(null);
  }

  protected finish(): void {
    const file = this.file();
    const records = this.recordsQuantity();
    const organization = this.context.organization();
    const orchestration = this.context.orchestration();
    if (!file || records === null || !organization || !orchestration || !this.canFinish()) {
      return;
    }

    this.uploading.set(true);
    this.processService
      .createProcess(organization.name, orchestration.name, file.name, records)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: () => {
          this.notification.success('El proceso se ha creado con éxito.');
          void this.router.navigate(['/workboard']);
        },
        error: () => this.notification.error('No fue posible crear el proceso. Intente nuevamente.'),
      });
  }

  private rejectFile(message: string): void {
    this.fileError.set(message);
    this.file.set(null);
    this.recordsQuantity.set(null);
    this.counting.set(false);
  }
}

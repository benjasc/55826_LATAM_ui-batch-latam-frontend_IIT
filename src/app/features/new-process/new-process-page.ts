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
import { UserService } from '@core/services/user.service';
import { formatFileSize, validateCsvFile } from './csv-file.validator';

@Component({
  selector: 'app-new-process-page',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressBarModule, MatTooltipModule],
  templateUrl: './new-process-page.html',
  styleUrl: './new-process-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProcessPage {
  private readonly processService = inject(BatchProcessService);
  private readonly context = inject(ContextService);
  private readonly notification = inject(NotificationService);
  private readonly user = inject(UserService);
  private readonly router = inject(Router);

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  protected readonly file = signal<File | null>(null);
  protected readonly fileError = signal<string | null>(null);
  protected readonly uploading = signal(false);

  protected readonly fileSize = computed(() => {
    const file = this.file();
    return file ? formatFileSize(file.size) : '';
  });
  protected readonly canFinish = computed(() => !!this.file() && !this.uploading());

  protected readonly requirements = [
    'El archivo no debe venir vacío.',
    'El archivo debe estar en formato csv.',
    'El nombre del archivo debe tener más de 3 letras, además de su extensión.',
  ];

  protected openFilePicker(): void {
    this.fileInput().nativeElement.click();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selected = input.files?.[0] ?? null;
    // Limpia el input para poder volver a elegir el mismo archivo.
    input.value = '';
    if (!selected) {
      return;
    }

    const error = validateCsvFile(selected);
    this.fileError.set(error);
    this.file.set(error ? null : selected);
  }

  protected removeFile(): void {
    this.file.set(null);
    this.fileError.set(null);
  }

  protected finish(): void {
    const file = this.file();
    const organization = this.context.organization();
    const orchestration = this.context.orchestration();
    if (!file || !organization || !orchestration || this.uploading()) {
      return;
    }

    this.uploading.set(true);
    this.processService
      .createProcess(organization.id, orchestration.id, this.user.currentUser().id, file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: () => {
          this.notification.success('El archivo se ha cargado con éxito.');
          void this.router.navigate(['/workboard']);
        },
        error: () => this.notification.error('No fue posible cargar el archivo. Intente nuevamente.'),
      });
  }
}

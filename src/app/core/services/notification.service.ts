import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Avisos breves (toasts) de éxito o error en la parte superior de la pantalla. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);

  success(message: string): void {
    this.show(message, 'snack-success');
  }

  error(message: string): void {
    this.show(message, 'snack-error', 8000);
  }

  private show(message: string, panelClass: string, duration = 5000): void {
    this.snackBar.open(message, 'Cerrar', {
      duration,
      panelClass,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }
}

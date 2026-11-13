import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

/** Página de error genérica. title/message llegan desde el `data` de la ruta. */
@Component({
  selector: 'app-error-page',
  imports: [RouterLink, MatButtonModule],
  templateUrl: './error-page.html',
  styleUrl: './error-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPage {
  readonly title = input('¡Página no encontrada!');
  readonly message = input('La página que busca no existe.');
}

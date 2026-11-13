import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { ContextService } from '@core/services/context.service';
import {
  ContextSelectorService,
  organizationsErrorMessage,
} from '@features/context-selector/context-selector.service';
import { ErrorPage } from '@features/error/error-page';
import { Header } from '@layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, ErrorPage, MatButtonModule, MatProgressBarModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly contextSelector = inject(ContextSelectorService);
  protected readonly context = inject(ContextService);

  /** true mientras se obtienen las organizaciones al iniciar. */
  protected readonly loading = signal(false);
  /** Mensaje de error si no se pudieron obtener las organizaciones. */
  protected readonly startupError = signal<string | null>(null);

  ngOnInit(): void {
    this.start();
  }

  /** Obtiene las organizaciones y abre el modal obligatorio de organización/orquestación. */
  protected start(): void {
    this.startupError.set(null);
    this.loading.set(true);
    this.contextSelector
      .open(false)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({ error: (error: unknown) => this.startupError.set(organizationsErrorMessage(error)) });
  }
}

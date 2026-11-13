import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';

import { ContextService } from '@core/services/context.service';
import {
  ContextSelectorService,
  organizationsErrorMessage,
} from '@features/context-selector/context-selector.service';
import { ErrorPage } from '@features/error/error-page';
import { Header } from '@layout/header/header';
import { LoadingCard } from '@shared/components/loading-card/loading-card';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, ErrorPage, LoadingCard, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly contextSelector = inject(ContextSelectorService);
  protected readonly context = inject(ContextService);

  /** true mientras se obtienen las organizaciones (al iniciar o al reabrir desde el header). */
  protected readonly loading = this.contextSelector.loading;
  /** Mensaje de error si no se pudieron obtener las organizaciones. */
  protected readonly startupError = signal<string | null>(null);

  ngOnInit(): void {
    this.start();
  }

  /** Obtiene las organizaciones y abre el modal obligatorio de organización/orquestación. */
  protected start(): void {
    this.startupError.set(null);
    this.contextSelector
      .open(false)
      .subscribe({ error: (error: unknown) => this.startupError.set(organizationsErrorMessage(error)) });
  }
}

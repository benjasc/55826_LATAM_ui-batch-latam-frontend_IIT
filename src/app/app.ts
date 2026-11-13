import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ContextService } from '@core/services/context.service';
import { ContextSelectorService } from '@features/context-selector/context-selector.service';
import { Header } from '@layout/header/header';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly contextSelector = inject(ContextSelectorService);
  protected readonly context = inject(ContextService);

  ngOnInit(): void {
    // Al iniciar, el usuario debe elegir organización y orquestación (modal obligatorio).
    this.contextSelector.open(false).subscribe();
  }
}

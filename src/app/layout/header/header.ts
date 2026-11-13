import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ContextService } from '@core/services/context.service';
import { NotificationService } from '@core/services/notification.service';
import {
  ContextSelectorService,
  organizationsErrorMessage,
} from '@features/context-selector/context-selector.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly contextSelector = inject(ContextSelectorService);
  private readonly notification = inject(NotificationService);
  protected readonly context = inject(ContextService);

  protected readonly navItems: NavItem[] = [
    { label: 'Pizarra de Trabajo', path: '/workboard', icon: 'work' },
    { label: 'Buscar Procesos', path: '/search', icon: 'find_in_page' },
  ];

  protected changeContext(): void {
    this.contextSelector
      .open(true)
      .subscribe({ error: (error: unknown) => this.notification.error(organizationsErrorMessage(error)) });
  }
}

import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { environment } from '@env/environment';
import { CurrentUser, Role, User } from '@core/models/user.model';

/** Usuarios de prueba de cada organización. El id 1 es el usuario actual. */
export const MOCK_USERS: User[] = [
  { id: 1, userId: 'usuario.demo', name: 'Usuario Demo' },
  { id: 2, userId: 'maria.gonzalez', name: 'María González' },
  { id: 3, userId: 'pedro.rojas', name: 'Pedro Rojas' },
];

@Injectable({ providedIn: 'root' })
export class UserService {
  /**
   * Usuario que inició sesión.
   * TODO: obtenerlo del backend con el token entregado por Liferay.
   */
  private readonly _currentUser = signal<CurrentUser>({
    ...MOCK_USERS[0],
    roles: environment.mockAdmin ? [Role.User, Role.Admin] : [Role.User],
  });

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAdmin = computed(() => this._currentUser().roles.includes(Role.Admin));

  /** Usuarios de una organización (para el selector del administrador). TODO: llamada HTTP. */
  getOrganizationUsers(organization: string): Observable<User[]> {
    void organization;
    return of(MOCK_USERS).pipe(delay(300));
  }
}

/** Roles de la aplicación (llegan desde Liferay / backend). */
export enum Role {
  User = 'LATAM_UI_BATCH_USER',
  Admin = 'LATAM_UI_BATCH_ADMIN',
}

/** Usuario de la aplicación. Tabla: batch_user */
export interface User {
  id: number;
  /** Identificador de login del usuario. */
  userId: string;
  name: string;
}

export interface CurrentUser extends User {
  roles: Role[];
}

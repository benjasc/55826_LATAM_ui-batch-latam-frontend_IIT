/**
 * Orquestación (modelo) asociada a una organización. Tabla: batch_orchestration.
 * El backend no envía id: el nombre es el identificador.
 */
export interface Orchestration {
  name: string;
}

/**
 * Organización a la que pertenece el usuario. Tabla: batch_organization.
 * El backend no envía id: el nombre es el identificador.
 */
export interface Organization {
  name: string;
  orchestrations: Orchestration[];
}

/** Respuesta de GET /ui-batch-latam-backend/api/organizations (un elemento). */
export interface OrganizationDto {
  name: string;
  orchestrations: { name: string }[] | null;
}

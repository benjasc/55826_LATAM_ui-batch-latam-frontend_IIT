/** Orquestación (modelo) asociada a una organización. Tabla: batch_orchestration */
export interface Orchestration {
  id: number;
  name: string;
}

/** Organización a la que pertenece el usuario. Tabla: batch_organization */
export interface Organization {
  id: number;
  name: string;
  orchestrations: Orchestration[];
}

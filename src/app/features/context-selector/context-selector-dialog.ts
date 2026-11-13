import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { Orchestration, Organization } from '@core/models/organization.model';
import { ContextService } from '@core/services/context.service';

export interface ContextSelectorDialogData {
  /** Solo organizaciones con al menos una orquestación (ver selectableOrganizations). */
  organizations: Organization[];
  /** true cuando el usuario reabre el modal: muestra el botón "Cancelar". */
  dismissible: boolean;
}

@Component({
  selector: 'app-context-selector-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './context-selector-dialog.html',
  styleUrl: './context-selector-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContextSelectorDialog {
  private readonly dialogRef = inject(MatDialogRef<ContextSelectorDialog, boolean>);
  private readonly context = inject(ContextService);
  protected readonly data = inject<ContextSelectorDialogData>(MAT_DIALOG_DATA);

  protected readonly form = new FormGroup({
    organization: new FormControl<Organization | null>(null, Validators.required),
    orchestration: new FormControl<Orchestration | null>(null, Validators.required),
  });

  private readonly selectedOrganization = toSignal(this.form.controls.organization.valueChanges, {
    initialValue: null,
  });

  protected readonly orchestrations = computed(() => this.selectedOrganization()?.orchestrations ?? []);

  /** Solo se muestra el selector si hay más de una opción (con una sola, se preselecciona). */
  protected readonly showOrganizationSelect = computed(() => this.data.organizations.length > 1);
  protected readonly showOrchestrationSelect = computed(() => this.orchestrations().length > 1);

  /** El backend no envía id: se compara por nombre. */
  protected readonly compareByName = (a: { name: string } | null, b: { name: string } | null): boolean =>
    a?.name === b?.name;

  constructor() {
    // Al cambiar la organización: limpiar la orquestación y autoseleccionar si hay solo una.
    this.form.controls.organization.valueChanges.pipe(takeUntilDestroyed()).subscribe((organization) => {
      const orchestrations = organization?.orchestrations ?? [];
      this.form.controls.orchestration.setValue(orchestrations.length === 1 ? orchestrations[0] : null);
    });

    this.preselect();
  }

  protected accept(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { organization, orchestration } = this.form.getRawValue();
    this.context.setContext(organization!, orchestration!);
    this.dialogRef.close(true);
  }

  protected cancel(): void {
    this.dialogRef.close(false);
  }

  /** Precarga el contexto actual (al reabrir) o la única organización disponible. */
  private preselect(): void {
    const { organizations } = this.data;
    const current = this.context.organization();
    const organization =
      organizations.find((org) => org.name === current?.name) ?? (organizations.length === 1 ? organizations[0] : null);

    if (!organization) {
      return;
    }
    this.form.controls.organization.setValue(organization);

    const currentOrchestration = this.context.orchestration();
    const orchestration = organization.orchestrations.find((orch) => orch.name === currentOrchestration?.name);
    if (orchestration) {
      this.form.controls.orchestration.setValue(orchestration);
    }
  }
}

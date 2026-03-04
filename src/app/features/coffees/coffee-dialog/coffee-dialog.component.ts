import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Coffee } from '../../../core/models/coffee.model';

@Component({
  selector: 'app-coffee-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSelectModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title style="font-weight:700;">{{ data ? 'Modifier' : 'Ajouter' }} un Café</h2>
    <mat-dialog-content style="min-width:380px;">
      <form [formGroup]="form" style="display:flex;flex-direction:column;gap:16px;padding-top:8px;">

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Référence (Réf.)</mat-label>
          <mat-icon matPrefix style="margin-right:6px;color:#9e9e9e;font-size:18px;">tag</mat-icon>
          <input matInput formControlName="ref" placeholder="Ex. CAF-001 (auto si vide)">
          <mat-hint>Laissez vide pour générer automatiquement</mat-hint>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom du café</mat-label>
          <mat-icon matPrefix style="margin-right:6px;color:#9e9e9e;font-size:18px;">store</mat-icon>
          <input matInput formControlName="name" placeholder="Ex. Caribou Anfa">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Le nom est requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Emplacement / Ville</mat-label>
          <mat-icon matPrefix style="margin-right:6px;color:#9e9e9e;font-size:18px;">location_on</mat-icon>
          <input matInput formControlName="location" placeholder="Ex. Casablanca">
          <mat-error *ngIf="form.get('location')?.hasError('required')">L'emplacement est requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Statut</mat-label>
          <mat-select formControlName="active">
            <mat-option [value]="true">Actif</mat-option>
            <mat-option [value]="false">Inactif</mat-option>
          </mat-select>
        </mat-form-field>

      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end" style="padding:16px;">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()"
        style="border-radius:8px;min-width:120px;">
        {{ data ? 'Mettre à jour' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`.full-width { width: 100%; }`]
})
export class CoffeeDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<CoffeeDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Coffee | null
  ) {
    this.form = this.fb.group({
      ref: [data?.ref || ''],
      name: [data?.name || '', Validators.required],
      location: [data?.location || '', Validators.required],
      active: [data?.active ?? true]
    });
  }

  save() {
    if (this.form.valid) {
      const val = this.form.value;
      // strip empty ref so backend auto-generates
      if (!val.ref) delete val.ref;
      this.dialogRef.close(val);
    }
  }
}

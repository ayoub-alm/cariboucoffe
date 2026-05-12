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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

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
    MatIconModule,
    MatSlideToggleModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-icon-container">
        <mat-icon>{{ data ? 'edit' : 'add_business' }}</mat-icon>
      </div>
      <div class="header-title-container">
        <h2 mat-dialog-title>{{ data ? 'Modifier' : 'Ajouter' }} un Café</h2>
        <p class="header-subtitle">{{ data ? 'Mettez à jour les informations du point de vente' : 'Enregistrez un nouvel établissement dans le système' }}</p>
      </div>
      <button mat-icon-button mat-dialog-close class="close-btn">
        <mat-icon>close</mat-icon>
      </button>
    </div>

    <mat-dialog-content class="modern-dialog-content">
      <form [formGroup]="form" class="form-grid">
        
        <div class="form-section">
          <h3 class="section-title">Informations Générales</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nom du café</mat-label>
            <mat-icon matPrefix>store</mat-icon>
            <input matInput formControlName="name" placeholder="Ex. Caribou Anfa">
            <mat-error *ngIf="form.get('name')?.hasError('required')">Le nom est requis</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Référence (Réf.)</mat-label>
            <mat-icon matPrefix>tag</mat-icon>
            <input matInput formControlName="ref" placeholder="Ex. CAF-001">
            <mat-hint>Générée automatiquement si laissée vide</mat-hint>
          </mat-form-field>
        </div>

        <div class="form-section">
          <h3 class="section-title">Horaires Standard</h3>
          <div style="display: flex; gap: 16px;">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Heure d'ouverture</mat-label>
              <mat-icon matPrefix>schedule</mat-icon>
              <input matInput type="time" formControlName="opening_time">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Heure de fermeture</mat-label>
              <mat-icon matPrefix>schedule</mat-icon>
              <input matInput type="time" formControlName="closing_time">
            </mat-form-field>
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">Localisation & Statut</h3>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Emplacement / Ville</mat-label>
            <mat-icon matPrefix>location_on</mat-icon>
            <input matInput formControlName="location" placeholder="Ex. Casablanca">
            <mat-error *ngIf="form.get('location')?.hasError('required')">L'emplacement est requis</mat-error>
          </mat-form-field>

          <div class="status-container">
            <div class="status-info">
              <span class="status-label">Statut opérationnel</span>
              <span class="status-hint">{{ form.get('active')?.value ? 'Le café est actuellement actif' : 'Le café est actuellement inactif' }}</span>
            </div>
            <mat-slide-toggle formControlName="active" color="primary"></mat-slide-toggle>
          </div>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-footer">
      <button mat-button mat-dialog-close class="btn-cancel">Annuler</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()" class="btn-save">
        <mat-icon style="margin-right: 8px;">{{ data ? 'save' : 'add' }}</mat-icon>
        {{ data ? 'Mettre à jour' : 'Créer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      padding: 24px 24px 16px;
      position: relative;
      border-bottom: 1px solid var(--outline-variant);
      margin-bottom: 8px;
    }

    .header-icon-container {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: var(--primary-container);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 16px;
    }

    .header-icon-container mat-icon {
      font-size: 28px;
      height: 28px;
      width: 28px;
    }

    .header-title-container h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
      color: var(--on-surface);
    }

    .header-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: var(--on-surface-variant);
    }

    .close-btn {
      position: absolute;
      top: 16px;
      right: 16px;
      color: var(--on-surface-variant);
    }

    .modern-dialog-content {
      padding: 16px 24px !important;
      width: 100%;
    }

    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    @media (max-width: 600px) {
      .dialog-header {
        padding: 16px 16px 12px;
      }
      
      .header-icon-container {
        width: 40px;
        height: 40px;
        margin-right: 12px;
      }
      
      .modern-dialog-content {
        padding: 12px 16px !important;
      }
      
      .dialog-footer {
        padding: 12px 16px 20px !important;
        flex-direction: column-reverse;
        align-items: stretch;
        gap: 8px;
      }
      
      .btn-cancel {
        margin: 0 !important;
        width: 100%;
      }
      
      .btn-save {
        margin: 0 !important;
        width: 100%;
      }
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }


    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 4px;
    }

    .full-width {
      width: 100%;
    }

    .status-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--surface-variant);
      border-radius: 12px;
      margin-top: 4px;
    }

    .status-info {
      display: flex;
      flex-direction: column;
    }

    .status-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--on-surface);
    }

    .status-hint {
      font-size: 12px;
      color: var(--on-surface-variant);
    }

    .dialog-footer {
      padding: 16px 24px 24px !important;
    }

    .btn-cancel {
      font-weight: 500;
      padding: 0 16px;
      margin-right: 12px !important;
    }

    .btn-save {
      border-radius: 12px !important;
      padding: 0 24px !important;
      height: 44px !important;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(var(--primary-rgb, 26, 115, 232), 0.2);
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 12px !important;
      color: var(--on-surface-variant);
    }
  `]
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
      active: [data?.active ?? true],
      opening_time: [data?.opening_time || ''],
      closing_time: [data?.closing_time || '']
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

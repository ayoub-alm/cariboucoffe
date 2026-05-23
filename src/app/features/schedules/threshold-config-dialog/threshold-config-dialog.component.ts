import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ConfigService, ScheduleThreshold } from '../../../core/services/config.service';

@Component({
  selector: 'app-threshold-config-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSliderModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>tune</mat-icon>
      <span>Configuration des Seuils de Conformité</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="dialog-desc">
        Définissez les seuils de score pour le code couleur des horaires.
        Ces paramètres s'appliquent à toutes les vues de la page Horaires.
      </p>

      <!-- Preview -->
      <div class="preview-section">
        <div class="preview-bar">
          <div class="preview-segment green"
               [style.width]="(100 - conformeMin) + '%'">
            <span>✅ Vert ≥ {{ conformeMin }}%</span>
          </div>
          <div class="preview-segment orange"
               [style.width]="(conformeMin - partielMin) + '%'">
            <span>🟠 Orange</span>
          </div>
          <div class="preview-segment red"
               [style.width]="partielMin + '%'">
            <span>🔴 Rouge &lt; {{ partielMin }}%</span>
          </div>
        </div>
        <div class="preview-labels">
          <span class="label-red">0%</span>
          <span class="label-orange" [style.left]="partielMin + '%'">{{ partielMin }}%</span>
          <span class="label-green" [style.left]="conformeMin + '%'">{{ conformeMin }}%</span>
          <span class="label-green-end">100%</span>
        </div>
      </div>

      <form [formGroup]="form" class="form-container">
        <!-- Green Threshold -->
        <div class="threshold-row">
          <div class="threshold-label">
            <span class="dot green-dot"></span>
            <div>
              <strong>Seuil Vert (Conforme)</strong>
              <p>Score ≥ à cette valeur → Vert</p>
            </div>
          </div>
          <mat-form-field appearance="outline" class="threshold-input">
            <mat-label>Seuil Vert (%)</mat-label>
            <input matInput type="number" formControlName="conforme_min" min="1" max="100"
                   (input)="updatePreview()">
            <span matSuffix>%</span>
            <mat-error *ngIf="form.get('conforme_min')?.hasError('required')">Requis</mat-error>
            <mat-error *ngIf="form.get('conforme_min')?.hasError('min')">Minimum 1</mat-error>
            <mat-error *ngIf="form.get('conforme_min')?.hasError('max')">Maximum 100</mat-error>
          </mat-form-field>
        </div>

        <!-- Orange Threshold -->
        <div class="threshold-row">
          <div class="threshold-label">
            <span class="dot orange-dot"></span>
            <div>
              <strong>Seuil Orange (Partiel)</strong>
              <p>Score ≥ à cette valeur ET &lt; seuil vert → Orange</p>
            </div>
          </div>
          <mat-form-field appearance="outline" class="threshold-input">
            <mat-label>Seuil Orange (%)</mat-label>
            <input matInput type="number" formControlName="partiel_min" min="1" max="100"
                   (input)="updatePreview()">
            <span matSuffix>%</span>
            <mat-error *ngIf="form.get('partiel_min')?.hasError('required')">Requis</mat-error>
            <mat-error *ngIf="form.get('partiel_min')?.hasError('min')">Minimum 1</mat-error>
          </mat-form-field>
        </div>

        <!-- Cross-validation -->
        <div class="form-error-banner" *ngIf="form.hasError('thresholdOrder')">
          <mat-icon class="banner-icon">warning</mat-icon>
          <span>Le seuil Orange doit être inférieur au seuil Vert.</span>
        </div>

        <!-- Red info -->
        <div class="info-row">
          <span class="dot red-dot"></span>
          <div>
            <strong>Rouge (Non-conforme)</strong>
            <p>Score &lt; seuil Orange → Rouge automatiquement</p>
          </div>
        </div>
      </form>

      <!-- Current Values Display -->
      <div class="current-values">
        <h4>Résumé des seuils actifs :</h4>
        <div class="values-grid">
          <div class="value-chip green-chip">✅ Conforme : ≥ {{ conformeMin }}%</div>
          <div class="value-chip orange-chip">🟠 Partiel : {{ partielMin }}% – {{ conformeMin - 1 }}%</div>
          <div class="value-chip red-chip">🔴 Non-conforme : &lt; {{ partielMin }}%</div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary"
              [disabled]="form.invalid || isSaving"
              (click)="save()" class="save-btn">
        <mat-icon>save</mat-icon>
        {{ isSaving ? 'Sauvegarde...' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 20px; font-weight: 600; color: var(--primary);
      padding: 20px 24px; margin: 0; font-family: 'Outfit', sans-serif;
    }
    .dialog-content { padding: 8px 24px 24px 24px !important; min-width: 520px; }
    .dialog-desc { color: var(--on-surface-variant); font-size: 14px; margin: 0 0 20px 0; }

    /* Preview Bar */
    .preview-section { margin-bottom: 24px; }
    .preview-bar {
      display: flex; border-radius: 8px; overflow: hidden; height: 44px;
      border: 1px solid var(--outline-variant);
    }
    .preview-segment {
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; color: #fff;
      transition: width 0.3s ease; overflow: hidden; min-width: 0;
    }
    .preview-segment span { white-space: nowrap; padding: 0 4px; }
    .preview-segment.green { background: #1e8e3e; }
    .preview-segment.orange { background: #f57c00; }
    .preview-segment.red { background: #d93025; }
    .preview-labels {
      position: relative; display: flex;
      justify-content: space-between; margin-top: 4px;
      font-size: 11px; color: var(--on-surface-variant);
    }

    /* Form */
    .form-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
    .threshold-row {
      display: flex; align-items: center; gap: 16px;
      padding: 12px; border-radius: 12px;
      background: var(--surface-container-low);
      border: 1px solid var(--outline-variant);
    }
    .threshold-label {
      display: flex; align-items: center; gap: 12px; flex: 1;
    }
    .threshold-label div { display: flex; flex-direction: column; }
    .threshold-label strong { font-size: 14px; color: var(--on-surface); }
    .threshold-label p { font-size: 12px; color: var(--on-surface-variant); margin: 2px 0 0 0; }
    .threshold-input { width: 140px; flex-shrink: 0; margin-bottom: -1.25em; }

    .dot { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; }
    .green-dot { background: #1e8e3e; }
    .orange-dot { background: #f57c00; }
    .red-dot { background: #d93025; }

    .info-row {
      display: flex; align-items: center; gap: 12px;
      padding: 12px; border-radius: 12px;
      background: rgba(217, 48, 37, 0.05);
      border: 1px solid rgba(217, 48, 37, 0.15);
    }
    .info-row div { display: flex; flex-direction: column; }
    .info-row strong { font-size: 14px; color: #d93025; }
    .info-row p { font-size: 12px; color: var(--on-surface-variant); margin: 2px 0 0 0; }

    .form-error-banner {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; border-radius: 8px;
      background-color: rgba(217, 48, 37, 0.08); color: #d93025;
      font-size: 13px; border-left: 4px solid #d93025;
    }
    .banner-icon { font-size: 18px; width: 18px; height: 18px; }

    /* Current Values */
    .current-values { margin-top: 8px; }
    .current-values h4 { font-size: 13px; color: var(--on-surface-variant); margin: 0 0 8px 0; }
    .values-grid { display: flex; gap: 8px; flex-wrap: wrap; }
    .value-chip {
      padding: 6px 12px; border-radius: 20px;
      font-size: 12px; font-weight: 600;
    }
    .green-chip { background: rgba(30,142,62,0.12); color: #1e8e3e; }
    .orange-chip { background: rgba(245,124,0,0.12); color: #f57c00; }
    .red-chip { background: rgba(217,48,37,0.12); color: #d93025; }

    .dialog-actions { padding: 16px 24px !important; border-top: 1px solid var(--outline-variant); }
    .save-btn { border-radius: 8px; padding: 0 20px; }
  `]
})
export class ThresholdConfigDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private configService = inject(ConfigService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<ThresholdConfigDialogComponent>);

  form: FormGroup;
  isSaving = false;
  conformeMin = 100;
  partielMin = 90;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { current: ScheduleThreshold | null }
  ) {
    const t = data.current;
    this.conformeMin = t?.green_min ?? 100;
    this.partielMin = t?.orange_min ?? 90;

    this.form = this.fb.group({
      conforme_min: [this.conformeMin, [Validators.required, Validators.min(1), Validators.max(100)]],
      partiel_min: [this.partielMin, [Validators.required, Validators.min(1)]]
    }, { validators: this.thresholdOrderValidator });
  }

  ngOnInit() {
    this.form.valueChanges.subscribe(() => this.updatePreview());
  }

  updatePreview() {
    const v = this.form.value;
    this.conformeMin = Math.min(Math.max(v.conforme_min ?? 100, 1), 100);
    this.partielMin = Math.min(Math.max(v.partiel_min ?? 90, 1), 100);
  }

  thresholdOrderValidator(group: FormGroup) {
    const conforme = group.get('conforme_min')?.value;
    const partiel = group.get('partiel_min')?.value;
    if (conforme != null && partiel != null && partiel >= conforme) {
      return { thresholdOrder: true };
    }
    return null;
  }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    const val = this.form.value;
    this.configService.updateScheduleThresholds({
      green_min: val.conforme_min,
      orange_min: val.partiel_min
    }).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.snackBar.open('✅ Seuils mis à jour avec succès !', 'Fermer', { duration: 3000 });
        this.dialogRef.close(updated);
      },
      error: () => {
        this.isSaving = false;
        this.snackBar.open('❌ Erreur lors de la mise à jour.', 'Fermer', { duration: 3000 });
      }
    });
  }
}

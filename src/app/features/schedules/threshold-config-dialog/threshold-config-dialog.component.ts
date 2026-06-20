import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
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
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>tune</mat-icon>
      <span>Configuration des Seuils de Conformité</span>
    </h2>

    <mat-dialog-content class="dialog-content">
      <p class="dialog-desc">
        La conformité est calculée sur les horaires d'ouverture et de fermeture du café.
        Une ouverture en retard ou une fermeture anticipée est une non-conformité.
        Les seuils (en minutes) définissent la couleur : Vert, Orange ou Rouge.
      </p>

      <!-- Preview -->
      <div class="preview-section">
        <div class="preview-bar">
          <div class="preview-segment green" [style.flex]="greenMaxLoss === 0 ? '1' : '0 0 35%'">
            <span>✅ Vert ≤ {{ greenMaxLoss }} min perdus</span>
          </div>
          <div class="preview-segment orange" [style.flex]="'1'">
            <span>🟠 Orange ≤ {{ orangeMaxLoss }} min perdus</span>
          </div>
          <div class="preview-segment red" [style.flex]="'0 0 25%'">
            <span>🔴 Rouge &gt; {{ orangeMaxLoss }} min</span>
          </div>
        </div>
      </div>

      <form [formGroup]="form" class="form-container">
        <div class="threshold-row">
          <div class="threshold-label">
            <span class="dot green-dot"></span>
            <div>
              <strong>Seuil Vert (Conforme)</strong>
              <p>Ouverture et fermeture OK — écart max autorisé</p>
            </div>
          </div>
          <mat-form-field appearance="outline" class="threshold-input">
            <mat-label>Perte max Vert (min)</mat-label>
            <input matInput type="number" formControlName="green_max_loss" min="0" max="1440"
                   (input)="updatePreview()">
            <span matSuffix>min</span>
            <mat-error *ngIf="form.get('green_max_loss')?.hasError('required')">Requis</mat-error>
            <mat-error *ngIf="form.get('green_max_loss')?.hasError('min')">Minimum 0</mat-error>
          </mat-form-field>
        </div>

        <div class="threshold-row">
          <div class="threshold-label">
            <span class="dot orange-dot"></span>
            <div>
              <strong>Seuil Orange (Partiel)</strong>
              <p>Retard ouverture / fermeture anticipée toléré</p>
            </div>
          </div>
          <mat-form-field appearance="outline" class="threshold-input">
            <mat-label>Perte max Orange (min)</mat-label>
            <input matInput type="number" formControlName="orange_max_loss" min="0" max="1440"
                   (input)="updatePreview()">
            <span matSuffix>min</span>
            <mat-error *ngIf="form.get('orange_max_loss')?.hasError('required')">Requis</mat-error>
            <mat-error *ngIf="form.get('orange_max_loss')?.hasError('min')">Minimum 0</mat-error>
          </mat-form-field>
        </div>

        <div class="form-error-banner" *ngIf="form.hasError('thresholdOrder')">
          <mat-icon class="banner-icon">warning</mat-icon>
          <span>Le seuil Orange doit être supérieur ou égal au seuil Vert.</span>
        </div>

        <div class="info-row">
          <span class="dot red-dot"></span>
          <div>
            <strong>Rouge (Non-conforme)</strong>
            <p>Ouverture trop tard ou fermeture trop tôt — hors seuil Orange</p>
          </div>
        </div>
      </form>

      <div class="current-values">
        <h4>Résumé des seuils actifs :</h4>
        <div class="values-grid">
          <div class="value-chip green-chip">✅ Conforme : écart ≤ {{ greenMaxLoss }} min</div>
          <div class="value-chip orange-chip">🟠 Partiel : écart ≤ {{ orangeMaxLoss }} min</div>
          <div class="value-chip red-chip">🔴 Non-conforme : écart &gt; {{ orangeMaxLoss }} min</div>
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

    .preview-section { margin-bottom: 24px; }
    .preview-bar {
      display: flex; border-radius: 8px; overflow: hidden; height: 44px;
      border: 1px solid var(--outline-variant);
    }
    .preview-segment {
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600; color: #fff;
      transition: flex 0.3s ease; overflow: hidden; min-width: 0;
    }
    .preview-segment span { white-space: nowrap; padding: 0 4px; }
    .preview-segment.green { background: #1e8e3e; }
    .preview-segment.orange { background: #f57c00; }
    .preview-segment.red { background: #d93025; }

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
    .threshold-input { width: 160px; flex-shrink: 0; margin-bottom: -1.25em; }

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
  greenMaxLoss = 0;
  orangeMaxLoss = 60;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { current: ScheduleThreshold | null }
  ) {
    const t = data.current;
    this.greenMaxLoss = t?.green_min ?? 0;
    this.orangeMaxLoss = t?.orange_min ?? 60;

    this.form = this.fb.group({
      green_max_loss: [this.greenMaxLoss, [Validators.required, Validators.min(0), Validators.max(1440)]],
      orange_max_loss: [this.orangeMaxLoss, [Validators.required, Validators.min(0), Validators.max(1440)]]
    }, { validators: this.thresholdOrderValidator });
  }

  ngOnInit() {
    this.form.valueChanges.subscribe(() => this.updatePreview());
  }

  updatePreview() {
    const v = this.form.value;
    this.greenMaxLoss = Math.min(Math.max(v.green_max_loss ?? 0, 0), 1440);
    this.orangeMaxLoss = Math.min(Math.max(v.orange_max_loss ?? 60, 0), 1440);
  }

  thresholdOrderValidator(group: FormGroup) {
    const green = group.get('green_max_loss')?.value;
    const orange = group.get('orange_max_loss')?.value;
    if (green != null && orange != null && orange < green) {
      return { thresholdOrder: true };
    }
    return null;
  }

  save() {
    if (this.form.invalid) return;
    this.isSaving = true;
    const val = this.form.value;
    this.configService.updateScheduleThresholds({
      green_min: val.green_max_loss,
      orange_min: val.orange_max_loss
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

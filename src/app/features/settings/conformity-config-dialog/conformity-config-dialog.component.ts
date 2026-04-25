import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfigService, ConformityThreshold } from '../../../core/services/config.service';

@Component({
  selector: 'app-conformity-config-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatDialogModule, 
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon>settings_suggest</mat-icon> Configuration de Conformité
    </h2>
    
    <mat-dialog-content class="dialog-content">
      <p class="description">Définissez les seuils de score pour déterminer l'état d'un audit.</p>
      
      <div class="threshold-form" *ngIf="threshold(); else loading">
        <div class="field-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seuil de Conformité (Min %)</mat-label>
            <input matInput type="number" [(ngModel)]="threshold()!.conforme_min" min="0" max="100">
            <span matSuffix>%</span>
            <mat-hint>Scores >= à ce seuil seront marqués "Conforme"</mat-hint>
          </mat-form-field>
        </div>

        <div class="field-row">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Seuil de Conformité Partielle (Min %)</mat-label>
            <input matInput type="number" [(ngModel)]="threshold()!.partiel_min" min="0" max="100">
            <span matSuffix>%</span>
            <mat-hint>Scores >= à ce seuil seront "Partiel", en dessous "Non-conforme"</mat-hint>
          </mat-form-field>
        </div>

        <div class="preview-box">
          <h3>Aperçu des tranches :</h3>
          <div class="level level-success">
            <mat-icon>check_circle</mat-icon>
            <strong>Conforme :</strong> [{{ threshold()!.conforme_min }}% - 100%]
          </div>
          <div class="level level-warning">
            <mat-icon>warning</mat-icon>
            <strong>Partiel :</strong> [{{ threshold()!.partiel_min }}% - {{ threshold()!.conforme_min - 0.01 }}%]
          </div>
          <div class="level level-error">
            <mat-icon>error</mat-icon>
            <strong>Non-conforme :</strong> [0% - {{ threshold()!.partiel_min - 0.01 }}%]
          </div>
        </div>
      </div>
      
      <ng-template #loading>
        <div class="loading-state">Chargement des seuils...</div>
      </ng-template>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button (click)="close()">Annuler</button>
      <button mat-raised-button color="primary" [disabled]="saving()" (click)="save()">
        {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
    .dialog-content { padding-top: 16px !important; min-width: 380px; }
    .description { color: var(--on-surface-variant); margin-bottom: 24px; font-size: 14px; }
    .threshold-form { display: flex; flex-direction: column; gap: 16px; }
    .full-width { width: 100%; }
    .preview-box { 
      background: var(--surface-container); 
      padding: 16px; 
      border-radius: 12px; 
      margin-top: 16px;
      border: 1px solid var(--outline-variant);
    }
    .preview-box h3 { margin-top: 0; font-size: 14px; margin-bottom: 12px; color: var(--primary); }
    .level { display: flex; align-items: center; gap: 10px; font-size: 13px; margin-bottom: 8px; padding: 4px 8px; border-radius: 6px; }
    .level mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .level-success { color: #2e7d32; background: #e8f5e9; }
    .level-warning { color: #e65100; background: #fff3e0; }
    .level-error { color: #c62828; background: #ffebee; }
    
    body.dark-theme .level-success { color: #81c784; background: rgba(129, 199, 132, 0.1); }
    body.dark-theme .level-warning { color: #ffb74d; background: rgba(255, 183, 77, 0.1); }
    body.dark-theme .level-error { color: #e57373; background: rgba(229, 115, 115, 0.1); }

    .dialog-actions { padding: 16px 24px !important; }
    .loading-state { padding: 40px; text-align: center; color: var(--on-surface-variant); }
  `]
})
export class ConformityConfigDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ConformityConfigDialogComponent>);
  private configService = inject(ConfigService);
  private snackBar = inject(MatSnackBar);

  threshold = signal<ConformityThreshold | null>(null);
  saving = signal(false);

  ngOnInit() {
    this.configService.getThresholds().subscribe({
      next: (data) => this.threshold.set({ ...data }),
      error: (err) => {
        console.error('Failed to load thresholds', err);
        this.snackBar.open('Erreur lors du chargement des seuils', 'Fermer', { duration: 3000 });
        this.close();
      }
    });
  }

  save() {
    const data = this.threshold();
    if (!data) return;

    if (data.conforme_min <= data.partiel_min) {
      this.snackBar.open('Le seuil de conformité doit être supérieur au seuil partiel', 'Ok');
      return;
    }

    this.saving.set(true);
    this.configService.updateThresholds(data).subscribe({
      next: () => {
        this.snackBar.open('Seuils mis à jour avec succès', 'Fermer', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to save thresholds', err);
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  close() {
    this.dialogRef.close();
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ExportKpiDialogData {
  startDate: Date | null;
  endDate: Date | null;
}

export interface ExportKpiDialogResult {
  startDate: Date;
  endDate: Date;
}

@Component({
  selector: 'app-export-kpi-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-container">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon style="vertical-align: middle; margin-right: 8px;">download</mat-icon>
        Exporter les KPIs Mensuels
      </h2>
      
      <mat-dialog-content class="dialog-content">
        <p class="description-text">Choisissez la période du rapport à exporter au format Excel (.xls).</p>
        
        <mat-form-field appearance="outline" class="w-100">
          <mat-label>Type de période</mat-label>
          <mat-select [(ngModel)]="periodType">
            <mat-option value="month">Mois Spécifique</mat-option>
            <mat-option value="custom">Période Personnalisée</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Dropdown for specific month selection -->
        <mat-form-field appearance="outline" class="w-100" *ngIf="periodType === 'month'">
          <mat-label>Sélectionner le mois</mat-label>
          <mat-select [(ngModel)]="selectedMonthIndex">
            <mat-option *ngFor="let month of months; let i = index" [value]="i">
              {{ month.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Date Range selector for custom period -->
        <mat-form-field appearance="outline" class="w-100" *ngIf="periodType === 'custom'">
          <mat-label>Période (Début - Fin)</mat-label>
          <mat-date-range-input [rangePicker]="picker">
            <input matStartDate placeholder="Date début" [(ngModel)]="startDate">
            <input matEndDate placeholder="Date fin" [(ngModel)]="endDate">
          </mat-date-range-input>
          <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-date-range-picker #picker></mat-date-range-picker>
        </mat-form-field>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">Annuler</button>
        <button mat-flat-button class="export-btn" (click)="onExport()" [disabled]="isInvalid()">
          <mat-icon>download</mat-icon> Exporter
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      padding: 8px;
      max-width: 400px;
    }
    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      margin: 0 0 16px 0;
      color: var(--on-surface);
      font-family: 'Google Sans', sans-serif;
    }
    .description-text {
      color: var(--on-surface-variant);
      font-size: 14px;
      margin-bottom: 16px;
    }
    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
      min-width: 320px;
    }
    .w-100 {
      width: 100%;
    }
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 8px 0 0 0;
    }
    .export-btn {
      background: linear-gradient(135deg, #68b1c2, #5faebc) !important;
      color: white !important;
      border: 1px solid #68b1c2 !important;
      box-shadow: 0 2px 6px rgba( 104, 177, 194, 0.15) !important;
      font-weight: 500;
      border-radius: 20px;
      padding: 0 16px;
      height: 36px;
      transition: all 0.2s ease-in-out;
    }
    .export-btn:hover {
      background: linear-gradient(135deg, #5faebc, #68b1c2) !important;
      box-shadow: 0 4px 12px rgba(16, 124, 65, 0.3) !important;
    }
    .export-btn[disabled] {
      background: #cccccc !important;
      border-color: #bbbbbb !important;
      color: #666666 !important;
      box-shadow: none !important;
    }
  `]
})
export class ExportKpiDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<ExportKpiDialogComponent>);
  private data = inject<ExportKpiDialogData>(MAT_DIALOG_DATA, { optional: true });

  periodType: 'month' | 'custom' = 'month';
  months: { label: string; start: Date; end: Date }[] = [];
  selectedMonthIndex = 0;

  startDate: Date | null = null;
  endDate: Date | null = null;

  ngOnInit() {
    const locale = 'fr-FR';
    const today = new Date();
    
    // Generate last 12 months options
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const label = d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
      const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
      
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); // last day of month
      this.months.push({ label: capitalizedLabel, start, end });
    }

    // Default to the filters passed in if valid
    if (this.data && this.data.startDate && this.data.endDate) {
      this.startDate = this.data.startDate;
      this.endDate = this.data.endDate;
      this.periodType = 'custom';
    }
  }

  isInvalid(): boolean {
    if (this.periodType === 'custom') {
      return !this.startDate || !this.endDate;
    }
    return false;
  }

  onCancel() {
    this.dialogRef.close();
  }

  onExport() {
    if (this.periodType === 'month') {
      const selected = this.months[this.selectedMonthIndex];
      this.dialogRef.close({
        startDate: selected.start,
        endDate: selected.end
      });
    } else {
      if (this.startDate && this.endDate) {
        this.dialogRef.close({
          startDate: this.startDate,
          endDate: this.endDate
        });
      }
    }
  }
}

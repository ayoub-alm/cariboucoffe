import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Coffee } from '../../../core/models/coffee.model';
import { DailyLogService, DailyTimeRecord } from '../../../core/services/daily-log.service';

@Component({
  selector: 'app-schedule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <div class="title-content">
        <mat-icon>{{ isEdit ? (isViewMode ? 'visibility' : 'edit_calendar') : 'add_moderator' }}</mat-icon>
        <span>{{ isEdit ? (isViewMode ? 'Détails des Horaires' : 'Modifier les Horaires') : 'Enregistrer de Nouveaux Horaires' }}</span>
      </div>
      <div class="header-actions">
        <button *ngIf="isEdit && isViewMode" mat-icon-button (click)="toggleEditMode()" aria-label="Modifier" matTooltip="Modifier les horaires" class="edit-btn">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button mat-dialog-close class="close-btn" aria-label="Fermer la boîte de dialogue">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </h2>

    <mat-dialog-content class="dialog-content font-sans">
      <form [formGroup]="form" class="form-container">
        <div class="form-row">
          <!-- Coffee Shop selector -->
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Café</mat-label>
            <mat-select formControlName="coffee_id">
              <mat-option *ngFor="let coffee of coffees" [value]="coffee.id">
                {{ coffee.name }}
              </mat-option>
            </mat-select>
            <mat-error *ngIf="form.get('coffee_id')?.hasError('required')">Le café est requis</mat-error>
          </mat-form-field>

          <!-- Date Selector -->
          <mat-form-field appearance="outline" class="form-field">
            <mat-label>Date</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="date">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="form.get('date')?.hasError('required')">La date est requise</mat-error>
          </mat-form-field>
        </div>

        <!-- Theoretical Operating Hours Helper -->
        <div class="theoretical-info" *ngIf="selectedTheoreticalOpening || isClosedDay">
          <mat-icon class="info-icon">info_outline</mat-icon>
          <div class="theoretical-text">
            <span>Horaires théoriques de ce café : </span>
            <ng-container *ngIf="isClosedDay; else openDay">
              <strong>Fermé ce jour</strong>
            </ng-container>
            <ng-template #openDay>
              <strong>Ouverture {{ selectedTheoreticalOpening }}</strong>
              <span> &bull; </span>
              <strong>Fermeture {{ selectedTheoreticalClosing }}</strong>
            </ng-template>
          </div>
        </div>

        <!-- Validation Warning Banner -->
        <div class="form-error-banner" *ngIf="form.hasError('requireOneTime') && (form.get('opening_time')?.touched || form.get('closing_time')?.touched || form.touched)">
          <mat-icon class="banner-icon">warning</mat-icon>
          <span>Veuillez spécifier au moins une heure d'ouverture ou de fermeture.</span>
        </div>

        <div class="form-row inputs-row">
          <!-- Opening Time -->
          <div class="time-box" [class.read-only]="isViewMode">
            <h3>Ouverture</h3>
            <p class="time-desc">Heure réelle d'ouverture constatée.</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Heure d'ouverture</mat-label>
              <input matInput type="time" formControlName="opening_time">
            </mat-form-field>
          </div>

          <!-- Closing Time -->
          <div class="time-box" [class.read-only]="isViewMode">
            <h3>Fermeture</h3>
            <p class="time-desc">Heure réelle de fermeture constatée.</p>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Heure de fermeture</mat-label>
              <input matInput type="time" formControlName="closing_time">
            </mat-form-field>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      <button mat-button mat-dialog-close>{{ isViewMode ? 'Fermer' : 'Annuler' }}</button>
      <button *ngIf="!isViewMode" mat-flat-button color="primary" [disabled]="form.invalid" (click)="save()" class="action-btn">
        <mat-icon>save</mat-icon>
        <span>{{ isEdit ? 'Mettre à jour' : 'Enregistrer' }}</span>
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      font-size: 20px;
      font-weight: 600;
      color: var(--primary);
      padding: 16px 20px;
      margin: 0;
      font-family: 'Outfit', sans-serif;
      border-bottom: 1px solid var(--outline-variant);
    }
    .title-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: -8px -8px -8px auto;
    }
    .edit-btn {
      color: var(--primary);
    }
    .close-btn {
      color: var(--on-surface-variant);
    }
    .dialog-content {
      padding: 16px 20px !important;
      max-height: 60vh;
      overflow-y: auto;
    }
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .form-row {
      display: flex;
      gap: 16px;
      width: 100%;
    }
    .form-field {
      flex: 1;
    }
    .theoretical-info {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background-color: var(--surface-container-highest);
      border-radius: 8px;
      font-size: 13px;
      color: var(--on-surface-variant);
      border-left: 4px solid var(--primary);
      line-height: 1.4;
    }
    .theoretical-text {
      flex: 1;
    }
    .info-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: var(--primary);
      flex-shrink: 0;
    }
    .inputs-row {
      margin-top: 8px;
    }
    .time-box {
      flex: 1;
      padding: 16px;
      background-color: var(--surface-container-high);
      border-radius: 12px;
      border: 1px solid var(--outline-variant);
      transition: all 0.2s ease;
    }
    .time-box.read-only {
      opacity: 0.8;
      background-color: var(--surface-container);
    }
    .time-box h3 {
      margin: 0 0 4px 0;
      font-size: 15px;
      font-weight: 600;
      color: var(--primary);
    }
    .time-desc {
      font-size: 11px;
      color: var(--on-surface-variant);
      margin: 0 0 12px 0;
    }
    .full-width {
      width: 100%;
    }
    .dialog-actions {
      padding: 12px 20px !important;
      border-top: 1px solid var(--outline-variant);
    }
    .action-btn {
      border-radius: 8px;
      padding: 0 20px;
    }
    .form-error-banner {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background-color: rgba(217, 48, 37, 0.08);
      color: #d93025;
      border-radius: 8px;
      font-size: 13px;
      border-left: 4px solid #d93025;
      margin-bottom: 8px;
    }
    .banner-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #d93025;
    }
    @media (max-width: 576px) {
      .dialog-title {
        font-size: 17px;
        padding: 12px 16px;
      }
      .dialog-content {
        padding: 12px 16px !important;
        max-height: 50vh;
      }
      .dialog-actions {
        padding: 12px 16px !important;
      }
      .form-row {
        flex-direction: column;
        gap: 12px;
      }
      .time-box {
        padding: 12px;
      }
    }
  `]
})
export class ScheduleDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ScheduleDialogComponent>);
  private dailyLogService = inject(DailyLogService);

  form: FormGroup;
  coffees: Coffee[] = [];
  isEdit = false;
  isViewMode = false;

  selectedTheoreticalOpening = '';
  selectedTheoreticalClosing = '';
  isClosedDay = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      log: DailyTimeRecord | null;
      coffees: Coffee[];
      defaultDate?: Date;
      defaultCoffeeId?: number | string;
    }
  ) {
    this.coffees = data.coffees;
    this.isEdit = !!data.log;
    this.isViewMode = this.isEdit; // Start in view mode if editing existing log

    this.form = this.fb.group({
      coffee_id: [{ value: data.log?.coffee_id || data.defaultCoffeeId || '', disabled: this.isEdit }, Validators.required],
      date: [{ value: data.log ? new Date(data.log.date) : (data.defaultDate || new Date()), disabled: this.isEdit }, Validators.required],
      opening_time: [{ value: data.log?.opening_time || '', disabled: this.isViewMode }],
      closing_time: [{ value: data.log?.closing_time || '', disabled: this.isViewMode }]
    }, { validators: this.atLeastOneTimeValidator });
  }

  ngOnInit() {
    this.form.get('coffee_id')?.valueChanges.subscribe(() => this.updateTheoreticalTimes());
    this.form.get('date')?.valueChanges.subscribe(() => this.updateTheoreticalTimes());
    this.updateTheoreticalTimes();
  }
  
  toggleEditMode() {
    this.isViewMode = false;
    this.form.get('opening_time')?.enable();
    this.form.get('closing_time')?.enable();
  }

  updateTheoreticalTimes() {
    const coffeeId = this.form.get('coffee_id')?.value || this.form.get('coffee_id')?.getRawValue();
    const dateValue = this.form.get('date')?.value || this.form.get('date')?.getRawValue();
    
    if (!coffeeId || !dateValue) {
      this.selectedTheoreticalOpening = '';
      this.selectedTheoreticalClosing = '';
      this.isClosedDay = false;
      return;
    }

    const coffee = this.coffees.find(c => c.id === coffeeId);
    if (coffee) {
      const d = new Date(dateValue);
      const dayOfWeek = d.getDay(); // 0 (Sun) to 6 (Sat)
      
      const schedule = coffee.schedules?.find(s => s.day_of_week === dayOfWeek);
      
      if (schedule) {
        this.isClosedDay = !!schedule.is_closed;
        this.selectedTheoreticalOpening = schedule.opening_time || 'Non spécifié';
        this.selectedTheoreticalClosing = schedule.closing_time || 'Non spécifié';
      } else {
        this.isClosedDay = false;
        this.selectedTheoreticalOpening = coffee.opening_time || 'Non spécifié';
        this.selectedTheoreticalClosing = coffee.closing_time || 'Non spécifié';
      }
    }
  }

  atLeastOneTimeValidator(group: FormGroup) {
    const opening = group.get('opening_time')?.value;
    const closing = group.get('closing_time')?.value;
    return (opening || closing) ? null : { requireOneTime: true };
  }

  save() {
    if (this.form.invalid) return;

    // Use raw values since disabled form controls (in edit mode) are ignored by form.value
    const val = this.form.getRawValue();
    const dateStr = this.formatDate(val.date);

    this.dialogRef.close({
      coffee_id: val.coffee_id,
      date: dateStr,
      opening_time: val.opening_time || null,
      closing_time: val.closing_time || null
    });
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}

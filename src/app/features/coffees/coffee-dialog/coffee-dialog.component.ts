import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { Coffee, CoffeeSchedule } from '../../../core/models/coffee.model';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

const DAYS_OF_WEEK = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

@Component({
  selector: 'app-coffee-dialog',
  standalone: true,
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
  templateUrl: './coffee-dialog.component.html',
  styleUrl: './coffee-dialog.component.css'
})
export class CoffeeDialogComponent implements OnInit {
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
      schedules: this.fb.array([])
    });
  }

  ngOnInit() {
    this.initSchedules();
  }

  get schedulesArray() {
    return this.form.get('schedules') as FormArray;
  }

  getDayName(dayIndex: number): string {
    return DAYS_OF_WEEK[dayIndex] || 'Jour';
  }

  initSchedules() {
    // If we have data and schedules from backend
    if (this.data && this.data.schedules && this.data.schedules.length > 0) {
      // Sort to ensure 0-6 order just in case
      const sortedSchedules = [...this.data.schedules].sort((a, b) => a.day_of_week - b.day_of_week);
      sortedSchedules.forEach(sched => {
        this.schedulesArray.push(this.createScheduleGroup(sched));
      });
    } else {
      // Create default 7 days if no schedule exists
      const defaultOpening = this.data?.opening_time || '07:00';
      const defaultClosing = this.data?.closing_time || '20:00';
      
      for (let i = 0; i < 7; i++) {
        this.schedulesArray.push(this.createScheduleGroup({
          day_of_week: i,
          is_closed: false,
          opening_time: defaultOpening,
          closing_time: defaultClosing
        }));
      }
    }
  }

  createScheduleGroup(schedule: any): FormGroup {
    const group = this.fb.group({
      day_of_week: [schedule.day_of_week],
      is_closed: [schedule.is_closed],
      opening_time: [{ value: schedule.opening_time, disabled: schedule.is_closed }],
      closing_time: [{ value: schedule.closing_time, disabled: schedule.is_closed }]
    });

    // Add subscription to toggle disabled state when is_closed changes
    group.get('is_closed')?.valueChanges.subscribe(isClosed => {
      const openingControl = group.get('opening_time');
      const closingControl = group.get('closing_time');
      if (isClosed) {
        openingControl?.disable();
        closingControl?.disable();
      } else {
        openingControl?.enable();
        closingControl?.enable();
      }
    });

    return group;
  }

  save() {
    if (this.form.valid) {
      const val = this.form.getRawValue(); // use getRawValue to get disabled fields too
      // strip empty ref so backend auto-generates
      if (!val.ref) delete val.ref;
      
      // If a day is closed, we can send null or empty string, but we just pass what we have
      this.dialogRef.close(val);
    }
  }
}

import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Coffee } from '../../../core/models/coffee.model';

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
        MatCheckboxModule
    ],
    template: `
    <h2 mat-dialog-title>{{ data ? 'Modifier' : 'Ajouter' }} un Café</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Nom</mat-label>
          <input matInput formControlName="name" placeholder="Nom du café">
          <mat-error *ngIf="form.get('name')?.hasError('required')">Le nom est requis</mat-error>
        </mat-form-field>

        <mat-form-field appearance="fill" class="full-width">
          <mat-label>Emplacement</mat-label>
          <input matInput formControlName="location" placeholder="Adresse ou ville">
          <mat-error *ngIf="form.get('location')?.hasError('required')">L'emplacement est requis</mat-error>
        </mat-form-field>

        <mat-checkbox formControlName="active">Actif</mat-checkbox>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-raised-button color="primary" [disabled]="form.invalid" (click)="save()">Enregistrer</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .full-width { width: 100%; margin-bottom: 15px; }
  `]
})
export class CoffeeDialogComponent implements OnInit {
    form: FormGroup;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<CoffeeDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Coffee | null
    ) {
        this.form = this.fb.group({
            name: [data?.name || '', Validators.required],
            location: [data?.location || '', Validators.required],
            active: [data?.active ?? true]
        });
    }

    ngOnInit(): void { }

    save() {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }
}

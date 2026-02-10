import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { CoffeeService } from '../../../core/services/coffee.service';
import { AsyncPipe, NgIf } from '@angular/common';

@Component({
    selector: 'app-audit-dialog',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatDatepickerModule,
        NgIf,
        AsyncPipe
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './audit-dialog.component.html',
    styles: [`
    .dialog-container { min-width: 400px; }
    .full-width { width: 100%; margin-bottom: 12px; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px; }
  `]
})
export class AuditDialogComponent {
    private fb = inject(FormBuilder);
    private coffeeService = inject(CoffeeService);
    dialogRef = inject(MatDialogRef<AuditDialogComponent>);
    data = inject<Audit | null>(MAT_DIALOG_DATA);

    coffees$ = this.coffeeService.getCoffees();

    auditForm = this.fb.group({
        coffeeId: [this.data?.coffeeId || null, Validators.required],
        auditorName: [this.data?.auditorName || '', Validators.required],
        date: [this.data?.date || new Date(), Validators.required],
        shift: [this.data?.shift || 'AM', Validators.required],
        status: [this.data?.status || 'Non-conforme', Validators.required]
    });

    onSubmit() {
        if (this.auditForm.valid) {
            // In a real app, you might merge this with the existing ID if editing
            this.dialogRef.close({
                ...this.data,
                ...this.auditForm.value
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}

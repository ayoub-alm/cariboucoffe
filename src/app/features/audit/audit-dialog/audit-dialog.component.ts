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

import { MatIconModule } from '@angular/material/icon';

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
        MatIconModule,
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

    // Photo handling
    selectedFileName: string | null = null;
    photoPreview: string | null = null;
    photoData: string | null = null;
    isCompressing = false;

    auditForm = this.fb.group({
        coffeeId: [this.data?.coffeeId || null, Validators.required],
        auditorName: [this.data?.auditorName || '', Validators.required],
        date: [this.data?.date || new Date(), Validators.required],
        shift: [this.data?.shift || 'AM', Validators.required],
        status: [this.data?.status || 'Non-conforme', Validators.required]
    });

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.selectedFileName = file.name;
            this.processFile(file);
        }
    }

    processFile(file: File) {
        this.isCompressing = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Strategy: Max dimension 1024px for good balance of quality and size
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                // Strategy: JPEG with 0.7 quality
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                this.photoPreview = dataUrl;
                this.photoData = dataUrl;
                this.isCompressing = false;
            };
        };
        reader.readAsDataURL(file);
    }

    removePhoto() {
        this.selectedFileName = null;
        this.photoPreview = null;
        this.photoData = null;
    }

    onSubmit() {
        if (this.auditForm.valid) {
            // In a real app, you might merge this with the existing ID if editing
            this.dialogRef.close({
                ...this.data,
                ...this.auditForm.value,
                photoData: this.photoData
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}

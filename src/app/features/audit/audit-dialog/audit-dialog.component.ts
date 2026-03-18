import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe } from '@angular/common';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { CoffeeService } from '../../../core/services/coffee.service';
import { CameraDialogComponent } from '../components/camera-dialog/camera-dialog.component';

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
    private dialog = inject(MatDialog);
    dialogRef = inject(MatDialogRef<AuditDialogComponent>);
    data = inject<Audit | null>(MAT_DIALOG_DATA);

    coffees$ = this.coffeeService.getCoffees();

    photoPreviews: string[] = [];
    photosData: string[] = [];
    isCompressing = false;
    isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    auditForm = this.fb.group({
        coffeeId: [this.data?.coffeeId || null, Validators.required],
        auditorName: [this.data?.auditorName || '', Validators.required],
        date: [this.data?.date || new Date(), Validators.required],
        shift: [this.data?.shift || 'AM', Validators.required],
        status: [this.data?.status || 'Non-conforme', Validators.required]
    });

    onFilesSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = input.files;
        if (files) {
            for (let i = 0; i < files.length; i++) {
                this.processFile(files[i]);
            }
        }
        input.value = '';
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
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                this.photoPreviews = [...this.photoPreviews, dataUrl];
                this.photosData = [...this.photosData, dataUrl];
                this.isCompressing = false;
            };
        };
        reader.readAsDataURL(file);
    }

    removePhoto(index: number) {
        this.photoPreviews = this.photoPreviews.filter((_, i) => i !== index);
        this.photosData = this.photosData.filter((_, i) => i !== index);
    }

    openCamera(mobileInput?: HTMLInputElement) {
        if (this.isMobile && mobileInput) {
            mobileInput.click();
        } else {
            this.dialog.open(CameraDialogComponent, { width: '600px', autoFocus: false }).afterClosed().subscribe(dataUrl => {
                if (dataUrl) {
                    this.photoPreviews = [...this.photoPreviews, dataUrl];
                    this.photosData = [...this.photosData, dataUrl];
                }
            });
        }
    }

    onSubmit() {
        if (this.auditForm.valid) {
            // In a real app, you might merge this with the existing ID if editing
            this.dialogRef.close({
                ...this.data,
                ...this.auditForm.value,
                photosData: this.photosData.length ? this.photosData : undefined
            });
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}

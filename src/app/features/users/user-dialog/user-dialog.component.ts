import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { User } from '../../../core/models/user.model';

@Component({
    selector: 'app-user-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatFormFieldModule
    ],
    templateUrl: './user-dialog.component.html',
    styleUrls: ['./user-dialog.component.css']
})
export class UserDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<UserDialogComponent>);

    userForm: FormGroup;

    constructor(@Inject(MAT_DIALOG_DATA) public data: User | null) {
        this.userForm = this.fb.group({
            firstName: [data?.firstName || '', Validators.required],
            lastName: [data?.lastName || '', Validators.required],
            email: [data?.email || '', [Validators.required, Validators.email]],
            phone: [data?.phone || ''],
            role: [data?.role || 'Staff', Validators.required],
            status: [data?.status || 'active', Validators.required],
            coffeeShop: [data?.coffeeShop || null]
        });
    }

    save() {
        if (this.userForm.valid) {
            const result = {
                ...this.data,
                ...this.userForm.value,
                id: this.data?.id || 'u' + Date.now(),
                createdAt: this.data?.createdAt || new Date(),
                lastLogin: this.data?.lastLogin
            };
            this.dialogRef.close(result);
        }
    }
}

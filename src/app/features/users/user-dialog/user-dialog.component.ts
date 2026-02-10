import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { User, UserRole } from '../../../core/models/user.model';

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

    // We can inject user or null.
    // If null, it's create.
    constructor(@Inject(MAT_DIALOG_DATA) public data: User | null) {
        this.userForm = this.fb.group({
            // Backend mismatch: User model has 'full_name', frontend form likely had 'firstName', 'lastName'. 
            // In UserListComponent we saw 'full_name' usage?
            // Let's check User model below... 
            // Previous user.model.ts view showed: email, full_name, is_active, role, coffee_id.

            // So we should adhere to that model.
            full_name: [data?.full_name || '', Validators.required],
            email: [data?.email || '', [Validators.required, Validators.email]],
            password: [''], // Only for create or if changing. Made optional but useful for create.
            role: [data?.role || UserRole.VIEWER, Validators.required],
            is_active: [data?.is_active ?? true], // defaulting to true
            coffee_id: [data?.coffee_id || null] // Assuming number input or select
        });

        // If creating, password might be required? Backend user create usually requires password.
        if (!data) {
            this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        }
    }

    save() {
        if (this.userForm.valid) {
            // Return only the form value. 
            // The caller handles ID assignment (if edit) or creation (if new).
            // Actually, for edit, we might want to merge with original data in caller if needed, 
            // but for API update, we usually send partial object.

            // However, the caller expects an object to send to API.
            // If Create: we need password.
            // If Edit: password optional.

            const formValue = this.userForm.getRawValue();

            // If editing and password empty, remove it to avoid overwriting with empty string?
            if (this.data && !formValue.password) {
                delete formValue.password;
            }

            this.dialogRef.close(formValue);
        }
    }
}

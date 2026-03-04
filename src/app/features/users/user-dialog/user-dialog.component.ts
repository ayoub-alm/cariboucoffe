import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { User, UserRole } from '../../../core/models/user.model';
import { CoffeeService } from '../../../core/services/coffee.service';
import { Coffee } from '../../../core/models/coffee.model';

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
        MatFormFieldModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './user-dialog.component.html',
    styleUrls: ['./user-dialog.component.css']
})
export class UserDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<UserDialogComponent>);
    private coffeeService = inject(CoffeeService);

    coffees = signal<Coffee[]>([]);
    loadingCoffees = signal(true);
    userForm: FormGroup;

    constructor(@Inject(MAT_DIALOG_DATA) public data: User | null) {
        this.userForm = this.fb.group({
            full_name: [data?.full_name || '', Validators.required],
            email: [data?.email || '', [Validators.required, Validators.email]],
            password: [''],
            role: [data?.role || UserRole.VIEWER, Validators.required],
            is_active: [data?.is_active ?? true],
            coffee_id: [data?.coffee_id || null]
        });

        if (!data) {
            this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
        }

        // Load coffees for the select box
        this.coffeeService.getCoffees().subscribe({
            next: (list) => {
                this.coffees.set(list);
                this.loadingCoffees.set(false);
            },
            error: () => this.loadingCoffees.set(false)
        });
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

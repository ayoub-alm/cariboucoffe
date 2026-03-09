import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../core/services/user.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-change-password-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './change-password-dialog.component.html',
    styleUrl: './change-password-dialog.component.css'
})
export class ChangePasswordDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<ChangePasswordDialogComponent>);
    private userService = inject(UserService);
    private snackBar = inject(MatSnackBar);

    form: FormGroup;
    hideCurrent = true;
    hideNew = true;
    hideConfirm = true;
    submitting = false;

    constructor() {
        this.form = this.fb.group({
            current_password: ['', Validators.required],
            new_password: ['', [Validators.required, Validators.minLength(6)]],
            confirm_password: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    passwordMatchValidator(g: FormGroup) {
        const newP = g.get('new_password')?.value;
        const confirm = g.get('confirm_password')?.value;
        if (confirm === '') return null;
        return newP === confirm ? null : { mismatch: true };
    }

    submit() {
        if (this.form.invalid || this.submitting) return;
        this.submitting = true;
        const v = this.form.getRawValue();
        this.userService.updateMyPassword(v.current_password, v.new_password).subscribe({
            next: () => {
                this.snackBar.open('Mot de passe mis à jour', 'OK', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.submitting = false;
                const msg = err.error?.detail || 'Erreur lors du changement de mot de passe';
                this.snackBar.open(msg, 'Fermer', { duration: 4000 });
            }
        });
    }

    close() {
        this.dialogRef.close();
    }
}

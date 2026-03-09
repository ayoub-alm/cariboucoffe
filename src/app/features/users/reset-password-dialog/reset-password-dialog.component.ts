import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';

@Component({
    selector: 'app-reset-password-dialog',
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
    templateUrl: './reset-password-dialog.component.html',
    styleUrl: './reset-password-dialog.component.css'
})
export class ResetPasswordDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<ResetPasswordDialogComponent>);
    private userService = inject(UserService);
    private snackBar = inject(MatSnackBar);

    form: FormGroup;
    hideNew = true;
    hideConfirm = true;
    submitting = false;

    constructor(@Inject(MAT_DIALOG_DATA) public user: User) {
        this.form = this.fb.group({
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
        this.userService.resetUserPassword(this.user.id!, v.new_password).subscribe({
            next: () => {
                this.snackBar.open('Mot de passe réinitialisé', 'OK', { duration: 3000 });
                this.dialogRef.close(true);
            },
            error: (err) => {
                this.submitting = false;
                const msg = err.error?.detail || 'Erreur lors de la réinitialisation';
                this.snackBar.open(msg, 'Fermer', { duration: 4000 });
            }
        });
    }

    close() {
        this.dialogRef.close();
    }
}

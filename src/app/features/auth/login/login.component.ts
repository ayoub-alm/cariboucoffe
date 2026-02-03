import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule,
        NgIf
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    private fb = inject(FormBuilder);
    private router = inject(Router);

    hidePassword = true;
    isLoading = false;

    loginForm = this.fb.group({
        email: ['admin@caribou.ma', [Validators.required, Validators.email]],
        password: ['password', [Validators.required]]
    });

    onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading = true;

            // Simulate API call
            setTimeout(() => {
                console.log('Login successful with:', this.loginForm.value);
                this.isLoading = false;
                this.router.navigate(['/dashboard']);
            }, 1500);
        }
    }
}

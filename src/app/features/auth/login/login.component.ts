import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, ActivatedRoute } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-login',
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
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    hidePassword = true;
    isLoading = false;
    error: string | null = null;

    loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    onSubmit() {
        if (this.loginForm.valid) {
            this.isLoading = true;
            this.error = null;

            const formData = new FormData();
            formData.append('username', this.loginForm.value.email || '');
            formData.append('password', this.loginForm.value.password || '');

            this.authService.loginAndFetchUser(formData).subscribe({
                next: () => {
                    this.isLoading = false;
                    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
                    this.router.navigateByUrl(returnUrl);
                },
                error: (err) => {
                    this.isLoading = false;
                    this.error = 'Login failed. Please check your credentials.';
                    console.error('Login error:', err);
                }
            });
        }
    }
}

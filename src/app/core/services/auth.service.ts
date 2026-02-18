import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { API_URL } from '../constants';
import { User, LoginResponse, UserRole } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    // Signals for state management
    currentUser = signal<User | null>(null);
    token = signal<string | null>(localStorage.getItem('access_token'));

    isAuthenticated = computed(() => !!this.token());
    isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

    constructor() {
        if (this.token()) {
            this.fetchCurrentUser().subscribe();
        }
    }

    login(data: FormData): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${API_URL}/login/access-token`, data).pipe(
            tap((res) => {
                this.setSession(res);
            }),
            catchError(this.handleError)
        );
    }

    loginAndFetchUser(data: FormData): Observable<User> {
        return this.login(data).pipe(
            // Switch to fetching current user
            switchMap(() => this.fetchCurrentUser()),
            catchError(this.handleError)
        );
    }

    logout() {
        localStorage.removeItem('access_token');
        this.token.set(null);
        this.currentUser.set(null);
        this.router.navigate(['/login']);
    }

    private setSession(authResult: LoginResponse) {
        localStorage.setItem('access_token', authResult.access_token);
        this.token.set(authResult.access_token);
    }

    fetchCurrentUser(): Observable<User> {
        return this.http.get<User>(`${API_URL}/users/me`).pipe(
            tap(user => this.currentUser.set(user)),
            catchError(err => {
                this.logout();
                return throwError(() => err);
            })
        );
    }

    private handleError(error: HttpErrorResponse) {
        return throwError(() => new Error(error.message || 'Server Error'));
    }
}

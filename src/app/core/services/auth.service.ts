import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, firstValueFrom, of } from 'rxjs';
import { tap, catchError, switchMap, shareReplay, map } from 'rxjs/operators';
import { API_URL } from '../constants';
import { User, LoginResponse, UserRole } from '../models/user.model';
import { ConfigService } from './config.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private configService = inject(ConfigService);

    currentUser = signal<User | null>(null);
    token = signal<string | null>(localStorage.getItem('access_token'));
    initialized = signal(false);

    isAuthenticated = computed(() => !!this.token());
    isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);
    userRole = computed(() => this.currentUser()?.role ?? null);

    private pendingUserRequest: Promise<User | null> | null = null;

    constructor() {
        if (this.token()) {
            this.ensureUser().then(() => this.initialized.set(true));
        } else {
            this.initialized.set(true);
        }
    }

    login(data: FormData): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${API_URL}/login/access-token`, data).pipe(
            tap((res) => this.setSession(res)),
            catchError(this.handleError)
        );
    }

    loginAndFetchUser(data: FormData): Observable<User | null> {
        return this.login(data).pipe(
            switchMap(() => this.fetchCurrentUser()),
            catchError(this.handleError)
        );
    }

    logout() {
        localStorage.removeItem('access_token');
        this.token.set(null);
        this.currentUser.set(null);
        this.pendingUserRequest = null;
        this.router.navigate(['/login']);
    }

    private setSession(authResult: LoginResponse) {
        localStorage.setItem('access_token', authResult.access_token);
        this.token.set(authResult.access_token);
    }

    fetchCurrentUser(): Observable<User | null> {
        if (!this.token()) {
            this.currentUser.set(null);
            return of(null);
        }
        return this.http.get<User>(`${API_URL}/users/me`).pipe(
            tap(user => this.currentUser.set(user)),
            switchMap(user => {
                if (!user) return of(null);
                // Pre-fetch thresholds so they are always ready when user is loaded
                return this.configService.getThresholds().pipe(
                    map(() => user),
                    catchError(() => of(user))
                );
            }),
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401 || err.status === 403) {
                    localStorage.removeItem('access_token');
                    this.token.set(null);
                    this.currentUser.set(null);
                }
                return throwError(() => err);
            })
        );
    }

    async ensureUser(): Promise<User | null> {
        if (this.currentUser()) {
            return this.currentUser();
        }
        if (!this.token()) {
            return null;
        }
        if (this.pendingUserRequest) {
            return this.pendingUserRequest;
        }
        this.pendingUserRequest = firstValueFrom(this.fetchCurrentUser())
            .then(user => {
                this.pendingUserRequest = null;
                return user;
            })
            .catch(() => {
                this.pendingUserRequest = null;
                return null;
            });
        return this.pendingUserRequest;
    }

    hasRole(...roles: UserRole[]): boolean {
        const user = this.currentUser();
        return !!user && roles.includes(user.role);
    }

    private handleError(error: HttpErrorResponse) {
        return throwError(() => new Error(error.message || 'Server Error'));
    }
}

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_URL } from '../constants';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const token = localStorage.getItem('access_token');
    const isApiUrl = req.url.startsWith(API_URL);

    if (token && isApiUrl) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            const isAuthEndpoint = req.url.includes('/users/me') || req.url.includes('/login/');
            if (error.status === 401 && !isAuthEndpoint) {
                localStorage.removeItem('access_token');
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};

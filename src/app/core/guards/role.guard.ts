import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export function roleGuard(...allowedRoles: (UserRole | string)[]): CanActivateFn {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const user = authService.currentUser();
        if (!user) {
            return router.createUrlTree(['/login']);
        }

        // 1. ADMIN always has full access regardless of the list
        if (user.role === UserRole.ADMIN) {
            return true;
        }

        // 2. Perform case-insensitive check for robustness
        const currentRole = (user.role || '').toString().toUpperCase();
        const isAllowed = allowedRoles.some(role => {
            if (!role) return false;
            const allowedStr = String(role).toUpperCase();
            return currentRole === allowedStr;
        });


        if (isAllowed) {
            return true;
        }

        // 3. Fallback to dashboard
        return router.createUrlTree(['/dashboard']);
    };
}


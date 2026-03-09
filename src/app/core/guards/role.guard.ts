import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
    return (route, state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const user = authService.currentUser();
        if (!user) {
            return router.createUrlTree(['/login']);
        }

        if (allowedRoles.includes(user.role)) {
            return true;
        }

        return router.createUrlTree(['/dashboard']);
    };
}

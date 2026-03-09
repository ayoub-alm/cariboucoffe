import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        return router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
        });
    }

    if (!authService.currentUser()) {
        const user = await authService.ensureUser();
        if (!user) {
            return router.createUrlTree(['/login'], {
                queryParams: { returnUrl: state.url }
            });
        }
    }

    return true;
};

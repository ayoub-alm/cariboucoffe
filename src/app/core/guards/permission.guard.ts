import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole, UserPermissions } from '../models/user.model';

type ModuleKey = keyof UserPermissions;
type ActionKey = 'read' | 'create' | 'update' | 'delete';

/**
 * Guard that allows access if:
 *  - The user has one of the explicitly allowed roles (e.g. ADMIN always passes), OR
 *  - The user has the required permission(s) granted in their UserRights record.
 *
 * Usage:
 *   canActivate: [permissionGuard({ module: 'coffees', action: 'read' })]
 *   canActivate: [permissionGuard({ module: 'coffees', action: 'read' }, { module: 'categories', action: 'read' })]
 *   // passes if the user satisfies ANY of the provided checks
 */
export interface PermissionCheck {
    module: ModuleKey;
    action: ActionKey;
}

export function permissionGuard(
    ...checks: PermissionCheck[]
): CanActivateFn {
    return (_route, _state) => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const user = authService.currentUser();
        if (!user) {
            return router.createUrlTree(['/login']);
        }

        // ADMIN always has full access
        if (user.role === UserRole.ADMIN) {
            return true;
        }

        // Check if user satisfies ANY of the permission checks
        const perms = user.permissions;
        const allowed = checks.some(({ module, action }) => {
            return !!(perms as any)?.[module]?.[action];
        });

        if (allowed) {
            return true;
        }

        return router.createUrlTree(['/dashboard']);
    };
}

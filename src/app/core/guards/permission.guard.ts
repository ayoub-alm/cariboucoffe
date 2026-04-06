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

        // 1. ADMIN always has full access
        if (user.role === UserRole.ADMIN) {
            return true;
        }

        // 2. Default permissions based on roles for specific modules
        // This ensures AUDITOR can toujours manage audits even without explicit UserRights entry
        const hasModuleRole = checks.some(({ module, action }) => {
            if (module === 'audits') {
                if (user.role === UserRole.AUDITOR && (action === 'create' || action === 'update' || action === 'read')) return true;
                if (user.role === UserRole.BOSS && action === 'read') return true;
            }
            if (module === 'coffees') {
                if (user.role === UserRole.BOSS || user.role === UserRole.MANAGER) return true;
            }
            return false;
        });

        if (hasModuleRole) {
            return true;
        }

        // 3. Check explicit permissions in UserRights
        const perms = user.permissions;
        if (perms) {
            const allowed = checks.some(({ module, action }) => {
                return !!(perms as any)?.[module]?.[action];
            });

            if (allowed) {
                return true;
            }
        }

        return router.createUrlTree(['/dashboard']);
    };
}


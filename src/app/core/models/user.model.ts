/**
 * User Models - User management and authentication
 */

/** User role enumeration */
export enum UserRole {
    ADMIN = 'ADMIN',
    AUDITOR = 'AUDITOR',
    MANAGER = 'MANAGER',
    BOSS = 'BOSS',
    VIEWER = 'VIEWER',
    CONTROLLER = 'CONTROLLER'
}

/** Per-action permissions for a single module */
export interface ModulePermissions {
    read: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
}

/** Full permissions map keyed by module name */
export interface UserPermissions {
    coffees: ModulePermissions;
    audits: ModulePermissions;
    users: ModulePermissions;
    categories: ModulePermissions;
    questions: ModulePermissions;
}

/** Main user interface */
export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    role: UserRole;
    coffee_id?: number;
    managed_coffee_ids?: number[];
    createdAt?: string;
    coffee?: {
        id: number;
        name: string;
        location?: string;
    };
    receive_daily_report?: boolean;
    receive_weekly_report?: boolean;
    receive_monthly_report?: boolean;
    permissions?: UserPermissions | null;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

/** User creation payload */
export interface UserCreate {
    email: string;
    password: string;
    full_name: string;
    role: UserRole;
    coffee_id?: number;
    managed_coffee_ids?: number[];
}

/** User update payload */
export interface UserUpdate {
    email?: string;
    full_name?: string;
    role?: UserRole;
    coffee_id?: number;
    managed_coffee_ids?: number[];
    is_active?: boolean;
    receive_daily_report?: boolean;
    receive_weekly_report?: boolean;
    receive_monthly_report?: boolean;
}

/**
 * Helper functions for user models
 */

/** Get role display name */
export function getRoleDisplayName(role: UserRole): string {
    switch (role) {
        case UserRole.ADMIN:
            return 'Administrateur';
        case UserRole.AUDITOR:
            return 'Auditeur';
        case UserRole.MANAGER:
            return 'Manager';
        case UserRole.BOSS:
            return 'Directeur';
        case UserRole.VIEWER:
            return 'Visualiseur';
        case UserRole.CONTROLLER:
            return 'Contrôleur';
        default:
            return role;
    }
}

/** Get role color for UI */
export function getRoleColor(role: UserRole): string {
    switch (role) {
        case UserRole.ADMIN:
            return 'primary';
        case UserRole.AUDITOR:
            return 'accent';
        case UserRole.MANAGER:
            return 'primary';
        case UserRole.BOSS:
            return 'accent';
        case UserRole.VIEWER:
            return 'warn';
        case UserRole.CONTROLLER:
            return 'accent';
        default:
            return 'default';
    }
}

export function isAdmin(user: User | null): boolean {
    return user?.role === UserRole.ADMIN;
}

export function canCreateAudits(user: User | null): boolean {
    if (!user) return false;
    if (user.role === UserRole.ADMIN || user.role === UserRole.AUDITOR) return true;
    if (user.permissions?.audits?.create) return true;
    return false;
}

export function canSeeDashboard(user: User | null): boolean {
    return !!user;
}

export function canSeeAllAudits(user: User | null): boolean {
    return !!user && [UserRole.ADMIN, UserRole.BOSS].includes(user.role);
}

/** Get user initials for avatar */
export function getUserInitials(user: User): string {
    if (!user.full_name) {
        return user.email.substring(0, 2).toUpperCase();
    }
    const names = user.full_name.split(' ');
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
    }
    return user.full_name.substring(0, 2).toUpperCase();
}

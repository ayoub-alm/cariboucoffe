export interface User {
    id: number;
    email: string;
    full_name?: string;
    is_active: boolean;
    role: UserRole;
    coffee_id?: number;
    createdAt?: string;
    coffee?: {
        id: number;
        name: string;
    };
}

export enum UserRole {
    ADMIN = 'ADMIN',
    AUDITOR = 'AUDITOR',
    VIEWER = 'VIEWER'
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}

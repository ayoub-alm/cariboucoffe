export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    phone?: string;
    coffeeShop?: string;
    status: 'active' | 'inactive';
    createdAt: Date;
    lastLogin?: Date;
}

export type UserRole = 'Admin' | 'Auditeur' | 'Manager' | 'Staff';

import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private users = signal<User[]>(this.generateMockUsers());

    getUsers(): Observable<User[]> {
        return of(this.users()).pipe(delay(300));
    }

    getUserById(id: string): Observable<User | undefined> {
        const user = this.users().find(u => u.id === id);
        return of(user).pipe(delay(200));
    }

    private generateMockUsers(): User[] {
        return [
            {
                id: 'u1',
                firstName: 'Ilham',
                lastName: 'Yardi',
                email: 'ilham.yardi@caribou.ma',
                role: 'Auditeur',
                phone: '+212 6 12 34 56 78',
                coffeeShop: 'Caribou CASA VOYAGEUR',
                status: 'active',
                createdAt: new Date('2025-01-15'),
                lastLogin: new Date('2026-02-03')
            },
            {
                id: 'u2',
                firstName: 'Karim',
                lastName: 'Benali',
                email: 'karim.benali@caribou.ma',
                role: 'Manager',
                phone: '+212 6 23 45 67 89',
                coffeeShop: 'Caribou ANFA',
                status: 'active',
                createdAt: new Date('2024-11-20'),
                lastLogin: new Date('2026-02-02')
            },
            {
                id: 'u3',
                firstName: 'Sara',
                lastName: 'Alami',
                email: 'sara.alami@caribou.ma',
                role: 'Auditeur',
                phone: '+212 6 34 56 78 90',
                status: 'active',
                createdAt: new Date('2025-03-10'),
                lastLogin: new Date('2026-02-01')
            },
            {
                id: 'u4',
                firstName: 'Ahmed',
                lastName: 'Tazi',
                email: 'ahmed.tazi@caribou.ma',
                role: 'Admin',
                phone: '+212 6 45 67 89 01',
                status: 'active',
                createdAt: new Date('2024-06-01'),
                lastLogin: new Date('2026-02-03')
            },
            {
                id: 'u5',
                firstName: 'Fatima',
                lastName: 'Zahra',
                email: 'fatima.zahra@caribou.ma',
                role: 'Staff',
                phone: '+212 6 56 78 90 12',
                coffeeShop: 'Caribou MAARIF',
                status: 'active',
                createdAt: new Date('2025-08-12'),
                lastLogin: new Date('2026-01-30')
            },
            {
                id: 'u6',
                firstName: 'Youssef',
                lastName: 'Mansouri',
                email: 'youssef.mansouri@caribou.ma',
                role: 'Staff',
                phone: '+212 6 67 89 01 23',
                coffeeShop: 'Caribou RABAT AGDAL',
                status: 'inactive',
                createdAt: new Date('2024-12-05'),
                lastLogin: new Date('2025-12-20')
            }
        ];
    }
}

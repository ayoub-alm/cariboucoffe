import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, UserRole } from '../models/user.model';
import { API_URL } from '../constants';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);

    getUsers(): Observable<User[]> {
        return this.http.get<User[]>(`${API_URL}/users`);
    }

    getUserById(id: number): Observable<User> {
        return this.http.get<User>(`${API_URL}/users/${id}`);
    }

    createUser(user: Partial<User>): Observable<User> {
        // We probably need a specific DTO for create (with password), but frontend model might not have password.
        // Assuming generic User object for now.
        return this.http.post<User>(`${API_URL}/users`, user);
    }

    updateUser(id: number, user: Partial<User>): Observable<User> {
        return this.http.put<User>(`${API_URL}/users/${id}`, user);
    }

    /** Change the current user's password. */
    updateMyPassword(currentPassword: string, newPassword: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${API_URL}/users/me/password`, {
            current_password: currentPassword,
            new_password: newPassword
        });
    }

    /** Admin: set a user's password (reset without current password). */
    resetUserPassword(userId: number, newPassword: string): Observable<{ message: string }> {
        return this.http.patch<{ message: string }>(`${API_URL}/users/${userId}/password`, {
            new_password: newPassword
        });
    }

    deleteUser(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/users/${id}`);
    }

    sendUserReport(userId: number, days: number): Observable<any> {
        return this.http.post(`${API_URL}/users/${userId}/send-report`, { days });
    }
}

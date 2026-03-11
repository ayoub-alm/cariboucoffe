import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPermissions } from '../models/user.model';
import { API_URL } from '../constants';

export type ModuleKey = 'coffees' | 'audits' | 'users' | 'categories' | 'questions';

@Injectable({
    providedIn: 'root'
})
export class UserRightsService {
    private http = inject(HttpClient);

    getUserRights(userId: number): Observable<UserPermissions> {
        return this.http.get<UserPermissions>(`${API_URL}/user-rights/${userId}`);
    }

    updateUserRights(userId: number, permissions: Partial<UserPermissions>): Observable<UserPermissions> {
        return this.http.put<UserPermissions>(`${API_URL}/user-rights/${userId}`, permissions);
    }
}

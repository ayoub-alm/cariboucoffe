import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

/**
 * Example service showing how to use the environment configuration
 * for API calls. You can use this pattern in all your services.
 */
@Injectable({
    providedIn: 'root'
})
export class ApiService {
    private readonly apiUrl = environment.apiBaseUrl;

    constructor(private http: HttpClient) { }

    // Example method - replace with your actual API endpoints
    getData() {
        return this.http.get(`${this.apiUrl}/your-endpoint`);
    }

    // Example POST method
    postData(data: any) {
        return this.http.post(`${this.apiUrl}/your-endpoint`, data);
    }
}

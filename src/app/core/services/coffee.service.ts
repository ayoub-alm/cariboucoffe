import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';

export interface Coffee {
    id: number;
    name: string;
    location: string;
    active: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CoffeeService {
    private http = inject(HttpClient);

    getCoffees(): Observable<Coffee[]> {
        return this.http.get<Coffee[]>(`${API_URL}/coffees/`);
    }

    createCoffee(coffee: Partial<Coffee>): Observable<Coffee> {
        return this.http.post<Coffee>(`${API_URL}/coffees/`, coffee);
    }
}

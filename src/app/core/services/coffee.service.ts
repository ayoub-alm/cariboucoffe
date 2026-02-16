import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import { Coffee, CoffeeCreate, CoffeeUpdate } from '../models/coffee.model';

@Injectable({
    providedIn: 'root'
})
export class CoffeeService {
    private http = inject(HttpClient);

    getCoffees(skip = 0, limit = 100): Observable<Coffee[]> {
        return this.http.get<Coffee[]>(`${API_URL}/coffees`);
    }

    createCoffee(coffee: CoffeeCreate): Observable<Coffee> {
        return this.http.post<Coffee>(`${API_URL}/coffees`, coffee);
    }

    updateCoffee(id: number, coffee: CoffeeUpdate): Observable<Coffee> {
        return this.http.put<Coffee>(`${API_URL}/coffees/${id}`, coffee);
    }

    deleteCoffee(id: number): Observable<Coffee> {
        return this.http.delete<Coffee>(`${API_URL}/coffees/${id}`);
    }
}

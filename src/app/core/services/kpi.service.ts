import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import { KPIData } from '../models/kpi.model';

@Injectable({
    providedIn: 'root'
})
export class KpiService {
    private http = inject(HttpClient);

    getKPI(): Observable<KPIData> {
        return this.http.get<KPIData>(`${API_URL}/kpi`);
    }

    exportMonthlyKPIs(filters?: { startDate?: string | null; endDate?: string | null; coffeeShop?: string | null }): Observable<Blob> {
        const params: any = {};
        if (filters) {
            if (filters.startDate) params.start_date = filters.startDate;
            if (filters.endDate) params.end_date = filters.endDate;
            if (filters.coffeeShop) params.coffee_shop = filters.coffeeShop;
        }
        return this.http.get(`${API_URL}/kpi/export-monthly-excel`, {
            params,
            responseType: 'blob'
        });
    }
}

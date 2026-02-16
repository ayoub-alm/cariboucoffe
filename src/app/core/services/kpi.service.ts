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
}

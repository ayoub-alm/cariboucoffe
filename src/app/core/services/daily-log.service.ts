import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_URL } from '../constants';

export interface DailyTimeRecord {
    id: number;
    date: string;
    opening_time: string;
    closing_time: string;
    coffee_id: number;
    controller_id: number;
    score: number;          // computed by backend
    status: 'green' | 'orange' | 'red'; // computed by backend
}

export interface DailyTimeRecordCreate {
    date: string;
    opening_time: string;
    closing_time: string;
    coffee_id: number;
}

export interface DailyLogListResponse {
    items: DailyTimeRecord[];
    total: number;
    page: number;
    size: number;
    pages: number;
    /** Average compliance score over ALL filtered records (not just current page) */
    average_score: number;
    late_openings: number;
    early_closures: number;
    monthly_average: number;
    weekly_average: number;
}

@Injectable({
    providedIn: 'root'
})
export class DailyLogService {
    private http = inject(HttpClient);

    /**
     * Fetch paginated daily logs with pre-computed KPI stats.
     * The `items` array contains only the current page.
     * Stats fields (average_score, late_openings, etc.) are computed over ALL filtered records.
     */
    getLogs(
        filters?: { coffee_id?: number; start_date?: string; end_date?: string },
        page = 1,
        size = 25,
    ): Observable<DailyLogListResponse> {
        const params: any = { page, size };
        if (filters) {
            if (filters.coffee_id !== undefined && filters.coffee_id !== null) {
                params.coffee_id = filters.coffee_id.toString();
            }
            if (filters.start_date) params.start_date = filters.start_date;
            if (filters.end_date)   params.end_date   = filters.end_date;
        }
        return this.http.get<DailyLogListResponse>(`${API_URL}/daily-logs`, { params });
    }

    /**
     * Fetch ALL matching logs as a plain array (no pagination).
     * Use for calendar views, dashboards, and CSV exports.
     */
    getAllLogs(
        filters?: { coffee_id?: number; start_date?: string; end_date?: string },
    ): Observable<DailyTimeRecord[]> {
        return this.getLogs(filters, 1, 10000).pipe(map(r => r.items));
    }

    createLog(log: DailyTimeRecordCreate): Observable<DailyTimeRecord> {
        return this.http.post<DailyTimeRecord>(`${API_URL}/daily-logs`, log);
    }

    deleteLog(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/daily-logs/${id}`);
    }
}

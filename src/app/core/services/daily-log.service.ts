import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';

export interface DailyTimeRecord {
    id: number;
    date: string;
    opening_time: string;
    closing_time: string;
    coffee_id: number;
    controller_id: number;
}

export interface DailyTimeRecordCreate {
    date: string;
    opening_time: string;
    closing_time: string;
    coffee_id: number;
}

@Injectable({
    providedIn: 'root'
})
export class DailyLogService {
    private http = inject(HttpClient);

    getLogs(filters?: { coffee_id?: number; start_date?: string; end_date?: string; limit?: number; skip?: number }): Observable<DailyTimeRecord[]> {
        const params: any = {};
        if (filters) {
            if (filters.coffee_id !== undefined && filters.coffee_id !== null) {
                params.coffee_id = filters.coffee_id.toString();
            }
            if (filters.start_date) {
                params.start_date = filters.start_date;
            }
            if (filters.end_date) {
                params.end_date = filters.end_date;
            }
            if (filters.limit !== undefined) {
                params.limit = filters.limit.toString();
            }
            if (filters.skip !== undefined) {
                params.skip = filters.skip.toString();
            }
        }
        return this.http.get<DailyTimeRecord[]>(`${API_URL}/daily-logs`, { params });
    }

    createLog(log: DailyTimeRecordCreate): Observable<DailyTimeRecord> {
        return this.http.post<DailyTimeRecord>(`${API_URL}/daily-logs`, log);
    }
}

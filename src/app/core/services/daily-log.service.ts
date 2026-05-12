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

    getLogs(): Observable<DailyTimeRecord[]> {
        return this.http.get<DailyTimeRecord[]>(`${API_URL}/daily-logs`);
    }

    createLog(log: DailyTimeRecordCreate): Observable<DailyTimeRecord> {
        return this.http.post<DailyTimeRecord>(`${API_URL}/daily-logs`, log);
    }
}

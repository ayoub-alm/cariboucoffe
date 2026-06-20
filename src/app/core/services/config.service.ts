import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../constants';

export interface ConformityThreshold {
    id: number;
    conforme_min: number;
    partiel_min: number;
    updated_at: string;
}

export interface ScheduleThreshold {
    id: number;
    green_min: number;
    orange_min: number;
    updated_at: string;
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private http = inject(HttpClient);
    
    // Signal for audit conformity thresholds
    thresholds = signal<ConformityThreshold | null>(null);

    // Signal for schedule thresholds
    scheduleThresholds = signal<ScheduleThreshold | null>(null);

    // ── Audit conformity thresholds ──────────────────────────────────────────

    getThresholds(): Observable<ConformityThreshold> {
        return this.http.get<ConformityThreshold>(`${API_URL}/config/conformity`).pipe(
            tap(data => this.thresholds.set(data))
        );
    }

    updateThresholds(data: Partial<ConformityThreshold>): Observable<ConformityThreshold> {
        return this.http.patch<ConformityThreshold>(`${API_URL}/config/conformity`, data).pipe(
            tap(updated => this.thresholds.set(updated))
        );
    }

    // ── Schedule thresholds ───────────────────────────────────────────────────

    getScheduleThresholds(): Observable<ScheduleThreshold> {
        return this.http.get<ScheduleThreshold>(`${API_URL}/config/schedule-thresholds`).pipe(
            tap(data => this.scheduleThresholds.set(data))
        );
    }

    updateScheduleThresholds(data: Partial<ScheduleThreshold>): Observable<ScheduleThreshold> {
        return this.http.patch<ScheduleThreshold>(`${API_URL}/config/schedule-thresholds`, data).pipe(
            tap(updated => this.scheduleThresholds.set(updated))
        );
    }

    /** Max tolerable lost minutes for green / orange schedule status. */
    getScheduleThresholdsOrDefaults(): { greenMaxLoss: number; orangeMaxLoss: number } {
        const t = this.scheduleThresholds();
        return {
            greenMaxLoss: t?.green_min ?? 0,
            orangeMaxLoss: t?.orange_min ?? 60,
        };
    }

    getScheduleStatus(lostMinutes: number, lateMinutes = lostMinutes, earlyMinutes = 0): 'green' | 'orange' | 'red' {
        const { greenMaxLoss, orangeMaxLoss } = this.getScheduleThresholdsOrDefaults();
        const worstViolation = Math.max(lateMinutes, earlyMinutes);
        if (worstViolation <= greenMaxLoss) return 'green';
        if (worstViolation <= orangeMaxLoss) return 'orange';
        return 'red';
    }

    getScheduleConformityLabel(status: 'green' | 'orange' | 'red'): string {
        if (status === 'green') return 'Conforme';
        if (status === 'orange') return 'Partiel';
        return 'Non-conforme';
    }

    /**
     * Helper to get audit status based on score and current thresholds
     */
    getAuditStatus(score: number): 'Conforme' | 'Partiel' | 'Non-conforme' {
        const t = this.thresholds();
        if (!t) {
            if (score >= 90) return 'Conforme';
            if (score >= 70) return 'Partiel';
            return 'Non-conforme';
        }
        if (score >= t.conforme_min) return 'Conforme';
        if (score >= t.partiel_min) return 'Partiel';
        return 'Non-conforme';
    }
}

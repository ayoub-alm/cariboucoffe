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

@Injectable({
    providedIn: 'root'
})
export class ConfigService {
    private http = inject(HttpClient);
    
    // Signal for thresholds to be used across the app
    thresholds = signal<ConformityThreshold | null>(null);

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

    /**
     * Helper to get status based on score and current thresholds
     */
    getAuditStatus(score: number): 'Conforme' | 'Partiel' | 'Non-conforme' {
        const t = this.thresholds();
        if (!t) {
            // Fallback to defaults
            if (score >= 90) return 'Conforme';
            if (score >= 70) return 'Partiel';
            return 'Non-conforme';
        }

        if (score >= t.conforme_min) return 'Conforme';
        if (score >= t.partiel_min) return 'Partiel';
        return 'Non-conforme';
    }
}

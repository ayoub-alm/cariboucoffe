import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { API_URL, STATIC_URL } from '../constants';
import { AuditDTO, AuditCreateDTO, AuditUI, AuditCategory } from '../models/audit.model';
import { Category, Question } from '../models/category.model';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private http = inject(HttpClient);

    getAudits(): Observable<AuditUI[]> {
        return this.http.get<AuditDTO[]>(`${API_URL}/audits`).pipe(
            // Pass includeImages=false for list view – avoids loading large blobs for all audits
            map(dtos => dtos.map(dto => this.mapToUI(dto, false)))
        );
    }

    getAudit(id: number): Observable<AuditUI> {
        return this.http.get<AuditDTO>(`${API_URL}/audits/${id}`).pipe(
            map(dto => this.mapToUI(dto, true))
        );
    }

    createAudit(auditUI: AuditUI): Observable<AuditDTO> {
        const payload = this.mapToCreateDTO(auditUI);
        return this.http.post<AuditDTO>(`${API_URL}/audits`, payload);
    }

    deleteAudit(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/audits/${id}`);
    }

    updateAudit(id: number, auditUI: AuditUI): Observable<AuditDTO> {
        const payload = this.mapToCreateDTO(auditUI);
        return this.http.put<AuditDTO>(`${API_URL}/audits/${id}`, payload);
    }

    /**
     * Fetch categories and questions from backend to build audit template
     */
    getAuditTemplate(): Observable<AuditCategory[]> {
        return forkJoin({
            categories: this.http.get<Category[]>(`${API_URL}/categories`),
            questions: this.http.get<Question[]>(`${API_URL}/questions`)
        }).pipe(
            map(({ categories, questions }) => {
                return categories.map(cat => ({
                    name: cat.name,
                    items: questions
                        .filter(q => q.category_id === cat.id)
                        .map(q => ({
                            label: q.text,
                            status: null,
                            remarks: '',
                            backendId: q.id,
                            numericValue: 0,
                            weight: q.weight,
                            correct_answer: q.correct_answer,
                            na_score: q.na_score
                        }))
                }));

            })
        );
    }

    /**
     * Converts a stored photo_url to a fully-qualified URL that the browser can load.
     *
     * The backend saves images as relative paths: /static/uploads/<uuid>.jpg
     * We prefix them with the backend static base URL.
     *
     * Legacy audits may have stored raw base64 data URIs directly in photo_url.
     * In list mode we skip those to avoid freezing the browser.
     */
    private resolveImageUrl(photoUrl: string | undefined | null, includeImages: boolean): string | undefined {
        if (!photoUrl) return undefined;

        // Already a data URI (base64) — only use in detail view
        if (photoUrl.startsWith('data:')) {
            return includeImages ? photoUrl : undefined;
        }

        // Relative path from backend (e.g. /static/uploads/xyz.jpg)
        if (photoUrl.startsWith('/')) {
            return `${STATIC_URL}${photoUrl}`;
        }

        // Already an absolute URL
        return photoUrl;
    }

    private mapToUI(dto: AuditDTO, includeImages = true): AuditUI {
        // Build categories from backend data if answers exist
        const categories: AuditCategory[] = [];

        if (dto.answers && dto.answers.length > 0) {
            // Group answers by category
            const categoryMap = new Map<number, any>();

            dto.answers.forEach(ans => {
                if (ans.question && ans.question.category) {
                    const catId = ans.question.category.id;
                    if (!categoryMap.has(catId)) {
                        categoryMap.set(catId, {
                            name: ans.question.category.name,
                            items: []
                        });
                    }

                    categoryMap.get(catId).items.push({
                        label: ans.question.text,
                        status: (ans.choice as any) || (ans.value >= 3 ? 'oui' : 'non'),
                        remarks: ans.comment || '',
                        backendId: ans.question_id,
                        numericValue: ans.value,
                        weight: ans.question.weight || 1,
                        correct_answer: ans.question.correct_answer,
                        na_score: ans.question.na_score,
                        photoData: this.resolveImageUrl(ans.photo_url, includeImages)
                    });

                }
            });

            categories.push(...Array.from(categoryMap.values()));
        }

        return {
            id: dto.id,
            date: new Date(dto.created_at),
            coffeeShop: dto.coffee.name,
            coffeeId: dto.coffee.id,
            auditorName: dto.auditor.full_name || dto.auditor.email,
            score: dto.score,
            categories: categories,
            status: dto.score >= 80 ? 'Conforme' : 'Non-conforme',
            shift: dto.shift,
            staffPresent: dto.staff_present,
            actionsCorrectives: dto.actions_correctives,
            trainingNeeds: dto.training_needs,
            purchases: dto.purchases,
            photoUrl: this.resolveImageUrl(dto.photo_url, includeImages)
        };
    }

    private mapToCreateDTO(ui: AuditUI): AuditCreateDTO {
        const answers: {
            question_id: number;
            value: number;
            choice: 'oui' | 'non' | 'n/a';
            comment?: string;
            photo_data?: string;
        }[] = [];

        for (const cat of ui.categories) {
            for (const item of cat.items) {
                // Use numericValue if available, otherwise convert status
                const value = item.numericValue !== undefined
                    ? item.numericValue
                    : (item.status === 'oui' ? 5 : 0);

                answers.push({
                    question_id: item.backendId || 0,
                    value: value,
                    choice: (item.status || 'non') as 'oui' | 'non' | 'n/a',
                    comment: item.remarks || '',
                    photo_data: item.photoData
                });

            }
        }

        return {
            coffee_id: ui.coffeeId || 1,
            shift: ui.shift,
            staff_present: ui.staffPresent,
            actions_correctives: ui.actionsCorrectives,
            training_needs: ui.trainingNeeds,
            purchases: ui.purchases,
            photo_data: ui.photoData,
            answers: answers
        };
    }
}

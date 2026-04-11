import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { API_URL, STATIC_URL } from '../constants';
import { AuditDTO, AuditCreateDTO, AuditUI, AuditCategory, AuditWorkflowStatus } from '../models/audit.model';
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

    downloadAuditPdf(id: number): Observable<Blob> {
        return this.http.get(`${API_URL}/audits/${id}/pdf`, { responseType: 'blob' });
    }

    createAudit(auditUI: AuditUI): Observable<AuditDTO> {
        const payload = this.mapToCreateDTO(auditUI);
        return this.http.post<AuditDTO>(`${API_URL}/audits`, payload);
    }

    deleteAudit(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/audits/${id}`);
    }

    deleteAudits(ids: number[]): Observable<any> {
        return this.http.post(`${API_URL}/audits/bulk-delete`, { ids });
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
                    icon: cat.icon,
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
     * Parse photo_url from backend which may be:
     * - null/undefined
     * - A single URL string (legacy): "/static/uploads/abc.jpg"
     * - A JSON array string: '["/static/uploads/a.jpg","/static/uploads/b.jpg"]'
     * - A base64 data URI (legacy)
     *
     * Returns a resolved array of full URLs.
     */
    private resolveImageUrls(photoUrl: string | undefined | null, includeImages: boolean): string[] {
        if (!photoUrl) return [];

        let rawUrls: string[];
        try {
            const parsed = JSON.parse(photoUrl);
            rawUrls = Array.isArray(parsed) ? parsed : [photoUrl];
        } catch {
            rawUrls = [photoUrl];
        }

        const resolved: string[] = [];
        for (const url of rawUrls) {
            if (!url) continue;
            if (url.startsWith('data:')) {
                if (includeImages) resolved.push(url);
            } else if (url.startsWith('/')) {
                resolved.push(`${STATIC_URL}${url}`);
            } else {
                resolved.push(url);
            }
        }
        return resolved;
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
                        status: (ans.choice === null || ans.choice === undefined) ? null : ans.choice,
                        remarks: ans.comment || '',
                        backendId: ans.question_id,
                        numericValue: ans.value,
                        weight: ans.question.weight || 1,
                        correct_answer: ans.question.correct_answer,
                        na_score: ans.question.na_score,
                        photoUrls: this.resolveImageUrls(ans.photo_url, includeImages)
                    });

                }
            });

            categories.push(...Array.from(categoryMap.values()));
        }

        return {
            id: dto.id,
            date: new Date(dto.date || dto.created_at),
            coffeeShop: dto.coffee.name,
            coffeeId: dto.coffee.id,
            auditorName: dto.auditor.full_name || dto.auditor.email,
            score: dto.score,
            categories: categories,
            workflowStatus: (dto.status as AuditWorkflowStatus) || 'IN_PROGRESS',
            status: dto.status === 'IN_PROGRESS' ? 'Partiel' : (dto.score >= 80 ? 'Conforme' : 'Non-conforme'),
            shift: dto.shift,
            staffPresent: dto.staff_present,
            actionsCorrectives: dto.actions_correctives,
            trainingNeeds: dto.training_needs,
            purchases: dto.purchases,
            photoUrls: this.resolveImageUrls(dto.photo_url, includeImages),
            createdAt: dto.created_at ? new Date(dto.created_at) : undefined
        };
    }

    private mapToCreateDTO(ui: AuditUI): AuditCreateDTO {
        const answers: {
            question_id: number;
            value: number;
            choice: 'oui' | 'non' | 'n/a';
            comment?: string;
            photo_data?: string[];
        }[] = [];

        for (const cat of ui.categories) {
            for (const item of cat.items) {
                const value = item.numericValue !== undefined
                    ? item.numericValue
                    : (item.status === 'oui' ? 5 : 0);

                answers.push({
                    question_id: item.backendId || 0,
                    value: value,
                    choice: item.status ? item.status : undefined as any,
                    comment: item.remarks || '',
                    photo_data: item.photosData?.length ? item.photosData : undefined
                });
            }
        }

        return {
            coffee_id: ui.coffeeId || 1,
            date: ui.date instanceof Date ? ui.date.toISOString() : (ui.date ? new Date(ui.date).toISOString() : undefined),
            status: ui.workflowStatus || 'IN_PROGRESS',
            shift: ui.shift,
            staff_present: ui.staffPresent,
            actions_correctives: ui.actionsCorrectives,
            training_needs: ui.trainingNeeds,
            purchases: ui.purchases,
            photo_data: ui.photosData?.length ? ui.photosData : undefined,
            existing_photo_urls: ui.existingPhotoUrls?.length ? ui.existingPhotoUrls : undefined,
            answers: answers
        };
    }
}

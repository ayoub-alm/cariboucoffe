import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, forkJoin } from 'rxjs';
import { API_URL } from '../constants';
import { AuditDTO, AuditCreateDTO, AuditUI, AuditCategory } from '../models/audit.model';
import { Category, Question } from '../models/category.model';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private http = inject(HttpClient);

    getAudits(): Observable<AuditUI[]> {
        return this.http.get<AuditDTO[]>(`${API_URL}/audits/`).pipe(
            map(dtos => dtos.map(dto => this.mapToUI(dto)))
        );
    }

    getAudit(id: number): Observable<AuditUI> {
        return this.http.get<AuditDTO>(`${API_URL}/audits/${id}`).pipe(
            map(dto => this.mapToUI(dto))
        );
    }

    createAudit(auditUI: AuditUI): Observable<AuditDTO> {
        const payload = this.mapToCreateDTO(auditUI);
        return this.http.post<AuditDTO>(`${API_URL}/audits/`, payload);
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
                            weight: q.weight
                        }))
                }));
            })
        );
    }

    private mapToUI(dto: AuditDTO): AuditUI {
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
                        status: ans.value >= 3 ? 'oui' : 'non',
                        remarks: ans.comment || '',
                        backendId: ans.question_id,
                        numericValue: ans.value,
                        weight: ans.question.weight || 1
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
            purchases: dto.purchases
        };
    }

    private mapToCreateDTO(ui: AuditUI): AuditCreateDTO {
        const answers = [];
        for (const cat of ui.categories) {
            for (const item of cat.items) {
                // Use numericValue if available, otherwise convert status
                const value = item.numericValue !== undefined
                    ? item.numericValue
                    : (item.status === 'oui' ? 5 : 0);

                answers.push({
                    question_id: item.backendId || 0,
                    value: value,
                    comment: item.remarks || ''
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
            answers: answers
        };
    }
}

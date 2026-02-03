import { Injectable, signal } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Audit, AuditStatus, AUDIT_CATEGORIES_TEMPLATE, AuditCategory, AuditQuestion } from '../models/audit.model';

@Injectable({
    providedIn: 'root'
})
export class AuditService {
    private audits = signal<Audit[]>(this.generateMockAudits());

    getAudits(): Observable<Audit[]> {
        return of(this.audits()).pipe(delay(500)); // Simulate API latency
    }

    getAuditById(id: string): Observable<Audit | undefined> {
        const audit = this.audits().find(a => a.id === id);
        return of(audit).pipe(delay(300));
    }

    private generateMockAudits(): Audit[] {
        const audits: Audit[] = [];

        // Specific Mock Audit: CARIBOU - CASA VOYAGEUR
        const casaVoyageurAudit: Audit = {
            id: 'audit-001',
            date: new Date('2026-01-28T08:25:00'),
            coffeeShop: 'Caribou CASA VOYAGEUR',
            auditor: 'ILHAM YARDI',
            shift: 'AM',
            staffPresent: 'Karim, Sara',
            score: 68,
            status: 'Non-conforme',
            categories: JSON.parse(JSON.stringify(AUDIT_CATEGORIES_TEMPLATE))
        };

        // Populate specific issues based on user context
        // h6: Absence de produits périmés ? -> 'non' (Issue present)
        this.updateCategoryItem(casaVoyageurAudit, 'hygiene', 'h6', 'non', 'produit mal stocker dans les frigo');
        this.updateCategoryItem(casaVoyageurAudit, 'staff', 's1', 'non', 'barbe non raser, chaussure différente couleur et pas noire');
        this.updateCategoryItem(casaVoyageurAudit, 'staff', 's2', 'non', 'Ayman pas de badge');
        // g1: Fond de caisse correct ? -> 'non'
        this.updateCategoryItem(casaVoyageurAudit, 'gestion', 'g1', 'non', 'il y a un plus de 173 dh. Ticket= 427,75 dh. Fond de caisse = 1000 dh. Coffre fort = 3245 dh');
        this.updateCategoryItem(casaVoyageurAudit, 'stock', 'st1', 'non', '1-Salle électrique mal organisée des objets inutiles sont stockés');

        audits.push(casaVoyageurAudit);

        // Generate random audits
        const shops = ['Caribou ANFA', 'Caribou MAARIF', 'Caribou RABAT AGDAL', 'Caribou MARRAKECH PLAZA'];
        const auditors = ['KARIM BEN', 'SARA ALAMI', 'AHMED TAZI'];

        for (let i = 0; i < 15; i++) {
            const score = Math.floor(Math.random() * (100 - 60 + 1)) + 60;
            audits.push({
                id: `audit-${i + 2}`,
                date: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
                coffeeShop: shops[Math.floor(Math.random() * shops.length)],
                auditor: auditors[Math.floor(Math.random() * auditors.length)],
                score: score,
                status: score > 85 ? 'Conforme' : 'Non-conforme',
                categories: [] // Omitted for brevity in list view, normally would be populated
            });
        }

        return audits;
    }

    private updateCategoryItem(audit: Audit, catId: string, itemId: string, response: 'oui' | 'non' | 'n/a', remarks: string) {
        const cat = audit.categories.find(c => c.id === catId);
        if (cat) {
            const item = cat.items.find(i => i.id === itemId);
            if (item) {
                item.status = response;
                item.remarks = remarks;
            }
        }
    }
}

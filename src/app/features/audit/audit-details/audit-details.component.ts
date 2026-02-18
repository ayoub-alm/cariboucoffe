import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuditService } from '../../../core/services/audit.service';
import { AuditUI as Audit, AuditCategory, AuditQuestion } from '../../../core/models/audit.model';

@Component({
    selector: 'app-audit-details',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        MatCardModule,
        MatChipsModule,
        MatListModule,
        MatProgressBarModule
    ],
    templateUrl: './audit-details.component.html',
    styleUrls: ['./audit-details.component.css']
})
export class AuditDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private auditService = inject(AuditService);

    audit: Audit | undefined;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.auditService.getAudit(+id).subscribe({
                next: (data) => {
                    this.audit = data;
                    console.log('Audit loaded:', data);
                },
                error: (err) => {
                    console.error('Audit not found', err);
                    this.router.navigate(['/audits']);
                }
            });
        }
    }

    goBack() {
        this.router.navigate(['/audits']);
    }

    getScoreClass(score: number): string {
        if (score >= 85) return 'score-success';
        if (score >= 70) return 'score-warning';
        return 'score-danger';
    }

    getTotalPoints(): { obtained: number, total: number } {
        if (!this.audit) return { obtained: 0, total: 0 };

        let obtained = 0;
        let total = 0;

        this.audit.categories.forEach(cat => {
            const catScore = this.getCategoryScore(cat);
            obtained += catScore.yes;
            total += catScore.total;
        });

        return { obtained, total };
    }

    hasNonConformity(cat: AuditCategory): boolean {
        return cat.items.some(i => i.status === 'non');
    }

    hasAnyNonConformity(): boolean {
        if (!this.audit) return false;
        return this.audit.categories.some(cat => this.hasNonConformity(cat));
    }


    getCategoryScore(cat: AuditCategory): { yes: number, total: number, percentage: number } {
        let obtainedScore = 0;
        let maxScore = 0;

        cat.items.forEach(item => {
            if (item.status === 'n/a') {
                return; // Skip N/A entirely
            }

            const weight = item.weight || 1;
            maxScore += weight;

            // Calculate obtained score based on choice
            if (item.status === 'oui') {
                obtainedScore += weight;
            }
            // 'non' gives 0 points
        });

        return {
            yes: obtainedScore,
            total: maxScore,
            percentage: maxScore > 0 ? (obtainedScore / maxScore) * 100 : 100
        };
    }

    getQuestionScoreClass(value: number | undefined): string {
        // This is no longer used with the new system, but keeping for compatibility
        if (value === undefined || value === null) return 'score-na';
        if (value >= 4) return 'score-excellent';
        if (value >= 3) return 'score-good';
        if (value >= 2) return 'score-average';
        return 'score-poor';
    }

    getQuestionScoreLabel(value: number | undefined): string {
        // This is no longer used with the new system, but keeping for compatibility
        if (value === undefined || value === null) return 'N/A';
        return `${value}/5`;
    }

    getQuestionStatus(item: AuditQuestion): string {
        if (item.status === 'oui') return 'Oui';
        if (item.status === 'non') return 'Non';
        if (item.status === 'n/a') return 'N/A';
        return '-';
    }

    getQuestionStatusClass(item: AuditQuestion): string {
        if (item.status === 'oui') return 'status-yes';
        if (item.status === 'non') return 'status-no';
        if (item.status === 'n/a') return 'status-na';
        return 'status-unknown';
    }

    getQuestionScore(item: AuditQuestion): number {
        const weight = item.weight || 1;
        if (item.status === 'oui') return weight;
        if (item.status === 'n/a' && item.na_score !== undefined) return item.na_score;
        return 0;
    }
}


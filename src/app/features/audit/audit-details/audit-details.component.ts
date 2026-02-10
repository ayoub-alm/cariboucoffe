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

    hasNonConformity(cat: AuditCategory): boolean {
        return cat.items.some(i => i.status === 'non' || (i.numericValue !== undefined && i.numericValue < 3));
    }

    getCategoryScore(cat: AuditCategory): { yes: number, total: number, percentage: number } {
        const scorable = cat.items.filter(i => i.numericValue !== undefined && i.numericValue !== null);
        const maxScore = scorable.length * 5; // Assuming max score is 5 per question
        const actualScore = scorable.reduce((sum, i) => sum + (i.numericValue || 0), 0);
        return {
            yes: actualScore,
            total: maxScore,
            percentage: maxScore > 0 ? (actualScore / maxScore) * 100 : 100
        };
    }

    getQuestionScoreClass(value: number | undefined): string {
        if (value === undefined || value === null) return 'score-na';
        if (value >= 4) return 'score-excellent';
        if (value >= 3) return 'score-good';
        if (value >= 2) return 'score-average';
        return 'score-poor';
    }

    getQuestionScoreLabel(value: number | undefined): string {
        if (value === undefined || value === null) return 'N/A';
        return `${value}/5`;
    }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { AuditService } from '../../../core/services/audit.service';
import { Audit, AuditCategory } from '../../../core/models/audit.model';

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
        MatListModule
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
            this.auditService.getAuditById(id).subscribe(data => {
                if (data) {
                    this.audit = data;
                } else {
                    // Handle not found
                    console.error('Audit not found');
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
        return cat.items.some(i => i.status === 'non');
    }

    getCategoryScore(cat: AuditCategory): { yes: number, total: number, percentage: number } {
        const scorable = cat.items.filter(i => i.status === 'oui' || i.status === 'non');
        const yes = scorable.filter(i => i.status === 'oui').length;
        const total = scorable.length;
        return {
            yes,
            total,
            percentage: total > 0 ? (yes / total) * 100 : 100
        };
    }
}

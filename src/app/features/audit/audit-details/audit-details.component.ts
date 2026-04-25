import { Component, inject, OnInit, signal, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { AuditUI as Audit, AuditCategory, AuditQuestion } from '../../../core/models/audit.model';

@Component({
    selector: 'app-audit-details',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        MatCardModule,
        MatChipsModule,
        MatListModule,
        MatProgressBarModule,
        MatTooltipModule,
        MatSnackBarModule
    ],
    templateUrl: './audit-details.component.html',
    styleUrls: ['./audit-details.component.css']
})
export class AuditDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private auditService = inject(AuditService);
    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    private snackBar = inject(MatSnackBar);

    @ViewChild('auditContent') auditContent!: ElementRef;

    audit = signal<Audit | undefined>(undefined);
    exportingPdf = signal(false);

    /** Currently open lightbox image URL (null = closed) */
    lightboxImage: string | null = null;

    openLightbox(imageUrl: string) {
        this.lightboxImage = imageUrl;
        this.cdr.markForCheck();
    }

    closeLightbox() {
        this.lightboxImage = null;
        this.cdr.markForCheck();
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.auditService.getAudit(+id).subscribe({
                next: (data) => {
                    this.audit.set(data);
                    this.cdr.markForCheck();
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

    exportPdf() {
        const audit = this.audit();
        if (!audit || !audit.id) return;

        this.exportingPdf.set(true);
        this.cdr.markForCheck();
        this.snackBar.open('Génération du PDF en cours par le serveur...', undefined, { duration: 3000 });

        this.auditService.downloadAuditPdf(audit.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-${audit.coffeeShop}-${new Date().toISOString().slice(0, 10)}.pdf`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.snackBar.open('PDF exporté avec succès !', 'Fermer', { duration: 3000 });
                this.exportingPdf.set(false);
                this.cdr.markForCheck();
            },
            error: (err) => {
                console.error('PDF export failed', err);
                this.snackBar.open('Erreur lors de la génération du PDF', 'Fermer', { duration: 4000, panelClass: ['error-snackbar'] });
                this.exportingPdf.set(false);
                this.cdr.markForCheck();
            }
        });
    }

    canSeeAuditor(): boolean {
        const user = this.authService.currentUser();
        return !!user && (user.role === UserRole.ADMIN || user.role === UserRole.BOSS);
    }

    canEditAudit(): boolean {
        const audit = this.audit();
        const user = this.authService.currentUser();
        if (!audit || !user) return false;
        
        // Admin or user with explicit update rights
        if (user.role === UserRole.ADMIN || user.permissions?.audits?.update) return true;
        
        // Owner (auditor who created it)
        return audit.auditorId === user.id;
    }

    getScoreClass(score: number): string {
        if (score >= 85) return 'score-success';
        if (score >= 70) return 'score-warning';
        return 'score-danger';
    }

    getTotalPoints(): { obtained: number, total: number } {
        const audit = this.audit();
        if (!audit) return { obtained: 0, total: 0 };

        let obtained = 0;
        let total = 0;

        audit.categories.forEach((cat: AuditCategory) => {
            const catScore = this.getCategoryScore(cat);
            obtained += catScore.yes;
            total += catScore.total;
        });

        return { obtained, total };
    }

    isItemNonConform(item: AuditQuestion): boolean {
        if (!item.status || item.status === 'n/a') return false;
        const correctAnswer = (item.correct_answer || 'oui').toLowerCase();
        return item.status !== correctAnswer;
    }

    hasNonConformity(cat: AuditCategory): boolean {
        return cat.items.some(i => this.isItemNonConform(i));
    }

    hasAnyNonConformity(): boolean {
        const audit = this.audit();
        if (!audit) return false;
        return audit.categories.some((cat: AuditCategory) => this.hasNonConformity(cat));
    }


    getCategoryScore(cat: AuditCategory): { yes: number, total: number, percentage: number } {
        let obtainedScore = 0;
        let maxScore = 0;

        cat.items.forEach(item => {
            if (item.status === 'n/a') {
                return;
            }

            const weight = item.weight || 1;
            maxScore += weight;

            const correctAnswer = (item.correct_answer || 'oui').toLowerCase();
            if (item.status === correctAnswer) {
                obtainedScore += weight;
            }
        });

        return {
            yes: obtainedScore,
            total: maxScore,
            percentage: maxScore > 0 ? (obtainedScore / maxScore) * 100 : 100
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

    getQuestionStatus(item: AuditQuestion): string {
        if (item.status === 'oui') return 'Oui';
        if (item.status === 'non') return 'Non';
        if (item.status === 'n/a') return 'N/A';
        return '-';
    }

    getQuestionStatusClass(item: AuditQuestion): string {
        if (item.status === 'n/a') return 'status-na';
        if (!item.status) return 'status-unknown';
        const correctAnswer = (item.correct_answer || 'oui').toLowerCase();
        return item.status === correctAnswer ? 'status-yes' : 'status-no';
    }

    getQuestionScore(item: AuditQuestion): number {
        const weight = item.weight || 1;
        if (item.status === 'n/a' && item.na_score !== undefined) return item.na_score;
        const correctAnswer = (item.correct_answer || 'oui').toLowerCase();
        if (item.status === correctAnswer) return weight;
        return 0;
    }

    getNaCount(cat: AuditCategory): number {
        return cat.items.filter(i => i.status === 'n/a').length;
    }

    getAnsweredCount(cat: AuditCategory): number {
        return cat.items.filter(i => !!i.status).length;
    }

    getCategoryTotal(cat: AuditCategory): number {
        return cat.items.length;
    }
}

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

    async exportPdf() {
        const audit = this.audit();
        if (!audit) return;

        this.exportingPdf.set(true);
        this.cdr.markForCheck();
        this.snackBar.open('Génération du PDF en cours...', undefined, { duration: 3000 });

        try {
            const html2canvas = (await import('html2canvas')).default;
            const jsPDF = (await import('jspdf')).default;

            const element = this.auditContent?.nativeElement;
            if (!element) return;

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;
            }

            const filename = `audit-${audit.coffeeShop}-${new Date().toISOString().slice(0, 10)}.pdf`;
            pdf.save(filename);
            this.snackBar.open('PDF exporté avec succès !', 'Fermer', { duration: 3000 });
        } catch (err) {
            console.error('PDF export failed', err);
            this.snackBar.open('Erreur lors de la génération du PDF', 'Fermer', { duration: 4000, panelClass: ['error-snackbar'] });
        } finally {
            this.exportingPdf.set(false);
            this.cdr.markForCheck();
        }
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

    hasNonConformity(cat: AuditCategory): boolean {
        return cat.items.some(i => i.status === 'non');
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

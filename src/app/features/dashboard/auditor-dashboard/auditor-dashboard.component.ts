import { Component, inject, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { FilterBarComponent, DashboardFilters } from '../../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { effect } from '@angular/core';

Chart.register(...registerables);

@Component({
    selector: 'app-auditor-dashboard',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, MatChipsModule, FilterBarComponent],
    template: `
    <div class="auditor-dashboard">
        <div class="welcome-section">
            <h1>Bienvenue, {{ userName }}</h1>
            <p class="subtitle">Espace Auditeur</p>
        </div>

        <app-filter-bar (filterChanged)="onFilterChanged($event)"></app-filter-bar>

        <div class="action-cards">
            <mat-card class="action-card start-audit" (click)="startNewAudit()">
                <div class="card-icon-wrapper blue">
                    <mat-icon class="card-icon">add_circle</mat-icon>
                </div>
                <mat-card-content>
                    <h2>Nouvel Audit</h2>
                    <p>Démarrer un nouvel audit pour un café</p>
                </mat-card-content>
                <button mat-flat-button color="primary" class="card-action-btn">
                    <mat-icon>play_arrow</mat-icon>
                    Commencer
                </button>
            </mat-card>

            <mat-card class="action-card stats-card">
                <div class="card-icon-wrapper brown">
                    <mat-icon class="card-icon">assignment</mat-icon>
                </div>
                <mat-card-content>
                    <h2>Mes Audits</h2>
                    <div class="stat-number">{{ audits.length }}</div>
                    <p>audits réalisés</p>
                </mat-card-content>
            </mat-card>

            <mat-card class="action-card stats-card">
                <div class="card-icon-wrapper gold">
                    <mat-icon class="card-icon">trending_up</mat-icon>
                </div>
                <mat-card-content>
                    <h2>Score Moyen</h2>
                    <div class="stat-number">{{ averageScore | number:'1.0-0' }}%</div>
                    <p>sur tous mes audits</p>
                </mat-card-content>
            </mat-card>
        </div>

        <div class="section-header">
            <h2 class="section-title">Mes Derniers Audits</h2>
            <button mat-stroked-button color="primary" (click)="goToAuditList()">
                <mat-icon>list</mat-icon>
                Voir tout
            </button>
        </div>

        <div class="audit-cards-grid" *ngIf="audits.length > 0; else noAudits">
            <mat-card *ngFor="let audit of audits" class="audit-card" (click)="viewAudit(audit)">
                <mat-card-header>
                    <mat-icon mat-card-avatar class="audit-card-avatar">store</mat-icon>
                    <mat-card-title>{{ audit.coffeeShop }}</mat-card-title>
                    <mat-card-subtitle>{{ audit.date | date:'dd/MM/yyyy HH:mm' }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <div class="audit-card-body">
                        <div class="score-display" [class.good]="audit.score >= 80" [class.medium]="audit.score >= 60 && audit.score < 80" [class.bad]="audit.score < 60">
                            {{ audit.score | number:'1.0-0' }}%
                        </div>
                        <span *ngIf="audit.workflowStatus === 'IN_PROGRESS'" class="status-chip en-cours">En cours</span>
                        <span *ngIf="audit.workflowStatus !== 'IN_PROGRESS'" class="status-chip" [class.conforme]="audit.status === 'Conforme'" [class.non-conforme]="audit.status !== 'Conforme'">
                            {{ audit.status }}
                        </span>
                    </div>
                    <div class="audit-meta" *ngIf="audit.shift">
                        <mat-icon>schedule</mat-icon>
                        <span>{{ audit.shift }}</span>
                    </div>
                </mat-card-content>
                <div class="card-footer-actions" *ngIf="audit.workflowStatus === 'IN_PROGRESS'" style="padding: 20px 16px 16px;">
                    <button mat-flat-button color="primary" style="width: 100%; border-radius: 10px; padding:2px" (click)="continueAudit($event, audit)">
                        <mat-icon>play_circle_filled</mat-icon> Continuer
                    </button>
                </div>
            </mat-card>
        </div>

        <ng-template #noAudits>
            <mat-card class="empty-state">
                <mat-icon class="empty-icon">assignment</mat-icon>
                <h3>Aucun audit encore</h3>
                <p>Commencez par créer votre premier audit</p>
                <button mat-flat-button color="primary" (click)="startNewAudit()">
                    <mat-icon>add</mat-icon>
                    Créer un Audit
                </button>
            </mat-card>
        </ng-template>
    </div>
    `,
  styles: [`
        :host { display: block; width: 100%; box-sizing: border-box; overflow-x: hidden; }
        .auditor-dashboard { padding: 24px; min-height: 100vh; background: var(--background); box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .welcome-section { margin-bottom: 32px; }
        .welcome-section h1 { font-size: 28px; font-weight: 400; color: var(--on-background); margin: 0; }
        .subtitle { color: var(--on-surface-variant); font-size: 14px; margin-top: 4px; }

        .action-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; margin-bottom: 40px; }

        .action-card {
            border-radius: 16px; padding: 24px; cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            background: var(--surface); color: var(--on-surface);
            box-shadow: var(--shadow-sm);
            display: flex; flex-direction: column; align-items: center; text-align: center;
        }
        .action-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }

        .start-audit { border: 2px dashed var(--primary); background: var(--primary-container); }
        .start-audit:hover { background: var(--primary); color: var(--on-primary); }
        .start-audit:hover .card-icon { color: var(--on-primary); }
        .start-audit:hover p { color: var(--on-primary); opacity: 0.8; }
        .start-audit:hover h2 { color: var(--on-primary); }

        .card-icon-wrapper {
            width: 64px; height: 64px; border-radius: 50%;
            display: flex;
            align-items: center; justify-content: center; margin-bottom: 16px;
        }
        .card-icon-wrapper.blue { background: var(--primary-container); color: var(--on-primary-container); }
        .card-icon-wrapper.blue .card-icon { color: var(--on-primary-container); }
        .card-icon-wrapper.brown { background: var(--surface-container-highest); color: var(--on-surface); }
        .card-icon-wrapper.brown .card-icon { color: var(--on-surface); }
        .card-icon-wrapper.gold { background: var(--warning-container); color: var(--on-warning-container); }
        .card-icon-wrapper.gold .card-icon { color: var(--on-warning-container); }
        .card-icon { font-size: 32px; width: 32px; height: 32px; }

        .action-card h2 { font-size: 18px; font-weight: 600; margin: 0 0 4px 0; }
        .action-card p { color: var(--on-surface-variant); font-size: 13px; margin: 0; }
        .stat-number { font-size: 36px; font-weight: 700; color: var(--primary); margin: 8px 0; }
        .card-action-btn { margin-top: 16px; border-radius: 12px; }

        .charts-row { margin-bottom: 32px; min-width: 0; }
        .chart-card { border-radius: 16px; box-shadow: var(--shadow-sm); background: var(--surface); min-width: 0; overflow: hidden; }
        .chart-container { position: relative; height: 260px; width: 100%; margin-top: 16px; min-width: 0; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-size: 20px; font-weight: 500; color: var(--on-background); margin: 0; }

        .audit-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }

        .audit-card {
            border-radius: 12px; cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            background: var(--surface); box-shadow: var(--shadow-sm);
        }
        .audit-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .audit-card-avatar { background: var(--primary-container); color: var(--on-primary-container); border-radius: 50%; padding: 8px; font-size: 24px; width: 40px; height: 40px; }

        .audit-card-body { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .score-display { font-size: 28px; font-weight: 700; }
        .score-display.good { color: var(--success); }
        .score-display.medium { color: var(--warning); }
        .score-display.bad { color: var(--error); }

        .status-chip {
            padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;
        }
        .status-chip.conforme { background: var(--success-container); color: var(--on-success-container); }
        .status-chip.non-conforme { background: var(--error-container); color: var(--on-error-container); }
        .status-chip.en-cours { background: var(--warning-container); color: var(--on-warning-container); }

        .audit-meta { display: flex; align-items: center; gap: 6px; margin-top: 8px; color: var(--on-surface-variant); font-size: 13px; }
        .audit-meta mat-icon { font-size: 16px; width: 16px; height: 16px; }

        .empty-state {
            text-align: center; padding: 48px; border-radius: 16px;
            background: var(--surface); color: var(--on-surface);
        }
        .empty-icon { font-size: 64px; width: 64px; height: 64px; color: var(--on-surface-variant); margin-bottom: 16px; }
        .empty-state h3 { margin: 0 0 8px; }
        .empty-state p { color: var(--on-surface-variant); margin-bottom: 16px; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
            .auditor-dashboard { padding: 12px; }
            .welcome-section h1 { font-size: 22px; }
            .action-cards { grid-template-columns: 1fr; gap: 12px; margin-bottom: 24px; }
            .action-card { padding: 16px; }
            .card-icon-wrapper { width: 48px; height: 48px; margin-bottom: 12px; }
            .card-icon { font-size: 24px; width: 24px; height: 24px; }
            .stat-number { font-size: 28px; }
            .chart-card { min-height: 280px; border-radius: 16px; }
            .chart-container { height: 220px; }
            .audit-cards-grid { grid-template-columns: 1fr; }
            .section-title { font-size: 18px; }
        }
    `]
})
export class AuditorDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    private auditService = inject(AuditService);
    private authService = inject(AuthService);
    private dashboardDataService = inject(DashboardDataService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    @ViewChild('scoreChart') scoreChartRef!: import('@angular/core').ElementRef<HTMLCanvasElement>;
    private chart: Chart | undefined;

    allAudits: Audit[] = [];
    audits: Audit[] = [];
    currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
    userName = '';
    averageScore = 0;

    constructor() {
        effect(() => {
            // Re-init chart when theme changes
            this.themeService.isDarkMode();
            setTimeout(() => this.initChart(), 100);
        });
    }

    ngOnInit() {
        const user = this.authService.currentUser();
        this.userName = user?.full_name || user?.email || 'Auditeur';
        this.loadAudits();
    }

    loadAudits() {
        this.auditService.getAudits().subscribe(data => {
            this.allAudits = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.applyFilters();
        });
    }

    onFilterChanged(filters: DashboardFilters) {
        this.currentFilters = filters;
        this.applyFilters();
    }

    applyFilters() {
        const { filteredAudits, kpis } = this.dashboardDataService.processDashboardData(this.allAudits, this.currentFilters);
        this.audits = filteredAudits;
        this.averageScore = kpis.averageScore;
        setTimeout(() => this.initChart(), 0);
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        if (this.chart) this.chart.destroy();
    }

    initChart() {
        if (!this.scoreChartRef) return;
        
        if (this.chart) this.chart.destroy();
        
        const isDark = this.themeService.isDarkMode();
        const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
        const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
        const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

        const last10 = this.audits.slice(0, 10).reverse();
        this.chart = new Chart(this.scoreChartRef.nativeElement, {
            type: 'line',
            data: {
                labels: last10.map(a => new Date(a.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })),
                datasets: [{
                    label: 'Score (%)',
                    data: last10.map(a => a.score),
                    borderColor: primaryColor,
                    backgroundColor: primaryColor + '1A', // 10% opacity
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointBackgroundColor: primaryColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        max: 100, 
                        grid: { color: gridColor },
                        ticks: { color: textColor }
                    },
                    x: { 
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                },
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: isDark ? '#3c4043' : '#fff',
                        titleColor: isDark ? '#fff' : '#202124',
                        bodyColor: isDark ? '#e8eaed' : '#5f6368',
                        borderColor: gridColor,
                        borderWidth: 1
                    }
                }
            }
        });
    }

    startNewAudit() {
        this.router.navigate(['/audits/new']);
    }

    goToAuditList() {
        this.router.navigate(['/audits']);
    }

    viewAudit(audit: Audit) {
        this.router.navigate(['/audits', audit.id]);
    }

    continueAudit(event: Event, audit: Audit) {
        event.stopPropagation();
        this.router.navigate(['/audits', audit.id, 'edit']);
    }
}

import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { KpiService } from '../../../core/services/kpi.service';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { FilterBarComponent, DashboardFilters } from '../../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { effect } from '@angular/core';

Chart.register(...registerables);

@Component({
    selector: 'app-boss-dashboard',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, FilterBarComponent],
    template: `
    <div class="boss-dashboard">
        <div class="welcome-section">
            <h1>Bienvenue, {{ userName }}</h1>
            <p class="subtitle">Tableau de bord Directeur</p>
        </div>

        <app-filter-bar (filterChanged)="onFilterChanged($event)"></app-filter-bar>

        <div class="stats-grid">
            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container blue"><mat-icon>assignment</mat-icon></div>
                    <mat-card-title class="stat-label">Total Audits</mat-card-title>
                    <mat-card-subtitle>Global</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ totalAudits }}</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container gold"><mat-icon>trending_up</mat-icon></div>
                    <mat-card-title class="stat-label">Score Moyen</mat-card-title>
                    <mat-card-subtitle>Global</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ averageScore | number:'1.1-1' }}%</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container blue"><mat-icon>check_circle</mat-icon></div>
                    <mat-card-title class="stat-label">Conformité</mat-card-title>
                    <mat-card-subtitle>Taux Global</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ complianceRate | number:'1.1-1' }}%</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container brown"><mat-icon>event</mat-icon></div>
                    <mat-card-title class="stat-label">Ce Mois</mat-card-title>
                    <mat-card-subtitle>Audits</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ auditsThisMonth }}</div></mat-card-content>
            </mat-card>
        </div>

        <div class="secondary-stats">
            <mat-card class="mini-stat" style="border-left: 4px solid #4CAF50;">
                <mat-card-title>Top Performer: <strong>{{ topPerformer }}</strong></mat-card-title>
            </mat-card>
            <mat-card class="mini-stat" style="border-left: 4px solid #F44336;">
                <mat-card-title>Worst Performer: <strong>{{ worstPerformer }}</strong></mat-card-title>
            </mat-card>
            <mat-card class="mini-stat">
                <mat-card-title>Score Moyen (Mois): <strong>{{ avgScoreMonth | number:'1.1-1' }}%</strong></mat-card-title>
            </mat-card>
        </div>

        <div class="charts-grid">
            <mat-card class="chart-card">
                <mat-card-header><mat-card-title>Scores par Café</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container"><canvas #barChart></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card">
                <mat-card-header><mat-card-title>Conformité</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container pie-container"><canvas #pieChart></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card">
                <mat-card-header><mat-card-title>Scores par Catégorie</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container"><canvas #radarChart></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card">
                <mat-card-header><mat-card-title>Score Ouverture/Fermeture (Mois)</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container"><canvas #timingScoresCanvas></canvas></div></mat-card-content>
            </mat-card>
        </div>

        <div class="section-header">
            <h2 class="section-title">Tous les Audits</h2>
            <button mat-stroked-button color="primary" (click)="goToAuditList()">
                <mat-icon>list</mat-icon>
                Voir tout
            </button>
        </div>

        <div class="audit-cards-grid" *ngIf="audits.length > 0; else noAudits">
            <mat-card *ngFor="let audit of recentAudits" class="audit-card" (click)="viewAudit(audit)">
                <mat-card-header>
                    <mat-card-title>{{ audit.coffeeShop }}</mat-card-title>
                    <mat-card-subtitle>{{ audit.auditorName }} — {{ audit.date | date:'dd/MM/yyyy' }}</mat-card-subtitle>
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
                </mat-card-content>
            </mat-card>
        </div>

        <ng-template #noAudits>
            <mat-card class="empty-state">
                <mat-icon class="empty-icon">assignment</mat-icon>
                <h3>Aucun audit disponible</h3>
            </mat-card>
        </ng-template>
    </div>
    `,
    styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; overflow-x: hidden; }
    .boss-dashboard { padding: 24px; min-height: 100vh; background: var(--background); box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .welcome-section { margin-bottom: 32px; }
        .welcome-section h1 { font-size: 28px; font-weight: 400; color: var(--on-background); margin: 0; }
        .subtitle { color: var(--on-surface-variant); font-size: 14px; margin-top: 4px; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 24px; }
        .stat-card { border-radius: 12px; transition: transform 0.2s; box-shadow: var(--shadow-sm); background: var(--surface); color: var(--on-surface); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .stat-icon-container { border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; }
        .stat-icon-container.blue { background-color: var(--primary-container); color: var(--on-primary-container); }
        .stat-icon-container.gold { background-color: var(--warning-container); color: var(--on-warning-container); }
        .stat-icon-container.brown { background-color: var(--surface-container-highest); color: var(--on-surface); }
        .stat-label { font-size: 16px; font-weight: 500; color: var(--on-surface-variant); }
        .stat-value { font-size: 32px; font-weight: 700; color: var(--on-surface); margin-top: 8px; }

        .secondary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px; }
        .mini-stat { padding: 16px; border-radius: 8px; background: var(--surface-container, var(--surface)); color: var(--on-surface); }
        .mini-stat mat-card-title { margin: 0; font-size: 14px; }

        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr)); gap: 24px; margin-bottom: 32px; min-width: 0; }
    .chart-card { border-radius: 16px; box-shadow: var(--shadow-sm); background: var(--surface); min-width: 0; overflow: hidden; }
    .chart-container { position: relative; height: 300px; width: 100%; margin-top: 16px; min-width: 0; }
    .pie-container { display: flex; justify-content: center; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
        .section-title { font-size: 20px; font-weight: 500; color: var(--on-background); margin: 0; }
        .audit-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
        .audit-card { border-radius: 12px; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; background: var(--surface); box-shadow: var(--shadow-sm); }
        .audit-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .audit-card-body { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
        .score-display { font-size: 28px; font-weight: 700; }
        .score-display.good { color: var(--success); }
        .score-display.medium { color: var(--warning); }
        .score-display.bad { color: var(--error); }
        .status-chip { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .status-chip.conforme { background: var(--success-container); color: var(--on-success-container); }
        .status-chip.non-conforme { background: var(--error-container); color: var(--on-error-container); }
        .status-chip.en-cours { background: var(--warning-container); color: var(--on-warning-container); }
        .empty-state { text-align: center; padding: 48px; border-radius: 16px; background: var(--surface); }
        .empty-icon { font-size: 64px; width: 64px; height: 64px; color: var(--on-surface-variant); margin-bottom: 16px; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
            .boss-dashboard { padding: 12px; }
            .welcome-section h1 { font-size: 22px; }
            .stats-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
            .stat-value { font-size: 24px; }
            .stat-label { font-size: 13px; }
            .stat-icon-container { width: 38px; height: 38px; }
            .secondary-stats { grid-template-columns: 1fr; gap: 12px; }
            .charts-grid { grid-template-columns: 1fr; gap: 16px; }
            .chart-card { min-height: 280px; border-radius: 16px; }
            .chart-container { height: 220px; }
            .pie-container { height: 240px; }
            .audit-cards-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
            .stats-grid { grid-template-columns: 1fr; gap: 8px; }
            .stat-value { font-size: 20px; }
        }
    `]
})
export class BossDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    private auditService = inject(AuditService);
    private authService = inject(AuthService);
    private kpiService = inject(KpiService);
    private dashboardDataService = inject(DashboardDataService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('radarChart') radarChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('timingScoresCanvas') timingScoresCanvas!: ElementRef<HTMLCanvasElement>;
    private barChart: Chart | undefined;
    private pieChart: Chart | undefined;
    private radarChart: Chart | undefined;
    private timingChart: Chart | undefined;

    categoryScores: { [key: string]: number } = {};
    timingScores: { [key: string]: number } = {};

    allAudits: Audit[] = [];
    audits: Audit[] = [];
    currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
    recentAudits: Audit[] = [];
    userName = '';
    totalAudits = 0;
    averageScore = 0;
    complianceRate = 0;
    auditsThisMonth = 0;
    topPerformer = 'N/A';
    worstPerformer = 'N/A';
    avgScoreMonth = 0;

    constructor() {
        effect(() => {
            this.themeService.isDarkMode();
            setTimeout(() => {
                this.initCharts();
                this.initRadarChart();
            }, 100);
        });
    }

    ngOnInit() {
        const user = this.authService.currentUser();
        this.userName = user?.full_name || user?.email || 'Directeur';
        this.loadData();
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        if (this.barChart) this.barChart.destroy();
        if (this.pieChart) this.pieChart.destroy();
        if (this.radarChart) this.radarChart.destroy();
        if (this.timingChart) this.timingChart.destroy();
    }

    loadData() {
        this.auditService.getAudits().subscribe(data => {
            this.allAudits = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.applyFilters();
        });
        this.kpiService.getKPI().subscribe(kpiData => {
           if (kpiData && kpiData.timing_scores) {
              this.timingScores = kpiData.timing_scores;
              setTimeout(() => this.initTimingChart(), 100);
           }
        });
    }

    onFilterChanged(filters: DashboardFilters) {
        this.currentFilters = filters;
        this.applyFilters();
    }

    applyFilters() {
        const { filteredAudits, kpis } = this.dashboardDataService.processDashboardData(this.allAudits, this.currentFilters);
        this.audits = filteredAudits;
        this.recentAudits = this.audits.slice(0, 12);
        
        this.totalAudits = kpis.totalAudits;
        this.averageScore = kpis.averageScore;
        this.complianceRate = kpis.complianceRate;
        this.auditsThisMonth = kpis.auditsMonth;
        this.avgScoreMonth = kpis.avgScoreMonth;
        this.topPerformer = kpis.topPerformer;
        this.worstPerformer = kpis.worstPerformer;
        this.categoryScores = kpis.scoresPerCategory;
        
        setTimeout(() => {
             this.initCharts();
             this.initRadarChart();
        }, 0);
    }

    initCharts() {
        if (!this.barChartRef || !this.pieChartRef) return;
        
        if (this.barChart) this.barChart.destroy();
        if (this.pieChart) this.pieChart.destroy();

        const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
        const secondaryColor = this.themeService.getColor('--secondary') || '#5f6368';
        const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
        const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

        const shops = [...new Set(this.audits.map(a => a.coffeeShop))];
        const shopScores = shops.map(shop => {
            const shopAudits = this.audits.filter(a => a.coffeeShop === shop);
            return shopAudits.length > 0 ? (shopAudits.reduce((acc, curr) => acc + curr.score, 0) / shopAudits.length) : 0;
        });

        this.barChart = new Chart(this.barChartRef.nativeElement, {
            type: 'bar',
            data: {
                labels: shops.map(s => s.replace('Caribou ', '')),
                datasets: [{ label: 'Score Moyen (%)', data: shopScores, backgroundColor: primaryColor, borderRadius: 4, barThickness: 40 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
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
                plugins: { legend: { display: false } }
            }
        });

        const conforming = this.audits.filter(a => a.status === 'Conforme').length;
        const nonConforming = this.audits.filter(a => a.status !== 'Conforme').length;

        this.pieChart = new Chart(this.pieChartRef.nativeElement, {
            type: 'doughnut',
            data: {
                labels: ['Conforme', 'Non-conforme'],
                datasets: [{ data: [conforming, nonConforming], backgroundColor: [primaryColor, secondaryColor], borderWidth: 0, hoverOffset: 4 }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { 
                        position: 'bottom',
                        labels: { color: textColor }
                    } 
                }, 
                cutout: '70%' 
            }
        });
    }

    initRadarChart() {
        if (!this.radarChartRef) return;
        
        if (this.radarChart) this.radarChart.destroy();

        const labels = Object.keys(this.categoryScores);
        const data = Object.values(this.categoryScores);

        // Don't draw if no data yet to avoid empty chart glitch
        if (labels.length === 0) return;

        const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
        const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
        const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

        this.radarChart = new Chart(this.radarChartRef.nativeElement, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score Moyen (%)',
                    data: data,
                    backgroundColor: primaryColor + '33', // 20% opacity
                    borderColor: primaryColor,
                    pointBackgroundColor: primaryColor,
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: primaryColor
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: gridColor },
                        grid: { color: gridColor },
                        pointLabels: { color: textColor },
                        suggestedMin: 0,
                        suggestedMax: 100,
                        ticks: { 
                            stepSize: 20,
                            backdropColor: 'transparent',
                            color: textColor
                        }
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    }

    goToAuditList() {
        this.router.navigate(['/audits']);
    }

    viewAudit(audit: Audit) {
        this.router.navigate(['/audits', audit.id]);
    }

    initTimingChart() {
        if (!this.timingScoresCanvas) return;
        if (this.timingChart) this.timingChart.destroy();

        const labels = Object.keys(this.timingScores);
        const data = Object.values(this.timingScores);

        if (labels.length === 0) return;

        const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
        const secondaryColor = this.themeService.getColor('--secondary') || '#5f6368';
        const errorColor = this.themeService.getColor('--error') || '#d93025';
        const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
        const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

        this.timingChart = new Chart(this.timingScoresCanvas.nativeElement, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Score Horaires (%)',
              data: data,
              backgroundColor: data.map(rate =>
                rate >= 80 ? primaryColor : rate >= 50 ? secondaryColor : errorColor
              ),
              borderRadius: 4,
              barThickness: 40
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
            plugins: { legend: { display: false } }
          }
        });
    }
}

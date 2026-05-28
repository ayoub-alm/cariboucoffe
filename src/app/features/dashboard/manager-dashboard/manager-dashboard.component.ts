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
    selector: 'app-manager-dashboard',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, FilterBarComponent],
    template: `
    <div class="manager-dashboard">
        <div class="welcome-section">
            <h1>Bienvenue, {{ userName }}</h1>
            <p class="subtitle">Tableau de bord Manager — Mes Cafés</p>
        </div>

        <app-filter-bar (filterChanged)="onFilterChanged($event)"></app-filter-bar>

        <div class="stats-grid">
            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container blue"><mat-icon>store</mat-icon></div>
                    <mat-card-title class="stat-label">Cafés Gérés</mat-card-title>
                    <mat-card-subtitle>Assignés</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ managedCoffeeCount }}</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container gold"><mat-icon>assignment</mat-icon></div>
                    <mat-card-title class="stat-label">Total Audits</mat-card-title>
                    <mat-card-subtitle>Mes Cafés</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ totalAudits }}</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container blue"><mat-icon>trending_up</mat-icon></div>
                    <mat-card-title class="stat-label">Score Moyen</mat-card-title>
                    <mat-card-subtitle>Mes Cafés</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ averageScore | number:'1.1-1' }}%</div></mat-card-content>
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

        <div class="charts-row">
            <mat-card class="chart-card">
                <mat-card-header><mat-card-title>Évolution des Scores</mat-card-title></mat-card-header>
                <mat-card-content>
                    <div class="chart-container"><canvas #scoreChart></canvas></div>
                </mat-card-content>
            </mat-card>
        </div>

        <div class="section-header">
            <h2 class="section-title">Audits de Mes Cafés</h2>
            <button mat-stroked-button color="primary" (click)="goToAuditList()">
                <mat-icon>list</mat-icon>
                Voir tout
            </button>
        </div>

        <div class="audit-cards-grid" *ngIf="audits.length > 0; else noAudits">
            <mat-card *ngFor="let audit of audits.slice(0, 12)" class="audit-card" (click)="viewAudit(audit)">
                <mat-card-header>
                    <mat-card-title>{{ audit.coffeeShop }}</mat-card-title>
                    <mat-card-subtitle>{{ audit.auditorName }} — {{ audit.date | date:'dd/MM/yyyy HH:mm' }}</mat-card-subtitle>
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
                <mat-icon class="empty-icon">store</mat-icon>
                <h3>Aucun audit pour vos cafés</h3>
                <p>Les audits apparaîtront ici lorsqu'ils seront réalisés</p>
            </mat-card>
        </ng-template>
    </div>
    `,
    styles: [`
        :host { display: block; width: 100%; box-sizing: border-box; overflow-x: hidden; }
        .manager-dashboard { padding: 24px; min-height: 100vh; background: var(--background); box-sizing: border-box; width: 100%; overflow-x: hidden; }
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

        .charts-row { margin-bottom: 32px; min-width: 0; }
        .chart-card { border-radius: 16px; box-shadow: var(--shadow-sm); background: var(--surface); min-width: 0; overflow: hidden; }
        .chart-container { position: relative; height: 300px; width: 100%; margin-top: 16px; min-width: 0; }

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
            .manager-dashboard { padding: 12px; }
            .welcome-section h1 { font-size: 22px; }
            .stats-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
            .stat-value { font-size: 24px; }
            .stat-label { font-size: 13px; }
            .stat-icon-container { width: 38px; height: 38px; }
            .charts-row { margin-bottom: 24px; }
            .chart-card { min-height: 280px; border-radius: 16px; }
            .chart-container { height: 220px; }
            .audit-cards-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
            .stats-grid { grid-template-columns: 1fr; gap: 8px; }
            .stat-value { font-size: 20px; }
        }
    `]
})
export class ManagerDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
    private auditService = inject(AuditService);
    private authService = inject(AuthService);
    private dashboardDataService = inject(DashboardDataService);
    private themeService = inject(ThemeService);
    private router = inject(Router);

    @ViewChild('scoreChart') scoreChartRef!: ElementRef<HTMLCanvasElement>;
    private chart: Chart | undefined;
    private themeSub: any;

    allAudits: Audit[] = [];
    audits: Audit[] = [];
    currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
    userName = '';
    managedCoffeeCount = 0;
    totalAudits = 0;
    averageScore = 0;
    complianceRate = 0;
    auditsThisMonth = 0;

    constructor() {
        effect(() => {
            // Re-init chart when theme changes
            this.themeService.isDarkMode();
            setTimeout(() => this.initChart(), 100);
        });
    }

    ngOnInit() {
        const user = this.authService.currentUser();
        this.userName = user?.full_name || user?.email || 'Manager';
        this.managedCoffeeCount = user?.managed_coffee_ids?.length || 0;
        this.loadAudits();
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        if (this.chart) this.chart.destroy();
    }

    loadAudits() {
        this.auditService.getAllAudits().subscribe(data => {
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
        
        this.totalAudits = kpis.totalAudits;
        this.averageScore = kpis.averageScore;
        this.complianceRate = kpis.complianceRate;
        this.auditsThisMonth = kpis.auditsMonth;
        
        setTimeout(() => this.initChart(), 0);
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

    goToAuditList() {
        this.router.navigate(['/audits']);
    }

    viewAudit(audit: Audit) {
        this.router.navigate(['/audits', audit.id]);
    }
}

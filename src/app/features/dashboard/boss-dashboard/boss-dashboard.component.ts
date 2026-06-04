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
import { DailyLogService } from '../../../core/services/daily-log.service';
import { CoffeeService } from '../../../core/services/coffee.service';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ExportKpiDialogComponent } from '../export-kpi-dialog/export-kpi-dialog.component';
import { FilterBarComponent, DashboardFilters } from '../../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { effect } from '@angular/core';

Chart.register(...registerables);

@Component({
    selector: 'app-boss-dashboard',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, FilterBarComponent, MatDialogModule, ExportKpiDialogComponent],
    template: `
    <div class="boss-dashboard">
        <div class="welcome-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
                <h1>Bienvenue, {{ userName }}</h1>
                <p class="subtitle">Tableau de bord Directeur</p>
            </div>
            <button mat-flat-button class="export-kpi-btn" (click)="exportMonthlyKPIsExcel()">
                <mat-icon>download</mat-icon> Exporter KPIs Mensuels
            </button>
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

            <mat-card class="chart-card bar-chart-full">
                <mat-card-header><mat-card-title>Scores par Café</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container"><canvas #barChart></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card pie-chart">
                <mat-card-header><mat-card-title>Conformité</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container pie-container"><canvas #pieChart></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card radar-chart">
                <mat-card-header><mat-card-title>Scores par Catégorie</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container"><canvas #radarChart></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card bar-chart-full">
                <mat-card-header><mat-card-title>Conformité Globale par Café (Audits + Horaires)</mat-card-title></mat-card-header>
                <mat-card-content><div class="chart-container"><canvas #globalComplianceChartRef></canvas></div></mat-card-content>
            </mat-card>

            <mat-card class="chart-card bar-chart-full" style="padding: 24px;">
              <mat-card-header style="margin-bottom: 16px;">
                <mat-card-title style="font-size: 18px; font-weight: 500;">Synthèse Globale des Établissements</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="table-responsive" style="width: 100%; overflow-x: auto;">
                  <table class="custom-table" style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                      <tr style="border-bottom: 2px solid var(--outline); font-weight: 600;">
                        <th style="padding: 12px; color: var(--on-surface-variant);">Café</th>
                        <th style="padding: 12px; text-align: right; color: var(--on-surface-variant);">Score Moyen Audits (%)</th>
                        <th style="padding: 12px; text-align: right; color: var(--on-surface-variant);">Nombre d'Audits</th>
                        <th style="padding: 12px; text-align: right; color: var(--on-surface-variant);">Score Moyen Horaires (%)</th>
                        <th style="padding: 12px; text-align: right; color: var(--on-surface-variant);">Total Relevés</th>
                        <th style="padding: 12px; text-align: right; color: var(--on-surface-variant);">Conformité Globale (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of globalTableData" style="border-bottom: 1px solid var(--outline-variant); transition: background-color 0.2s;">
                        <td style="padding: 12px; font-weight: 500;">{{ row.shopName }}</td>
                        <td style="padding: 12px; text-align: right;" [ngClass]="{'text-success': row.auditAvg >= 80, 'text-error': row.auditAvg !== null && row.auditAvg < 80}">
                          {{ row.auditAvg !== null ? row.auditAvg + '%' : '-' }}
                        </td>
                        <td style="padding: 12px; text-align: right;">{{ row.auditCount }}</td>
                        <td style="padding: 12px; text-align: right;" [ngClass]="{'text-success': row.logAvg >= 90, 'text-error': row.logAvg !== null && row.logAvg < 90}">
                          {{ row.logAvg !== null ? row.logAvg + '%' : '-' }}
                        </td>
                        <td style="padding: 12px; text-align: right;">{{ row.logCount }}</td>
                        <td style="padding: 12px; text-align: right; font-weight: 600;" [ngClass]="{'text-success': row.combinedScore >= 80, 'text-error': row.combinedScore < 80}">
                          {{ row.combinedScore }}%
                        </td>
                      </tr>
                      <tr *ngIf="globalTableData.length === 0">
                        <td colspan="6" style="padding: 24px; text-align: center; color: var(--on-surface-variant);">
                          Aucune donnée disponible pour la période sélectionnée
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </mat-card-content>
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

        .export-kpi-btn {
          border-radius: 20px !important;
          font-weight: 500 !important;
          padding: 4px 18px !important;
          height: 40px !important;
          background: linear-gradient(135deg, #5faebc, #68b1c2) !important;
          color: white !important;
          border: 1px solid #68b1c2 !important;
          box-shadow: 0 2px 6px rgba(104, 177, 194, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          transition: all 0.2s ease-in-out !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .export-kpi-btn:hover {
          background: linear-gradient(135deg, #5faebc, #68b1c2) !important;
          box-shadow: 0 4px 12px rgba(104, 177, 194, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px);
        }
        .export-kpi-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba( 104, 177, 194, 0.2) !important;
        }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 24px; }
        .stat-card { border-radius: 12px; transition: transform 0.2s; box-shadow: var(--shadow-sm); background: var(--surface); color: var(--on-surface); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .stat-icon-container { border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; }
        .stat-icon-container.blue { background-color: var(--primary-container); color: var(--on-primary-container); }
        .stat-icon-container.gold { background-color: var(--warning-container); color: var(--on-warning-container); }
        .stat-icon-container.brown { background-color: var(--surface-container-highest); color: var(--on-surface); }
        .stat-label { font-size: 16px; font-weight: 500; color: var(--on-surface-variant); }
        .stat-value { font-size: 32px; font-weight: 700; color: var(--on-surface); margin-top: 8px; }
        .stat-value.success { color: #1e8e3e; }
        .stat-value.warning { color: #f9ab00; }
        .stat-value.error { color: #d93025; }

        .secondary-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px; }
        .mini-stat { padding: 16px; border-radius: 8px; background: var(--surface-container, var(--surface)); color: var(--on-surface); }
        .mini-stat mat-card-title { margin: 0; font-size: 14px; }

        .charts-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; margin-bottom: 32px; min-width: 0; }
        .chart-card { grid-column: span 12; border-radius: 16px; box-shadow: var(--shadow-sm); background: var(--surface); min-width: 0; overflow: hidden; }
        @media (min-width: 769px) {
            .chart-card.bar-chart { grid-column: span 6; }
            .chart-card.pie-chart { grid-column: span 6; }
            .chart-card.radar-chart { grid-column: span 6; }
            .chart-card.bar-chart-full { grid-column: span 12; }
        }
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
            .welcome-section {
                flex-direction: column;
                align-items: stretch !important;
                gap: 12px !important;
            }
            .welcome-section h1 { font-size: 22px; }
            .export-kpi-btn {
                width: 100%;
                justify-content: center;
            }
            .stats-grid { grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
            .stat-value { font-size: 24px; }
            .stat-label { font-size: 13px; }
            .stat-icon-container { width: 38px; height: 38px; }
            .secondary-stats { grid-template-columns: 1fr; gap: 12px; }
            .charts-grid { display: flex; flex-direction: column; gap: 16px; }
            .chart-card { min-height: 280px; border-radius: 16px; grid-column: span 12; }
            .chart-container { height: 220px; }
            .pie-container { height: 240px; }
            .audit-cards-grid { grid-template-columns: 1fr; }
        }

        /* ── Mobile ── */
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
    private dailyLogService = inject(DailyLogService);
    private coffeeService = inject(CoffeeService);
    private dialog = inject(MatDialog);

    @ViewChild('barChart') barChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('pieChart') pieChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('radarChart') radarChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('globalComplianceChartRef') globalComplianceChartRef!: ElementRef<HTMLCanvasElement>;
    private barChart: Chart | undefined;
    private pieChart: Chart | undefined;
    private radarChart: Chart | undefined;
    private globalComplianceChart: Chart | undefined;

    categoryScores: { [key: string]: number } = {};

    allAudits: Audit[] = [];
    audits: Audit[] = [];
    currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
    recentAudits: Audit[] = [];
    globalTableData: any[] = [];
    userName = '';
    totalAudits = 0;
    averageScore = 0;
    complianceRate = 0;
    auditsThisMonth = 0;
    topPerformer = 'N/A';
    worstPerformer = 'N/A';
    avgScoreMonth = 0;
    coffees: any[] = [];
    allDailyLogs: any[] = [];

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
        this.coffeeService.getCoffees().subscribe(coffees => {
            this.coffees = coffees;
            this.loadData();
        });
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        if (this.barChart) this.barChart.destroy();
        if (this.pieChart) this.pieChart.destroy();
        if (this.radarChart) this.radarChart.destroy();
        if (this.globalComplianceChart) this.globalComplianceChart.destroy();
    }

    loadData() {
        this.auditService.getAllAudits(this.currentFilters).subscribe(data => {
            this.allAudits = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const logFilters: any = {};
            if (this.currentFilters.startDate) {
                logFilters.start_date = this.formatDate(this.currentFilters.startDate);
            }
            if (this.currentFilters.endDate) {
                logFilters.end_date = this.formatDate(this.currentFilters.endDate);
            }
            if (this.currentFilters.coffeeShop) {
                const found = this.coffees.find(c => c.name === this.currentFilters.coffeeShop);
                if (found) {
                    logFilters.coffee_id = found.id;
                }
            }

            this.dailyLogService.getAllLogs(logFilters).subscribe({
                next: (logs) => {
                    this.allDailyLogs = logs;
                    this.applyFilters();
                },
                error: (err) => {
                    console.error('Error loading daily logs for boss dashboard', err);
                    this.allDailyLogs = [];
                    this.applyFilters();
                }
            });
        });
    }

    onFilterChanged(filters: DashboardFilters) {
        this.currentFilters = filters;
        this.loadData();
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
        if (!this.barChartRef || !this.pieChartRef || !this.globalComplianceChartRef) return;
        
        if (this.barChart) this.barChart.destroy();
        if (this.pieChart) this.pieChart.destroy();
        if (this.globalComplianceChart) this.globalComplianceChart.destroy();

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

        this.initGlobalComplianceChart();
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

    initGlobalComplianceChart() {
        if (!this.globalComplianceChartRef) return;
        if (this.globalComplianceChart) this.globalComplianceChart.destroy();

        const shops = this.coffees.map(c => c.name);

        const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
        const warningColor = '#f57c00';
        const errorColor = this.themeService.getColor('--error') || '#d93025';
        const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
        const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

        const conformeMin = 85;
        const partielMin = 70;

        const globalScores: { shopName: string; score: number }[] = [];
        this.globalTableData = [];

        shops.forEach(shopName => {
            const shopAudits = this.audits.filter(a => a.coffeeShop === shopName);
            const auditAvg = shopAudits.length > 0
                ? shopAudits.reduce((acc, curr) => acc + curr.score, 0) / shopAudits.length
                : null;

            const coffeeObj = this.coffees.find(c => c.name === shopName);
            const shopLogs = coffeeObj
                ? this.allDailyLogs.filter(log => log.coffee_id === coffeeObj.id)
                : [];
            const logAvg = shopLogs.length > 0
                ? shopLogs.reduce((acc, curr) => acc + curr.score, 0) / shopLogs.length
                : null;

            let combinedScore = 0;
            if (auditAvg !== null && logAvg !== null) {
                combinedScore = 0.5 * auditAvg + 0.5 * logAvg;
            } else if (auditAvg !== null) {
                combinedScore = auditAvg;
            } else if (logAvg !== null) {
                combinedScore = logAvg;
            } else {
                return; // Exclude cafes with no data
            }

            const roundedCombined = Math.round(combinedScore);
            globalScores.push({ shopName, score: roundedCombined });
            
            this.globalTableData.push({
                shopName,
                auditAvg: auditAvg !== null ? Math.round(auditAvg) : null,
                auditCount: shopAudits.length,
                logAvg: logAvg !== null ? Math.round(logAvg) : null,
                logCount: shopLogs.length,
                combinedScore: roundedCombined
            });
        });

        globalScores.sort((a, b) => a.shopName.localeCompare(b.shopName));
        this.globalTableData.sort((a, b) => a.shopName.localeCompare(b.shopName));

        const labels = globalScores.map(gs => gs.shopName.replace('Caribou ', ''));
        const data = globalScores.map(gs => gs.score);

        this.globalComplianceChart = new Chart(this.globalComplianceChartRef.nativeElement, {
            type: 'bar',
            data: {
                labels: labels.length > 0 ? labels : ['Aucune donnée'],
                datasets: [{
                    label: 'Conformité Globale (%)',
                    data: data.length > 0 ? data : [0],
                    backgroundColor: data.length > 0
                        ? data.map(score => score >= conformeMin ? primaryColor : (score >= partielMin ? warningColor : errorColor))
                        : [primaryColor],
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

    formatDate(date: any): string {
        if (!date) return '';
        const d     = new Date(date);
        const month = '' + (d.getMonth() + 1);
        const day   = '' + d.getDate();
        return [d.getFullYear(), month.padStart(2, '0'), day.padStart(2, '0')].join('-');
    }

    exportMonthlyKPIsExcel() {
        const dialogRef = this.dialog.open(ExportKpiDialogComponent, {
            width: '400px',
            data: {
                startDate: this.currentFilters.startDate,
                endDate: this.currentFilters.endDate
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const filters = {
                    startDate: result.startDate ? this.formatDate(result.startDate) : null,
                    endDate: result.endDate ? this.formatDate(result.endDate) : null,
                    coffeeShop: this.currentFilters.coffeeShop || null
                };
                this.kpiService.exportMonthlyKPIs(filters).subscribe({
                    next: (blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        const dateStr = new Date().toISOString().slice(0, 10);
                        a.download = `kpi_mensuels_export_${dateStr}.xls`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    },
                    error: (err) => console.error('Error exporting monthly KPIs', err)
                });
            }
        });
    }
}

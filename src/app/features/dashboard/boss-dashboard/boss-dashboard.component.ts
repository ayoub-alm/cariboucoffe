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

            <!-- Conformité Horaires (Timing Compliance Card) -->
            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container purple"><mat-icon>schedule</mat-icon></div>
                    <mat-card-title class="stat-label">Conformité Horaires</mat-card-title>
                    <mat-card-subtitle>Moyenne Globale</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <div class="stat-value" [class.success]="timingComplianceRate >= 80" [class.warning]="timingComplianceRate < 80 && timingComplianceRate >= 50" [class.error]="timingComplianceRate < 50">
                        {{ timingComplianceRate }}%
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Late Openings Card -->
            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container orange"><mat-icon>alarm_on</mat-icon></div>
                    <mat-card-title class="stat-label">Ouvertures Tardives</mat-card-title>
                    <mat-card-subtitle>Retards cumulés</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <div class="stat-value" [class.error]="totalLateOpenings > 0">
                        {{ totalLateOpenings }}
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- Early Closures Card -->
            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container red"><mat-icon>alarm_off</mat-icon></div>
                    <mat-card-title class="stat-label">Fermetures Hâtives</mat-card-title>
                    <mat-card-subtitle>Départs anticipés</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                    <div class="stat-value" [class.error]="totalEarlyClosures > 0">
                        {{ totalEarlyClosures }}
                    </div>
                </mat-card-content>
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
            <!-- BI Table Card: Opening Performance per Cafe (Daily & Monthly) -->
            <mat-card class="chart-card large-table-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container purple">
                        <mat-icon>alarm_on</mat-icon>
                    </div>
                    <mat-card-title>Performance des Ouvertures par Café (BI)</mat-card-title>
                    <mat-card-subtitle>Suivi en temps réel : Score Journalier & Mensuel (Moyennes)</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content class="opening-perf-content">
                   <div class="table-responsive">
                     <table class="perf-table">
                       <thead>
                         <tr>
                           <th>Café</th>
                           <th class="text-center">Score Aujourd'hui / Récent</th>
                           <th class="text-center">Moyenne (Mois Dernier)</th>
                            <th class="text-center">Moyenne (Mois En Cours)</th>
                           <th class="text-center">Retards (Ce Mois)</th>
                           <th class="text-center">Statut</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr *ngFor="let item of openingPerformance">
                           <td class="font-medium">{{ item.coffeeName }}</td>
                           <td class="text-center font-bold">
                             <span *ngIf="item.todayScore !== null" [class.success]="item.todayScore >= 90" [class.warning]="item.todayScore < 90 && item.todayScore >= 70" [class.error]="item.todayScore < 70">
                               {{ item.todayScore }}%
                             </span>
                             <span *ngIf="item.todayScore === null" class="text-muted">--</span>
                           </td>
                           <td class="text-center font-bold">
                             <span [class.success]="item.lastMonthScore >= 90" [class.warning]="item.lastMonthScore < 90 && item.lastMonthScore >= 70" [class.error]="item.lastMonthScore < 70">
                               {{ item.lastMonthScore }}%
                              </span>
                            </td>
                            <td class="text-center font-bold">
                              <span [class.success]="item.monthScore >= 90" [class.warning]="item.monthScore < 90 && item.monthScore >= 70" [class.error]="item.monthScore < 70">
                                {{ item.monthScore }}%
                             </span>
                           </td>
                           <td class="text-center">
                             <span class="badge" [class.badge-error]="item.monthLateCount > 0" [class.badge-success]="item.monthLateCount === 0">
                               {{ item.monthLateCount }} retards
                             </span>
                           </td>
                           <td class="text-center">
                             <span class="status-indicator" [class.excellent]="item.status === 'excellent'" [class.warning]="item.status === 'warning'" [class.critical]="item.status === 'critical'">
                               {{ item.status === 'excellent' ? 'Excellent' : item.status === 'warning' ? 'Correct' : 'Critique' }}
                             </span>
                           </td>
                         </tr>
                       </tbody>
                     </table>
                   </div>
                </mat-card-content>
            </mat-card>

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
        .stat-icon-container.purple { background-color: rgba(171, 71, 188, 0.15); color: #ab47bc; }
        .stat-icon-container.orange { background-color: rgba(249, 171, 0, 0.15); color: #b06000; }
        .stat-icon-container.red { background-color: rgba(217, 48, 37, 0.15); color: #d93025; }
        .stat-label { font-size: 16px; font-weight: 500; color: var(--on-surface-variant); }
        .stat-value { font-size: 32px; font-weight: 700; color: var(--on-surface); margin-top: 8px; }
        .stat-value.success { color: #1e8e3e; }
        .stat-value.warning { color: #f9ab00; }
        .stat-value.error { color: #d93025; }

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

        /* BI Table Card Custom Premium Styles */
        .large-table-card { grid-column: span 2; }
        .opening-perf-content { padding: 16px; overflow-x: auto; }
        .perf-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 14px; }
        .perf-table th { padding: 12px 16px; border-bottom: 2px solid var(--outline-variant); color: var(--on-surface-variant); font-weight: 600; }
        .perf-table td { padding: 12px 16px; border-bottom: 1px solid var(--outline-variant); color: var(--on-surface); }
        .perf-table tr:hover td { background-color: var(--surface-container-highest); }
        .text-center { text-align: center; }
        .font-medium { font-weight: 500; }
        .font-bold { font-weight: 700; }
        .badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .badge-success { background-color: rgba(30, 142, 62, 0.1); color: #1e8e3e; }
        .badge-error { background-color: rgba(217, 48, 37, 0.1); color: #d93025; }
        .status-indicator { padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status-indicator.excellent { background-color: rgba(30, 142, 62, 0.15); color: #1e8e3e; }
        .status-indicator.warning { background-color: rgba(249, 171, 0, 0.15); color: #b06000; }
        .status-indicator.critical { background-color: rgba(217, 48, 37, 0.15); color: #d93025; }
        .perf-table .success { color: #1e8e3e; }
        .perf-table .warning { color: #b06000; }
        .perf-table .error { color: #d93025; }

        @media (max-width: 768px) {
            .large-table-card { grid-column: span 1 !important; }
            .opening-perf-content { padding: 8px; }
            .perf-table th, .perf-table td { padding: 8px 10px; font-size: 13px; }
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
    private dailyLogService = inject(DailyLogService);
    private coffeeService = inject(CoffeeService);

    timingComplianceRate = 0;
    totalLateOpenings = 0;
    totalEarlyClosures = 0;

    openingPerformance: Array<{
      coffeeId: number;
      coffeeName: string;
      todayScore: number | null;
      monthScore: number;
      lastMonthScore: number;
      monthLateCount: number;
      status: 'excellent' | 'warning' | 'critical';
    }> = [];

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
        this.auditService.getAudits(this.currentFilters).subscribe(data => {
            this.allAudits = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.applyFilters();
        });
        this.kpiService.getKPI().subscribe(kpiData => {
           if (kpiData && kpiData.timing_scores) {
              this.timingScores = kpiData.timing_scores;
              setTimeout(() => this.initTimingChart(), 100);
           }
        });
        this.loadTimingKpis();
        this.loadOpeningPerformance();
    }

    loadOpeningPerformance() {
        this.coffeeService.getCoffees().subscribe(coffees => {
            this.dailyLogService.getLogs().subscribe(logs => {
                const today = new Date();
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

                const parseTimeToMinutes = (t: string): number => {
                    const [h, m] = t.split(':').map(Number);
                    return h * 60 + m;
                };

                const formatLocalDate = (d: Date): string => {
                    const month = '' + (d.getMonth() + 1);
                    const day = '' + d.getDate();
                    const year = d.getFullYear();
                    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
                };

                const todayStr = formatLocalDate(today);

                // Filter coffees by coffeeShop
                let filteredCoffees = coffees;
                if (this.currentFilters && this.currentFilters.coffeeShop) {
                    filteredCoffees = coffees.filter(c => c.name === this.currentFilters.coffeeShop);
                }

                // Filter logs by date range if they are active
                let filteredLogs = logs;
                if (this.currentFilters) {
                    if (this.currentFilters.startDate) {
                        const start = new Date(this.currentFilters.startDate);
                        filteredLogs = filteredLogs.filter(l => new Date(l.date) >= start);
                    }
                    if (this.currentFilters.endDate) {
                        const end = new Date(this.currentFilters.endDate);
                        filteredLogs = filteredLogs.filter(l => new Date(l.date) <= end);
                    }
                }

                this.openingPerformance = filteredCoffees.map(coffee => {
                    const coffeeLogs = filteredLogs.filter(l => l.coffee_id === coffee.id);
                    
                    // 1. Today/Most Recent Score
                    let todayLog = coffeeLogs.find(l => l.date.toString() === todayStr);
                    if (!todayLog && coffeeLogs.length > 0) {
                        todayLog = coffeeLogs.reduce((prev, current) => {
                            return (new Date(prev.date) > new Date(current.date)) ? prev : current;
                        });
                    }

                    let todayScore: number | null = null;
                    if (todayLog && coffee.opening_time && todayLog.opening_time) {
                        const diffO = parseTimeToMinutes(todayLog.opening_time) - parseTimeToMinutes(coffee.opening_time);
                        const oScore = diffO <= 0 ? 50 : 50 * (1 - Math.min(diffO / 30, 1));
                        todayScore = Math.round(oScore * 2); // scale to 100
                    }

                    // 2. Month Score & Late count
                    const monthLogs = coffeeLogs.filter(l => {
                        const logDate = new Date(l.date);
                        return logDate >= startOfMonth;
                    });

                    let monthScoreSum = 0;
                    let monthLogsCount = 0;
                    let monthLateCount = 0;

                    monthLogs.forEach(log => {
                        if (coffee.opening_time && log.opening_time) {
                            const diffO = parseTimeToMinutes(log.opening_time) - parseTimeToMinutes(coffee.opening_time);
                            const oScore = diffO <= 0 ? 50 : 50 * (1 - Math.min(diffO / 30, 1));
                            monthScoreSum += oScore * 2;
                            monthLogsCount++;
                            if (diffO > 0) {
                                monthLateCount++;
                            }
                        }
                    });

                    const monthScore = monthLogsCount > 0 ? Math.round(monthScoreSum / monthLogsCount) : 100;

                    // 3. Last Month Score
                    const lastMonthLogs = coffeeLogs.filter(l => {
                        const logDate = new Date(l.date);
                        return logDate >= startOfLastMonth && logDate <= endOfLastMonth;
                    });

                    let lastMonthScoreSum = 0;
                    let lastMonthLogsCount = 0;

                    lastMonthLogs.forEach(log => {
                        if (coffee.opening_time && log.opening_time) {
                            const diffO = parseTimeToMinutes(log.opening_time) - parseTimeToMinutes(coffee.opening_time);
                            const oScore = diffO <= 0 ? 50 : 50 * (1 - Math.min(diffO / 30, 1));
                            lastMonthScoreSum += oScore * 2;
                            lastMonthLogsCount++;
                        }
                    });

                    const lastMonthScore = lastMonthLogsCount > 0 ? Math.round(lastMonthScoreSum / lastMonthLogsCount) : 100;

                    let status: 'excellent' | 'warning' | 'critical' = 'excellent';
                    if (monthScore < 70) {
                        status = 'critical';
                    } else if (monthScore < 90) {
                        status = 'warning';
                    }

                    return {
                        coffeeId: coffee.id,
                        coffeeName: coffee.name.replace('Caribou ', ''),
                        todayScore: todayScore,
                        monthScore: monthScore,
                        lastMonthScore: lastMonthScore,
                        monthLateCount: monthLateCount,
                        status: status
                    };
                });
            });
        });
    }

    loadTimingKpis() {
        this.coffeeService.getCoffees().subscribe(coffees => {
            this.dailyLogService.getLogs().subscribe(logs => {
                let totalScoreSum = 0;
                let lateCount = 0;
                let earlyCount = 0;
                let logsWithScore = 0;

                logs.forEach(log => {
                    const coffee = coffees.find(c => c.id === log.coffee_id);
                    if (coffee) {
                        let oScore = 0;
                        let cScore = 0;
                        
                        const parseTimeToMinutes = (t: string): number => {
                            const [h, m] = t.split(':').map(Number);
                            return h * 60 + m;
                        };

                        // 1. Opening Score (Max 50 points)
                        if (coffee.opening_time && log.opening_time) {
                            const diffO = parseTimeToMinutes(log.opening_time) - parseTimeToMinutes(coffee.opening_time);
                            oScore = diffO <= 0 ? 50 : 50 * (1 - Math.min(diffO / 30, 1));
                            if (diffO > 0) lateCount++;
                        }

                        // 2. Closing Score (Max 50 points)
                        if (coffee.closing_time && log.closing_time) {
                            const diffC = parseTimeToMinutes(coffee.closing_time) - parseTimeToMinutes(log.closing_time);
                            cScore = diffC <= 0 ? 50 : 50 * (1 - Math.min(diffC / 30, 1));
                            if (diffC > 0) earlyCount++;
                        }

                        totalScoreSum += Math.round(oScore + cScore);
                        logsWithScore++;
                    }
                });

                this.timingComplianceRate = logsWithScore > 0 ? Math.round(totalScoreSum / logsWithScore) : 0;
                this.totalLateOpenings = lateCount;
                this.totalEarlyClosures = earlyCount;
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

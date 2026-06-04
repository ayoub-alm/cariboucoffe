import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { KpiService } from '../../../core/services/kpi.service';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ExportKpiDialogComponent } from '../export-kpi-dialog/export-kpi-dialog.component';
import { FilterBarComponent, DashboardFilters } from '../../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';
import { ThemeService } from '../../../core/services/theme.service';
import { effect } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { DailyLogService, DailyTimeRecord } from '../../../core/services/daily-log.service';
import { CoffeeService } from '../../../core/services/coffee.service';
import { UserService } from '../../../core/services/user.service';
import { ConfigService } from '../../../core/services/config.service';
import { UserRole } from '../../../core/models/user.model';

Chart.register(...registerables);

type EnrichedLog = DailyTimeRecord & { coffeeName?: string; controllerName?: string };

@Component({
    selector: 'app-manager-dashboard',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, FilterBarComponent, MatTableModule, MatDialogModule, ExportKpiDialogComponent],
    template: `
    <div class="manager-dashboard">
        <div class="welcome-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 16px;">
            <div>
                <h1>Bienvenue, {{ userName }}</h1>
                <p class="subtitle">Tableau de bord Manager — Mes Cafés</p>
            </div>
            <button mat-flat-button class="export-kpi-btn" (click)="exportMonthlyKPIsExcel()">
                <mat-icon>download</mat-icon> Exporter KPIs Mensuels
            </button>
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

        <div class="charts-row">
            <mat-card class="chart-card">
                <mat-card-header><mat-card-title>Conformité Globale par Café (Audits + Horaires)</mat-card-title></mat-card-header>
                <mat-card-content>
                    <div class="chart-container"><canvas #globalComplianceChartRef></canvas></div>
                </mat-card-content>
            </mat-card>
        </div>

        <div class="charts-row">
            <mat-card class="chart-card" style="padding: 24px;">
              <mat-card-header style="margin-bottom: 16px; padding: 0;">
                <mat-card-title style="font-size: 18px; font-weight: 500; margin: 0;">Synthèse Globale des Établissements</mat-card-title>
              </mat-card-header>
              <mat-card-content style="padding: 0;">
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

        <div class="section-header" style="margin-top: 32px;">
            <h2 class="section-title">Horaires & Conformité Journalière</h2>
            <div class="header-buttons">
                <button mat-raised-button color="primary" (click)="exportDailyLogsExcel()" [disabled]="filteredDailyLogs.length === 0" style="margin-right: 12px; border-radius: 20px;">
                    <mat-icon>download</mat-icon>
                    Exporter Excel
                </button>
                <button mat-stroked-button color="primary" (click)="goToSchedules()" style="border-radius: 20px;">
                    <mat-icon>schedule</mat-icon>
                    Voir tout
                </button>
            </div>
        </div>

        <div class="table-card" style="margin-top: 16px;">
            <div class="table-responsive" *ngIf="filteredDailyLogs.length > 0; else noLogs">
                <table mat-table [dataSource]="filteredDailyLogs.slice(0, 10)" class="w-100 font-sans" style="width: 100%;">
                    
                    <!-- Date -->
                    <ng-container matColumnDef="date">
                        <th mat-header-cell *matHeaderCellDef style="font-weight: 600; padding: 12px 16px; font-size: 13px; text-transform: uppercase;"> Date </th>
                        <td mat-cell *matCellDef="let log" style="padding: 12px 16px;"> {{ log.date | date:'dd/MM/yyyy' }} </td>
                    </ng-container>

                    <!-- Café Name -->
                    <ng-container matColumnDef="coffeeName">
                        <th mat-header-cell *matHeaderCellDef style="font-weight: 600; padding: 12px 16px; font-size: 13px; text-transform: uppercase;"> Café </th>
                        <td mat-cell *matCellDef="let log" style="padding: 12px 16px;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <mat-icon style="font-size: 20px; width: 20px; height: 20px; color: var(--on-surface-variant);">store</mat-icon>
                                <span style="font-weight: 500;">{{ log.coffeeName }}</span>
                            </div>
                        </td>
                    </ng-container>

                    <!-- Opening Time -->
                    <ng-container matColumnDef="opening">
                        <th mat-header-cell *matHeaderCellDef style="font-weight: 600; padding: 12px 16px; font-size: 13px; text-transform: uppercase;"> Ouverture Réelle </th>
                        <td mat-cell *matCellDef="let log" style="padding: 12px 16px;">
                            <span style="font-family: monospace; font-size: 15px; font-weight: 600;">{{ log.opening_time || '--:--' }}</span>
                        </td>
                    </ng-container>

                    <!-- Closing Time -->
                    <ng-container matColumnDef="closing">
                        <th mat-header-cell *matHeaderCellDef style="font-weight: 600; padding: 12px 16px; font-size: 13px; text-transform: uppercase;"> Fermeture Réelle </th>
                        <td mat-cell *matCellDef="let log" style="padding: 12px 16px;">
                            <span style="font-family: monospace; font-size: 15px; font-weight: 600;">{{ log.closing_time || '--:--' }}</span>
                        </td>
                    </ng-container>

                    <!-- Conformity Score Badge -->
                    <ng-container matColumnDef="score">
                        <th mat-header-cell *matHeaderCellDef style="font-weight: 600; padding: 12px 16px; font-size: 13px; text-transform: uppercase;"> Score </th>
                        <td mat-cell *matCellDef="let log" style="padding: 12px 16px;">
                            <span class="score-badge"
                                [class.good]="log.score >= conformeMin"
                                [class.partial]="log.score >= partielMin && log.score < conformeMin"
                                [class.bad]="log.score < partielMin">
                                <mat-icon style="font-size: 16px; width: 16px; height: 16px; margin-right: 4px; vertical-align: middle;">
                                    {{ log.score >= conformeMin ? 'check_circle' : (log.score >= partielMin ? 'info' : 'warning') }}
                                </mat-icon>
                                <span style="vertical-align: middle;">{{ log.score }}%</span>
                            </span>
                        </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns" style="height: 56px; background-color: var(--surface-container-low);"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;" style="height: 56px; border-bottom: 1px solid var(--outline-variant);"></tr>
                </table>
            </div>

            <ng-template #noLogs>
                <div class="empty-state">
                    <mat-icon class="empty-icon">schedule</mat-icon>
                    <h3>Aucun horaire enregistré</h3>
                    <p>Aucun relevé d'horaire pour vos cafés ne correspond aux filtres appliqués.</p>
                </div>
            </ng-template>
        </div>
    </div>
    `,
    styles: [`
        :host { display: block; width: 100%; box-sizing: border-box; overflow-x: hidden; }
        .manager-dashboard { padding: 24px; min-height: 100vh; background: var(--background); box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .welcome-section { margin-bottom: 32px; }
        .welcome-section h1 { font-size: 28px; font-weight: 400; color: var(--on-background); margin: 0; }
        .subtitle { color: var(--on-surface-variant); font-size: 14px; margin-top: 4px; }

        .export-kpi-btn {
          border-radius: 20px !important;
          font-weight: 500 !important;
          padding: 4px 18px !important;
          height: 40px !important;
          background: linear-gradient(135deg, #107c41, #1f9a55) !important;
          color: white !important;
          border: 1px solid #0e6c38 !important;
          box-shadow: 0 2px 6px rgba(16, 124, 65, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          transition: all 0.2s ease-in-out !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 8px !important;
        }
        .export-kpi-btn:hover {
          background: linear-gradient(135deg, #0f703b, #1b8a4b) !important;
          box-shadow: 0 4px 12px rgba(16, 124, 65, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
          transform: translateY(-1px);
        }
        .export-kpi-btn:active {
          transform: translateY(0);
          box-shadow: 0 1px 3px rgba(16, 124, 65, 0.2) !important;
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

        .score-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
        }
        .score-badge.good {
            background-color: rgba(30, 142, 62, 0.1);
            color: #1e8e3e;
        }
        .score-badge.partial {
            background-color: rgba(249, 171, 0, 0.1);
            color: #b06000;
        }
        .score-badge.bad {
            background-color: rgba(217, 48, 37, 0.1);
            color: #d93025;
        }
        .table-responsive {
            width: 100%;
            overflow-x: auto;
        }
        .table-card {
            border-radius: 16px;
            border: 1px solid var(--outline-variant);
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
            overflow: hidden;
            background: var(--surface);
        }
        .header-buttons {
            display: flex;
            align-items: center;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
            .manager-dashboard { padding: 12px; }
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
    private dailyLogService = inject(DailyLogService);
    private coffeeService = inject(CoffeeService);
    private userService = inject(UserService);
    private configService = inject(ConfigService);
    private kpiService = inject(KpiService);
    private dialog = inject(MatDialog);

    @ViewChild('scoreChart') scoreChartRef!: ElementRef<HTMLCanvasElement>;
    @ViewChild('globalComplianceChartRef') globalComplianceChartRef!: ElementRef<HTMLCanvasElement>;
    private chart: Chart | undefined;
    private globalComplianceChart: Chart | undefined;
    private themeSub: any;

    allAudits: Audit[] = [];
    audits: Audit[] = [];
    currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
    userName = '';
    managedCoffeeCount = 0;
    totalAudits = 0;
    averageScore = 0;
    complianceRate = 0;
    globalTableData: any[] = [];
    auditsThisMonth = 0;

    coffees: any[] = [];
    users: any[] = [];
    userMap: { [id: number]: string } = {};
    thresholds: any = null;
    allDailyLogs: EnrichedLog[] = [];
    filteredDailyLogs: EnrichedLog[] = [];
    displayedColumns: string[] = ['date', 'coffeeName', 'opening', 'closing', 'score'];

    get conformeMin(): number { return this.thresholds?.green_min  ?? 100; }
    get partielMin():  number { return this.thresholds?.orange_min ??  90; }

    constructor() {
        effect(() => {
            // Re-init chart when theme changes
            this.themeService.isDarkMode();
            setTimeout(() => {
                this.initChart();
                this.initGlobalComplianceChart();
            }, 100);
        });
    }

    ngOnInit() {
        const user = this.authService.currentUser();
        this.userName = user?.full_name || user?.email || 'Manager';
        this.managedCoffeeCount = user?.managed_coffee_ids?.length || 0;

        // Load configs/thresholds
        this.configService.getScheduleThresholds().subscribe({
            next: (t) => { this.thresholds = t; },
            error: () => { /* use defaults */ }
        });

        // Load coffees and users, then load audits and logs
        this.coffeeService.getCoffees().subscribe(coffees => {
            this.coffees = coffees;
            
            this.userService.getUsers().subscribe(users => {
                this.users = users;
                users.forEach(u => { this.userMap[u.id] = u.full_name || u.email; });

                this.loadAudits();
                this.loadDailyLogs();
            });
        });
    }

    ngAfterViewInit() { }

    ngOnDestroy() {
        if (this.chart) this.chart.destroy();
        if (this.globalComplianceChart) this.globalComplianceChart.destroy();
    }

    loadAudits() {
        this.auditService.getAllAudits().subscribe(data => {
            this.allAudits = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            this.applyFilters();
        });
    }

    loadDailyLogs() {
        this.dailyLogService.getAllLogs().subscribe(logs => {
            this.allDailyLogs = logs;
            this.filterDailyLogs();
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
        
        this.filterDailyLogs();
        
        setTimeout(() => {
            this.initChart();
            this.initGlobalComplianceChart();
        }, 0);
    }

    filterDailyLogs() {
        let filtered = [...this.allDailyLogs];
        
        if (this.currentFilters.startDate) {
            const start = new Date(this.currentFilters.startDate);
            start.setHours(0, 0, 0, 0);
            filtered = filtered.filter(log => new Date(log.date) >= start);
        }
        if (this.currentFilters.endDate) {
            const end = new Date(this.currentFilters.endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(log => new Date(log.date) <= end);
        }
        if (this.currentFilters.coffeeShop) {
            filtered = filtered.filter(log => {
                const coffee = this.coffees.find(c => c.id === log.coffee_id);
                return coffee && coffee.name === this.currentFilters.coffeeShop;
            });
        }
        
        this.filteredDailyLogs = filtered.map(log => this.enrichLog(log))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    private enrichLog(log: DailyTimeRecord): EnrichedLog {
        const coffee = this.coffees.find(c => c.id === log.coffee_id);
        const coffeeName     = coffee ? coffee.name : `Café #${log.coffee_id}`;
        const controllerName = this.userMap[log.controller_id]
          || `Utilisateur #${log.controller_id}`;
        return { ...log, coffeeName, controllerName };
    }

    goToSchedules() {
        this.router.navigate(['/schedules']);
    }

    exportDailyLogsExcel() {
        if (!this.filteredDailyLogs.length) return;

        const rows = this.filteredDailyLogs.map(log => ({
            'Date': new DatePipe('en-US').transform(log.date, 'dd/MM/yyyy'),
            'Café': log.coffeeName,
            'Ouverture Réelle': log.opening_time || '--:--',
            'Fermeture Réelle': log.closing_time || '--:--',
            'Score de Conformité': log.score + '%',
            'Statut': log.score >= this.conformeMin ? 'Conforme' : (log.score >= this.partielMin ? 'Partiel' : 'Non Conforme'),
            'Saisi par': log.controllerName
        }));

        const replacer = (_key: string, value: any) => value === null ? '' : value;
        const header = Object.keys(rows[0]);
        const csv = rows.map(row =>
            header.map(field => JSON.stringify((row as any)[field], replacer)).join(',')
        );
        csv.unshift(header.join(','));

        const blob = new Blob(['\ufeff' + csv.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
        const url  = window.URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `horaires_export_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
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

    initGlobalComplianceChart() {
        if (!this.globalComplianceChartRef) return;
        if (this.globalComplianceChart) this.globalComplianceChart.destroy();

        const shops = this.coffees
            .filter(c => 
                this.allAudits.some(a => a.coffeeShop === c.name) ||
                this.allDailyLogs.some(log => log.coffee_id === c.id)
            )
            .map(c => c.name);

        if (shops.length === 0) {
            const auditShops = this.audits.map(a => a.coffeeShop);
            const logShops = this.filteredDailyLogs.map(l => l.coffeeName || '');
            const uniqueShops = [...new Set([...auditShops, ...logShops])].filter(Boolean);
            shops.push(...uniqueShops);
        }

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
                ? this.filteredDailyLogs.filter(log => log.coffee_id === coffeeObj.id)
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
                return;
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

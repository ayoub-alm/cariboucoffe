import { Component, ElementRef, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { FilterBarComponent, DashboardFilters } from '../../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../../core/services/dashboard-data.service';

Chart.register(...registerables);

@Component({
    selector: 'app-viewer-dashboard',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, FilterBarComponent],
    template: `
    <div class="viewer-dashboard">
        <div class="welcome-section">
            <div class="header-text">
                <h1>Bienvenue, {{ userName }}</h1>
                <p class="subtitle">Tableau de bord — <strong>{{ coffeeName }}</strong></p>
            </div>
            <button mat-flat-button color="primary" class="action-button" (click)="refreshData()">
                <mat-icon>refresh</mat-icon> Actualiser
            </button>
        </div>

        <app-filter-bar (filterChanged)="onFilterChanged($event)"></app-filter-bar>

        <div class="stats-grid">
            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container blue"><mat-icon>assignment</mat-icon></div>
                    <mat-card-title class="stat-label">Total Audits</mat-card-title>
                    <mat-card-subtitle>Historique</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ audits.length }}</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container gold"><mat-icon>trending_up</mat-icon></div>
                    <mat-card-title class="stat-label">Score Moyen</mat-card-title>
                    <mat-card-subtitle>Global</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ averageScore | number:'1.0-1' }}%</div></mat-card-content>
            </mat-card>

            <mat-card class="stat-card">
                <mat-card-header>
                    <div mat-card-avatar class="stat-icon-container" [ngClass]="complianceRate >= 80 ? 'green' : (complianceRate >= 50 ? 'orange' : 'red')">
                        <mat-icon>{{ complianceRate >= 80 ? 'check_circle' : 'warning' }}</mat-icon>
                    </div>
                    <mat-card-title class="stat-label">Taux de Conformité</mat-card-title>
                    <mat-card-subtitle>Audits conformes</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content><div class="stat-value">{{ complianceRate | number:'1.0-1' }}%</div></mat-card-content>
            </mat-card>
        </div>

        <div class="charts-section" *ngIf="audits.length > 0">
            <mat-card class="chart-card">
                <mat-card-header>
                    <div class="chart-header-title">
                        <mat-icon class="chart-icon">show_chart</mat-icon>
                        <mat-card-title>Évolution des Scores</mat-card-title>
                    </div>
                </mat-card-header>
                <mat-card-content>
                    <div class="chart-container"><canvas #scoreChart></canvas></div>
                </mat-card-content>
            </mat-card>
        </div>

        <div class="section-header">
            <h2 class="section-title">Audits Récents</h2>
        </div>

        <div class="audit-cards-grid" *ngIf="audits.length > 0; else noAudits">
            <mat-card *ngFor="let audit of recentAudits" class="audit-card" (click)="viewAudit(audit)">
                <mat-card-header>
                    <div mat-card-avatar class="card-avatar">
                        <mat-icon>storefront</mat-icon>
                    </div>
                    <mat-card-title>{{ audit.date | date:'dd/MM/yyyy' }}</mat-card-title>
                    <mat-card-subtitle>{{ audit.auditorName }}</mat-card-subtitle>
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
                <div class="empty-icon-wrap"><mat-icon class="empty-icon">visibility</mat-icon></div>
                <h3>Aucun audit disponible</h3>
                <p>Les audits pour votre café apparaîtront ici.</p>
            </mat-card>
        </ng-template>
    </div>
    `,
    styles: [`
        :host { display: block; width: 100%; box-sizing: border-box; overflow-x: hidden; }
        .viewer-dashboard { padding: 32px; min-height: 100vh; background: var(--background); box-sizing: border-box; width: 100%; overflow-x: hidden; }
        .welcome-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
        .header-text h1 { font-size: 32px; font-weight: 700; color: var(--on-background); margin: 0 0 8px 0; letter-spacing: -0.5px; }
        .subtitle { color: var(--on-surface-variant); font-size: 16px; margin: 0; }
        .action-button { border-radius: 8px; font-weight: 500; letter-spacing: 0.5px; padding: 0 24px; height: 44px; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 32px; }
        .stat-card { border-radius: 16px; transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); box-shadow: 0 4px 12px rgba(0,0,0,0.03); background: var(--surface); border: 1px solid rgba(0,0,0,0.05); }
        .stat-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); }
        
        .stat-icon-container { border-radius: 12px; display: flex; align-items: center; justify-content: center; width: 56px; height: 56px; }
        .stat-icon-container mat-icon { font-size: 28px; width: 28px; height: 28px; }
        .stat-icon-container.blue { background-color: #e5eff2; color: #00637F; }
        .stat-icon-container.gold { background-color: #faf6eb; color: #cda252; }
        .stat-icon-container.green { background-color: #e8f5e9; color: #2e7d32; }
        .stat-icon-container.orange { background-color: #fff3e0; color: #f57c00; }
        .stat-icon-container.red { background-color: #ffebee; color: #c62828; }
        
        .stat-label { font-size: 15px; font-weight: 600; color: var(--on-surface-variant); margin-top: 4px; }
        .stat-value { font-size: 36px; font-weight: 800; color: var(--on-surface); margin-top: 12px; letter-spacing: -1px; }

        .charts-section { margin-bottom: 40px; min-width: 0; }
        .chart-card { border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); background: var(--surface); padding-bottom: 24px; border: 1px solid rgba(0,0,0,0.05); min-width: 0; overflow: hidden; }
        .chart-header-title { display: flex; align-items: center; gap: 12px; }
        .chart-icon { color: #00637F; background: #e5eff2; padding: 8px; border-radius: 8px; width: 40px; height: 40px; display: flex; justify-content: center; align-items: center; box-sizing: border-box; }
        .chart-container { position: relative; height: 320px; width: 100%; margin-top: 24px; padding: 0 24px; min-width: 0; }

        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .section-title { font-size: 24px; font-weight: 700; color: var(--on-background); margin: 0; letter-spacing: -0.5px; }
        
        .audit-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .audit-card { border-radius: 16px; cursor: pointer; transition: all 0.3s ease; background: var(--surface); box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.05); }
        .audit-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px rgba(0,0,0,0.08); border-color: rgba(0,99,127,0.2); }
        .card-avatar { background-color: #f5f5f5; color: #555; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
        
        .audit-card-body { display: flex; align-items: center; justify-content: space-between; margin-top: 16px; padding: 8px 0; border-top: 1px dashed rgba(0,0,0,0.1); }
        .score-display { font-size: 32px; font-weight: 800; }
        .score-display.good { color: #2e7d32; }
        .score-display.medium { color: #f57c00; }
        .score-display.bad { color: #c62828; }
        
        .status-chip { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px; }
        .status-chip.conforme { background: #e8f5e9; color: #2e7d32; }
        .status-chip.non-conforme { background: #ffebee; color: #c62828; }
        .status-chip.en-cours { background: #fff3e0; color: #e65100; }

        .empty-state { text-align: center; padding: 64px 24px; border-radius: 24px; background: transparent; border: 2px dashed rgba(0,0,0,0.1); box-shadow: none; }
        .empty-icon-wrap { width: 96px; height: 96px; background: rgba(0,0,0,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .empty-icon { font-size: 48px; width: 48px; height: 48px; color: var(--on-surface-variant); }
        .empty-state h3 { margin: 0 0 12px; font-size: 24px; font-weight: 600; color: var(--on-surface); }
        .empty-state p { color: var(--on-surface-variant); font-size: 16px; margin: 0; }
        
        @media (max-width: 768px) {
            .viewer-dashboard { padding: 12px; }
            .welcome-section { flex-direction: column; gap: 16px; align-items: flex-start; margin-bottom: 24px; }
            .header-text h1 { font-size: 24px; }
            .subtitle { font-size: 14px; }
            .stats-grid { grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
            .stat-card { padding: 12px; }
            .stat-icon-container { width: 40px; height: 40px; }
            .stat-icon-container mat-icon { font-size: 20px; width: 20px; height: 20px; }
            .stat-label { font-size: 12px; }
            .stat-value { font-size: 24px; margin-top: 8px; }
            .charts-section { margin-bottom: 24px; }
            .chart-card { border-radius: 16px; padding-bottom: 16px; }
            .chart-container { height: 220px; margin-top: 16px; padding: 0 12px; }
            .audit-cards-grid { grid-template-columns: 1fr; }
            .section-title { font-size: 20px; }
        }
        
        @media (max-width: 480px) {
            .stats-grid { grid-template-columns: 1fr; }
            .action-button { width: 100%; }
        }
    `]
})
export class ViewerDashboardComponent implements OnInit, OnDestroy {
    private auditService = inject(AuditService);
    private authService = inject(AuthService);
    private dashboardDataService = inject(DashboardDataService);
    private router = inject(Router);

    @ViewChild('scoreChart') scoreChartRef!: ElementRef<HTMLCanvasElement>;
    private scoreChart: Chart | undefined;

    allAudits: Audit[] = [];
    audits: Audit[] = [];
    currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
    recentAudits: Audit[] = [];
    userName = '';
    coffeeName = '';
    averageScore = 0;
    complianceRate = 0;

    ngOnInit() {
        const user = this.authService.currentUser();
        this.userName = user?.full_name || user?.email || 'Visualiseur';
        this.coffeeName = user?.coffee?.name || 'Mon Café';
        this.loadAudits();
    }

    ngOnDestroy() {
        if (this.scoreChart) this.scoreChart.destroy();
    }

    refreshData() {
        this.loadAudits();
    }

    loadAudits() {
        this.auditService.getAudits().subscribe(data => {
            // Sort audits chronologically desc
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
        this.recentAudits = this.audits; 
        this.averageScore = kpis.averageScore;
        this.complianceRate = kpis.complianceRate;

        setTimeout(() => this.initChart(), 0);
    }

    initChart() {
        if (!this.scoreChartRef) return;

        // Display up to 12 recent audits chronologically (oldest to newest for the chart logic)
        const chronologicalAudits = [...this.audits].slice(0, 12).reverse();

        if (this.scoreChart) {
            this.scoreChart.destroy();
        }

        const gradientFill = this.scoreChartRef.nativeElement.getContext('2d')?.createLinearGradient(0, 0, 0, 400);
        if (gradientFill) {
            gradientFill.addColorStop(0, 'rgba(0, 99, 127, 0.4)');
            gradientFill.addColorStop(1, 'rgba(0, 99, 127, 0.0)');
        }

        this.scoreChart = new Chart(this.scoreChartRef.nativeElement, {
            type: 'line',
            data: {
                labels: chronologicalAudits.map(a => new Date(a.date).toLocaleDateString()),
                datasets: [{
                    label: 'Score (%)',
                    data: chronologicalAudits.map(a => a.score),
                    backgroundColor: gradientFill || 'rgba(0, 99, 127, 0.2)',
                    borderColor: '#00637F',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#00637F',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        ticks: { font: { family: 'Inter, sans-serif' } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Inter, sans-serif' } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        titleFont: { size: 14, family: 'Inter' },
                        bodyFont: { size: 14, family: 'Inter' },
                        displayColors: false,
                        callbacks: {
                            label: (context) => `Score: ${context.parsed.y}%`
                        }
                    }
                }
            }
        });
    }

    viewAudit(audit: Audit) {
        this.router.navigate(['/audits', audit.id]);
    }
}

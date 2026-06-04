import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../core/services/audit.service';
import { RouterModule } from '@angular/router';
import { KpiService } from '../../core/services/kpi.service';
import { AuditUI as Audit } from '../../core/models/audit.model';
import { DailyLogService } from '../../core/services/daily-log.service';
import { CoffeeService } from '../../core/services/coffee.service';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ExportKpiDialogComponent } from './export-kpi-dialog/export-kpi-dialog.component';

import { FilterBarComponent, DashboardFilters } from '../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../core/services/dashboard-data.service';
import { ThemeService } from '../../core/services/theme.service';
import { effect } from '@angular/core';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatButtonModule, CommonModule, RouterModule, FilterBarComponent, MatDialogModule, ExportKpiDialogComponent],
  template: `
    <div class="dashboard-container">
      <div class="breadcrumb-container">
          <mat-icon class="breadcrumb-icon">home</mat-icon>
          <div class="breadcrumb-text">
            <a routerLink="/" class="breadcrumb-link">Admin</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">Dashboard</span>
          </div>
      </div>

      <div class="dashboard-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px;">
        <h1 class="dashboard-title" style="margin: 0;">Tableau de Bord Caribou</h1>
        <button mat-flat-button class="export-kpi-btn" (click)="exportMonthlyKPIsExcel()">
          <mat-icon>download</mat-icon> Exporter KPIs Mensuels
        </button>
      </div>
      
      <app-filter-bar (filterChanged)="onFilterChanged($event)"></app-filter-bar>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="stat-icon-container blue">
                <mat-icon>assignment</mat-icon>
            </div>
            <mat-card-title class="stat-label">Total Audits</mat-card-title>
            <mat-card-subtitle>Global</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ totalAudits }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="stat-icon-container gold">
                <mat-icon>trending_up</mat-icon>
            </div>
            <mat-card-title class="stat-label">Score Moyen</mat-card-title>
            <mat-card-subtitle>Global</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ averageScore | number:'1.1-1' }}%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="stat-icon-container blue">
                <mat-icon>check_circle</mat-icon>
            </div>
            <mat-card-title class="stat-label">Conformité</mat-card-title>
            <mat-card-subtitle>Taux Global</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ complianceRate | number:'1.1-1' }}%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
             <div mat-card-avatar class="stat-icon-container brown">
                <mat-icon>event</mat-icon>
            </div>
            <mat-card-title class="stat-label">Audits (Mois)</mat-card-title>
            <mat-card-subtitle>Ce mois-ci</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ auditsMonth }}</div>
          </mat-card-content>
        </mat-card>

      </div>

      <div class="secondary-stats-grid">
         <mat-card class="mini-stat-card">
            <mat-card-title>Top Performer: <strong>{{ topPerformer }}</strong></mat-card-title>
         </mat-card>
         <mat-card class="mini-stat-card">
            <mat-card-title>Score Moyen (Mois): <strong>{{ avgScoreMonth }}%</strong></mat-card-title>
         </mat-card>
      </div>

      <div class="charts-grid">
         <mat-card class="chart-card bar-chart-full">
            <mat-card-header>
                <mat-card-title>Scores par Café (Moyenne)</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container">
                   <canvas #barCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>

         <mat-card class="chart-card pie-chart">
            <mat-card-header>
                <mat-card-title>Répartition Conformité</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container pie-container">
                   <canvas #pieCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>

         <mat-card class="chart-card bar-chart">
            <mat-card-header>
                <mat-card-title>Conformité par Catégorie</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container">
                   <canvas #categoryCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>

         <mat-card class="chart-card bar-chart-full">
             <mat-card-header>
                 <mat-card-title>Conformité Globale par Café (Audits + Horaires)</mat-card-title>
             </mat-card-header>
             <mat-card-content>
                <div class="chart-container">
                    <canvas #globalComplianceCanvas></canvas>
                 </div>
              </mat-card-content>
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
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; box-sizing: border-box; overflow-x: hidden; }
    .dashboard-container { padding: 24px; background-color: var(--background); min-height: 100vh; box-sizing: border-box; width: 100%; overflow-x: hidden; }
    
    /* Breadcrumb */
    .breadcrumb-container { margin-bottom: 24px; display: flex; align-items: center; color: var(--on-surface-variant); }
    .breadcrumb-icon { font-size: 18px; margin-right: 8px; height: 18px; width: 18px; color: var(--on-surface-variant); }
    .breadcrumb-text { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-link { color: var(--on-surface-variant); text-decoration: none; transition: color 0.2s; }
    .breadcrumb-link:hover { color: var(--primary); text-decoration: underline; }
    .breadcrumb-separator { color: var(--outline); font-size: 12px; }
    .breadcrumb-current { color: var(--on-surface); font-weight: 600; }

    .dashboard-title { color: var(--on-background); font-weight: 400; font-family: 'Google Sans', sans-serif; }

    /* Excel export button styling */
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
    .stat-value.success { color: #1e8e3e; }
    .stat-value.warning { color: #f9ab00; }
    .stat-value.error { color: #d93025; }
    
    .secondary-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px; }
    
    .mini-stat-card { padding: 16px; border-radius: 8px; background: var(--surface-container); color: var(--on-surface); }
    .mini-stat-card mat-card-title { margin: 0; font-size: 14px; color: var(--on-surface); }

    .charts-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; min-width: 0; }
    
    .chart-card { grid-column: span 12; min-height: 350px; border-radius: 24px; box-shadow: var(--shadow-sm); border: none; background: var(--surface); color: var(--on-surface); min-width: 0; overflow: hidden; }
    
    @media (min-width: 769px) {
      .chart-card.bar-chart { grid-column: span 6; }
      .chart-card.pie-chart { grid-column: span 6; }
      .chart-card.bar-chart-full { grid-column: span 12; }
    }

    .chart-container { position: relative; height: 300px; width: 100%; margin-top: 16px; min-width: 0; }
    .pie-container { display: flex; justify-content: center; }

    /* ── Mobile ── */
    @media (max-width: 768px) {
      .dashboard-container { padding: 12px; }
      .dashboard-title { font-size: 20px; margin-bottom: 0; }
      .breadcrumb-container { margin-bottom: 16px; }

      .dashboard-header-row {
        flex-direction: column;
        align-items: stretch !important;
        gap: 12px !important;
      }
      .export-kpi-btn {
        width: 100%;
        justify-content: center;
      }

      /* 1-column KPI grid on mobile */
      .stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }
      .stat-value { font-size: 24px; }
      .stat-label { font-size: 13px; }
      .stat-icon-container { width: 38px; height: 38px; }

      .secondary-stats-grid {
        grid-template-columns: 1fr;
        gap: 12px;
        margin-bottom: 16px;
      }

      /* Full-width charts, reduced height */
      .charts-grid {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .chart-card { min-height: 280px; border-radius: 16px; grid-column: span 12; }
      .chart-container { height: 220px; }
      .pie-container { height: 240px; }
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; gap: 8px; }
      .stat-value { font-size: 20px; }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private auditService = inject(AuditService);
  private kpiService = inject(KpiService);
  private dashboardDataService = inject(DashboardDataService);
  private themeService = inject(ThemeService);
  private dailyLogService = inject(DailyLogService);
  private coffeeService = inject(CoffeeService);
  private dialog = inject(MatDialog);

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('globalComplianceCanvas') globalComplianceCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart: Chart | undefined;
  private pieChart: Chart | undefined;
  private categoryChart: Chart | undefined;
  private globalComplianceChart: Chart | undefined;

  totalAudits = 0;
  averageScore = 0;
  complianceRate = 0;
  auditsMonth = 0;
  avgScoreMonth = 0;
  topPerformer = '';
  allAudits: Audit[] = [];
  audits: Audit[] = [];
  currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };
  coffees: any[] = [];
  allDailyLogs: any[] = [];
  globalTableData: any[] = [];

  constructor() {
    effect(() => {
        this.themeService.isDarkMode();
        setTimeout(() => this.initCharts(), 100);
    });
  }

  ngOnInit(): void {
    this.coffeeService.getCoffees().subscribe(coffees => {
      this.coffees = coffees;
      this.loadData();
    });
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.globalComplianceChart) this.globalComplianceChart.destroy();
  }

  loadData() {
    this.auditService.getAllAudits(this.currentFilters).subscribe(data => {
      this.allAudits = data;

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
          console.error('Error loading daily logs for dashboard', err);
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
    this.totalAudits = kpis.totalAudits;
    this.averageScore = kpis.averageScore;
    this.complianceRate = kpis.complianceRate;
    this.auditsMonth = kpis.auditsMonth;
    this.avgScoreMonth = kpis.avgScoreMonth;
    this.topPerformer = kpis.topPerformer;
    
    setTimeout(() => this.initCharts(), 0);
  }

  initCharts() {
    if (!this.barCanvas || !this.pieCanvas || !this.categoryCanvas || !this.globalComplianceCanvas) return;

    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.globalComplianceChart) this.globalComplianceChart.destroy();

    const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
    const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
    const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

    const shops = [...new Set(this.audits.map(a => a.coffeeShop))];
    const shopScores = shops.map(shop => {
      const shopAudits = this.audits.filter(a => a.coffeeShop === shop);
      const sum = shopAudits.reduce((acc, curr) => acc + curr.score, 0);
      return shopAudits.length > 0 ? sum / shopAudits.length : 0;
    });

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: shops.map(s => s.replace('Caribou ', '')),
        datasets: [{
          label: 'Score Moyen (%)',
          data: shopScores,
          backgroundColor: primaryColor,
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

    const conforming = this.audits.filter(a => a.status === 'Conforme').length;
    const nonConforming = this.audits.filter(a => a.status !== 'Conforme').length;

    const secondaryColor = this.themeService.getColor('--secondary') || '#5f6368';

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Conforme', 'Non-conforme'],
        datasets: [{
          data: [conforming, nonConforming],
          backgroundColor: [primaryColor, secondaryColor],
          borderWidth: 0,
          hoverOffset: 4
        }]
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

    this.initCategoryComplianceChart();
    this.initGlobalComplianceChart();
  }

  initCategoryComplianceChart() {
    const categoryMap = new Map<string, { total: number, compliant: number }>();

    this.audits.forEach(audit => {
      if (audit.categories) {
        audit.categories.forEach(cat => {
          if (!categoryMap.has(cat.name)) {
            categoryMap.set(cat.name, { total: 0, compliant: 0 });
          }
          cat.items.forEach(item => {
            if (item.status === 'oui' || item.status === 'non') {
              const stats = categoryMap.get(cat.name)!;
              stats.total++;
              if (item.status === 'oui') stats.compliant++;
            }
          });
        });
      }
    });

    const labels = Array.from(categoryMap.keys());
    const data = labels.map(label => {
      const stats = categoryMap.get(label)!;
      return stats.total > 0 ? (stats.compliant / stats.total) * 100 : 0;
    });

    const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
    const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
    const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

    this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Conformité (%)',
          data: data,
          backgroundColor: primaryColor,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { 
            beginAtZero: true, 
            max: 100, 
            grid: { color: gridColor },
            ticks: { color: textColor }
          },
          y: { 
            grid: { display: false },
            ticks: { color: textColor }
          }
        },
        plugins: { legend: { display: false } }
      }
    });
  }


  initGlobalComplianceChart() {
    if (!this.globalComplianceCanvas) return;
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

    this.globalComplianceChart = new Chart(this.globalComplianceCanvas.nativeElement, {
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

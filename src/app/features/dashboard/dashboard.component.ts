import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../core/services/audit.service';
import { RouterModule } from '@angular/router';
import { KpiService } from '../../core/services/kpi.service';
import { AuditUI as Audit } from '../../core/models/audit.model';

import { FilterBarComponent, DashboardFilters } from '../../shared/components/filter-bar/filter-bar.component';
import { DashboardDataService } from '../../core/services/dashboard-data.service';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, CommonModule, RouterModule, FilterBarComponent],
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

      <h1 class="dashboard-title">Tableau de Bord Caribou</h1>
      
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
         <mat-card class="chart-card">
            <mat-card-header>
                <mat-card-title>Scores par Café (Moyenne)</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container">
                   <canvas #barCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>

         <mat-card class="chart-card">
            <mat-card-header>
                <mat-card-title>Répartition Conformité</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container pie-container">
                   <canvas #pieCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>

         <mat-card class="chart-card">
            <mat-card-header>
                <mat-card-title>Conformité par Catégorie</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container">
                   <canvas #categoryCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>

         <mat-card class="chart-card">
            <mat-card-header>
                <mat-card-title>Conformité par Café</mat-card-title>
            </mat-card-header>
            <mat-card-content>
               <div class="chart-container">
                   <canvas #cafeComplianceCanvas></canvas>
               </div>
            </mat-card-content>
         </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; background-color: var(--background); min-height: 100vh; }
    
    /* Breadcrumb */
    .breadcrumb-container { margin-bottom: 24px; display: flex; align-items: center; color: var(--on-surface-variant); }
    .breadcrumb-icon { font-size: 18px; margin-right: 8px; height: 18px; width: 18px; color: var(--on-surface-variant); }
    .breadcrumb-text { font-size: 14px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
    .breadcrumb-link { color: var(--on-surface-variant); text-decoration: none; transition: color 0.2s; }
    .breadcrumb-link:hover { color: var(--primary); text-decoration: underline; }
    .breadcrumb-separator { color: var(--outline); font-size: 12px; }
    .breadcrumb-current { color: var(--on-surface); font-weight: 600; }

    .dashboard-title { color: var(--on-background); margin-bottom: 24px; font-weight: 400; font-family: 'Google Sans', sans-serif; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; margin-bottom: 24px; }
    
    .stat-card { border-radius: 12px; transition: transform 0.2s; box-shadow: var(--shadow-sm); background: var(--surface); color: var(--on-surface); }
    .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    
    .stat-icon-container { border-radius: 50%; display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; }
    .stat-icon-container.blue { background-color: #e5eff2; color: #00637F; }
    .stat-icon-container.gold { background-color: #faf6eb; color: #cda252; }
    .stat-icon-container.brown { background-color: #efeceb; color: #5D4037; }

    .stat-label { font-size: 16px; font-weight: 500; color: var(--on-surface-variant); }
    .stat-value { font-size: 32px; font-weight: 700; color: var(--on-surface); margin-top: 8px; }
    
    .secondary-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 24px; }
    
    .mini-stat-card { padding: 16px; border-radius: 8px; background: var(--surface-container); color: var(--on-surface); }
    .mini-stat-card mat-card-title { margin: 0; font-size: 14px; color: var(--on-surface); }

    .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; }
    
    .chart-card { min-height: 350px; border-radius: 24px; box-shadow: var(--shadow-sm); border: none; background: var(--surface); color: var(--on-surface); }
    
    .chart-container { position: relative; height: 300px; width: 100%; margin-top: 16px; }
    .pie-container { display: flex; justify-content: center; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private auditService = inject(AuditService);
  private kpiService = inject(KpiService);
  private dashboardDataService = inject(DashboardDataService);

  @ViewChild('barCanvas') barCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cafeComplianceCanvas') cafeComplianceCanvas!: ElementRef<HTMLCanvasElement>;

  private barChart: Chart | undefined;
  private pieChart: Chart | undefined;
  private categoryChart: Chart | undefined;
  private cafeComplianceChart: Chart | undefined;

  totalAudits = 0;
  averageScore = 0;
  complianceRate = 0;
  auditsMonth = 0;
  avgScoreMonth = 0;
  topPerformer = '';
  allAudits: Audit[] = [];
  audits: Audit[] = [];
  currentFilters: DashboardFilters = { startDate: null, endDate: null, coffeeShop: null, auditorName: null, categoryName: null };

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.cafeComplianceChart) this.cafeComplianceChart.destroy();
  }

  loadData() {
    this.auditService.getAudits().subscribe(data => {
      this.allAudits = data;
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
    this.auditsMonth = kpis.auditsMonth;
    this.avgScoreMonth = kpis.avgScoreMonth;
    this.topPerformer = kpis.topPerformer;
    
    setTimeout(() => this.initCharts(), 0);
  }

  initCharts() {
    if (!this.barCanvas || !this.pieCanvas || !this.categoryCanvas || !this.cafeComplianceCanvas) return;

    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.cafeComplianceChart) this.cafeComplianceChart.destroy();

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
          backgroundColor: '#00637F',
          borderRadius: 4,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });

    const conforming = this.audits.filter(a => a.status === 'Conforme').length;
    const nonConforming = this.audits.filter(a => a.status === 'Non-conforme').length;

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Conforme', 'Non-conforme'],
        datasets: [{
          data: [conforming, nonConforming],
          backgroundColor: ['#00637F', '#5D4037'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        cutout: '70%'
      }
    });

    this.initCategoryComplianceChart();
    this.initCafeComplianceChart();
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

    this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Conformité (%)',
          data: data,
          backgroundColor: '#00637F',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, max: 100, grid: { color: '#f0f0f0' } },
          y: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }

  initCafeComplianceChart() {
    const shops = [...new Set(this.audits.map(a => a.coffeeShop))];
    const cafeCompliance = shops.map(shop => {
      const shopAudits = this.audits.filter(a => a.coffeeShop === shop);
      const compliantCount = shopAudits.filter(a => a.status === 'Conforme').length;
      return shopAudits.length > 0 ? (compliantCount / shopAudits.length) * 100 : 0;
    });

    this.cafeComplianceChart = new Chart(this.cafeComplianceCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: shops.map(s => s.replace('Caribou ', '')),
        datasets: [{
          label: 'Conformité (%)',
          data: cafeCompliance,
          backgroundColor: cafeCompliance.map(rate =>
            rate >= 85 ? '#00637F' : rate >= 70 ? '#5D4037' : '#E57373'
          ),
          borderRadius: 4,
          barThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 100, grid: { color: '#f0f0f0' } },
          x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
      }
    });
  }
}

import { Component, ElementRef, inject, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AuditService } from '../../core/services/audit.service';
import { Audit } from '../../core/models/audit.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, CommonModule],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">Tableau de Bord</h1>
      
      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="stat-icon-container">
                <mat-icon>assignment</mat-icon>
            </div>
            <mat-card-title class="stat-label">Total Audits</mat-card-title>
            <mat-card-subtitle>Ce mois</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ totalAudits }}</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="stat-icon-container blue">
                <mat-icon>trending_up</mat-icon>
            </div>
            <mat-card-title class="stat-label">Score Moyen</mat-card-title>
            <mat-card-subtitle>Global</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ averageScore | number:'1.0-0' }}%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
            <div mat-card-avatar class="stat-icon-container green">
                <mat-icon>check_circle</mat-icon>
            </div>
            <mat-card-title class="stat-label">Conformité</mat-card-title>
            <mat-card-subtitle>Taux</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ complianceRate | number:'1.0-0' }}%</div>
          </mat-card-content>
        </mat-card>

        <mat-card class="stat-card">
          <mat-card-header>
             <div mat-card-avatar class="stat-icon-container red">
                <mat-icon>warning</mat-icon>
            </div>
            <mat-card-title class="stat-label">Alertes</mat-card-title>
            <mat-card-subtitle>En cours</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="stat-value">{{ alertsCount }}</div>
          </mat-card-content>
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
    .dashboard-container { padding: 24px; }
    .dashboard-title { color: #3E2723; margin-bottom: 24px; font-weight: 500; font-family: 'Outfit', sans-serif; }
    
    .stats-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
        gap: 24px; 
        margin-bottom: 24px; 
    }
    
    .stat-card { 
        border-radius: 12px;
        transition: transform 0.2s;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .stat-card:hover { transform: translateY(-2px); }
    
    .stat-icon-container {
        border-radius: 50%;
        background-color: #EFEBE9; /* Brown 50 */
        color: #5D4037;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .stat-icon-container.blue { background-color: #E3F2FD; color: var(--primary-color); }
    .stat-icon-container.green { background-color: #E8F5E9; color: #2E7D32; }
    .stat-icon-container.red { background-color: #FFEBEE; color: #C62828; }

    .stat-label { font-size: 16px; font-weight: 500; }
    
    .stat-value { 
        font-size: 32px; 
        font-weight: 700; 
        color: #3E2723; 
        margin-top: 8px; 
    }
    
    .charts-grid { 
        display: grid; 
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); 
        gap: 24px; 
    }
    
    .chart-card { min-height: 350px; border-radius: 12px; }
    
    .chart-container {
        position: relative;
        height: 300px;
        width: 100%;
        margin-top: 16px;
    }
    .pie-container {
        display: flex;
        justify-content: center;
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private auditService = inject(AuditService);

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
  alertsCount = 0;

  audits: Audit[] = [];

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data load in loadData() -> initCharts()
    // But if data is instant, we might need to check. 
    // Since loadData calls service which is async (mock delay), we are safe to wait for subscription.
  }

  ngOnDestroy(): void {
    if (this.barChart) this.barChart.destroy();
    if (this.pieChart) this.pieChart.destroy();
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.cafeComplianceChart) this.cafeComplianceChart.destroy();
  }

  loadData() {
    this.auditService.getAudits().subscribe(data => {
      this.audits = data;
      this.calculateStats();
      // Allow view to settle before rendering charts if viewChild not yet available
      setTimeout(() => this.initCharts(), 0);
    });
  }

  calculateStats() {
    this.totalAudits = this.audits.length;
    if (this.totalAudits === 0) return;

    const totalScore = this.audits.reduce((acc, curr) => acc + curr.score, 0);
    this.averageScore = totalScore / this.totalAudits;

    const compliantCount = this.audits.filter(a => a.status === 'Conforme').length;
    this.complianceRate = (compliantCount / this.totalAudits) * 100;

    this.alertsCount = this.audits.filter(a => a.status === 'Non-conforme').length;
  }

  initCharts() {
    if (!this.barCanvas || !this.pieCanvas || !this.categoryCanvas || !this.cafeComplianceCanvas) return;

    // 1. Bar Chart: Average Score per Coffee Shop
    const shops = [...new Set(this.audits.map(a => a.coffeeShop))];
    const shopScores = shops.map(shop => {
      const shopAudits = this.audits.filter(a => a.coffeeShop === shop);
      const sum = shopAudits.reduce((acc, curr) => acc + curr.score, 0);
      return sum / shopAudits.length;
    });

    this.barChart = new Chart(this.barCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: shops.map(s => s.replace('Caribou ', '')), // Shorten names
        datasets: [{
          label: 'Score Moyen (%)',
          data: shopScores,
          backgroundColor: '#326295', // Primary Blue
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
            grid: { color: '#f0f0f0' }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // 2. Pie Chart: Compliance Distribution
    const conforming = this.audits.filter(a => a.status === 'Conforme').length;
    const nonConforming = this.audits.filter(a => a.status === 'Non-conforme').length;

    this.pieChart = new Chart(this.pieCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Conforme', 'Non-conforme'],
        datasets: [{
          data: [conforming, nonConforming],
          backgroundColor: ['#4CAF50', '#F44336'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        cutout: '70%'
      }
    });

    // 3. Horizontal Bar Chart: Compliance by Category
    this.initCategoryComplianceChart();

    // 4. Bar Chart: Compliance by Cafe
    this.initCafeComplianceChart();
  }

  initCategoryComplianceChart() {
    // Calculate compliance rate per category across all audits
    const categoryNames: string[] = [];
    const complianceRates: number[] = [];

    // Get all unique categories from AUDIT_CATEGORIES_TEMPLATE
    const categories = [
      { id: 'hygiene', name: 'Hygiène & Sécurité' },
      { id: 'staff', name: 'Personnel & Connaissance' },
      { id: 'quality', name: 'Qualité des produits' },
      { id: 'maintenance', name: 'Maintenance & Matériel' },
      { id: 'zone_client', name: 'Zone client & Ambiance' },
      { id: 'gestion', name: 'Gestion / Système' },
      { id: 'stock', name: 'Stock / Réception' },
      { id: 'marketing', name: 'Marketing & Conclusion' }
    ];

    categories.forEach(cat => {
      let totalQuestions = 0;
      let compliantQuestions = 0;

      // Iterate through all audits and sum up compliance for this category
      this.audits.forEach(audit => {
        const auditCategory = audit.categories?.find(c => c.id === cat.id);
        if (auditCategory) {
          auditCategory.items.forEach(item => {
            if (item.status === 'oui' || item.status === 'non') {
              totalQuestions++;
              if (item.status === 'oui') {
                compliantQuestions++;
              }
            }
          });
        }
      });

      if (totalQuestions > 0) {
        categoryNames.push(cat.name);
        complianceRates.push((compliantQuestions / totalQuestions) * 100);
      }
    });

    this.categoryChart = new Chart(this.categoryCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: categoryNames,
        datasets: [{
          label: 'Taux de Conformité (%)',
          data: complianceRates,
          backgroundColor: '#4CAF50',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            max: 100,
            grid: { color: '#f0f0f0' }
          },
          y: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }

  initCafeComplianceChart() {
    // Calculate compliance rate per cafe
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
          label: 'Taux de Conformité (%)',
          data: cafeCompliance,
          backgroundColor: cafeCompliance.map(rate =>
            rate >= 85 ? '#4CAF50' : rate >= 70 ? '#FF9800' : '#F44336'
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
            grid: { color: '#f0f0f0' }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}

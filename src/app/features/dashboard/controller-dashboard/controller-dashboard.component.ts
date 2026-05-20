import { Component, inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DailyLogService } from '../../../core/services/daily-log.service';
import { CoffeeService } from '../../../core/services/coffee.service';
import { AuthService } from '../../../core/services/auth.service';
import { Coffee } from '../../../core/models/coffee.model';
import { MatTableModule } from '@angular/material/table';
import { DailyTimeRecord } from '../../../core/services/daily-log.service';
import { Chart, registerables } from 'chart.js';
import { ThemeService } from '../../../core/services/theme.service';

Chart.register(...registerables);

@Component({
  selector: 'app-controller-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatTableModule
  ],
  template: `
    <div class="dashboard-container">
      <!-- HEADER WITH FILTER -->
      <div class="dashboard-header">
        <div>
          <h1 class="dashboard-title">Tableau de Bord Contrôleur</h1>
          <p class="subtitle">Consulter l'historique et les performances par café</p>
        </div>
        
        <form [formGroup]="form" class="filter-form">
          <mat-form-field appearance="outline" class="filter-select">
            <mat-label>Filtrer par Café</mat-label>
            <mat-select formControlName="coffee_id">
              <mat-option *ngFor="let coffee of coffees" [value]="coffee.id">
                {{ coffee.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </form>
      </div>

      <!-- METRICS & CHARTS -->
      <div class="stats-row">
        <!-- Last Month Compliance KPI -->
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-title">Score du Mois Dernier</div>
            <div class="stat-value" [class.good]="lastMonthScore >= 80" [class.bad]="lastMonthScore < 80 && lastMonthScore > 0">
              {{ lastMonthScore | number:'1.0-0' }}%
            </div>
            <p class="stat-desc">Taux de conformité global</p>
          </mat-card-content>
        </mat-card>

        <!-- Dynamic Chart -->
        <mat-card class="stat-card chart-card">
          <mat-card-header>
             <mat-card-title class="chart-title">Historique Annuel (Scores mensuels)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
               <canvas #yearlyChartCanvas></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- SCHEDULES LOG REGISTER -->
      <mat-card class="table-card">
        <mat-card-header class="table-header">
          <mat-card-title>Historique des horaires enregistrés</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-responsive">
            <table mat-table [dataSource]="logs" class="full-width-table">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef> Date </th>
                <td mat-cell *matCellDef="let log"> {{ log.date | date:'dd/MM/yyyy' }} </td>
              </ng-container>
              
              <ng-container matColumnDef="opening">
                <th mat-header-cell *matHeaderCellDef> Ouverture </th>
                <td mat-cell *matCellDef="let log"> {{ log.opening_time || '--:--' }} </td>
              </ng-container>

              <ng-container matColumnDef="closing">
                <th mat-header-cell *matHeaderCellDef> Fermeture </th>
                <td mat-cell *matCellDef="let log"> {{ log.closing_time || '--:--' }} </td>
              </ng-container>

              <ng-container matColumnDef="score">
                <th mat-header-cell *matHeaderCellDef> Score </th>
                <td mat-cell *matCellDef="let log"> 
                  <span class="score-badge" [class.good]="log.score >= 80" [class.bad]="log.score < 80">
                    {{ log.score }}%
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['date', 'opening', 'closing', 'score']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['date', 'opening', 'closing', 'score'];"></tr>
            </table>
          </div>
          <div class="empty-state" *ngIf="logs.length === 0">Aucun historique disponible.</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background-color: var(--background); }
    .dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .dashboard-title { margin: 0 0 4px 0; font-weight: 600; font-size: 26px; color: var(--on-background); font-family: 'Outfit', sans-serif; }
    .subtitle { color: var(--on-surface-variant); margin: 0; font-size: 14px; }
    
    .filter-form { display: flex; align-items: center; }
    .filter-select { min-width: 240px; margin-bottom: -16px; }

    .stats-row { display: flex; gap: 20px; margin-bottom: 24px; }
    .stat-card { flex: 1; max-width: 300px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid var(--outline-variant); }
    .stat-card.chart-card { flex: 2; max-width: none; }
    
    .stat-title { font-size: 13px; color: var(--on-surface-variant); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-value { font-size: 38px; font-weight: 700; margin-top: 12px; line-height: 1; }
    .stat-desc { font-size: 12px; color: var(--on-surface-variant); margin: 8px 0 0 0; opacity: 0.8; }
    
    .good { color: #1e8e3e; }
    .bad { color: #d93025; }
    
    .chart-title { font-size: 15px; font-weight: 600; color: var(--on-background); }
    .chart-container { position: relative; height: 210px; width: 100%; margin-top: 12px; }

    .table-card { border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid var(--outline-variant); }
    .table-header { padding: 20px 20px 12px 20px; }
    .table-responsive { width: 100%; overflow-x: auto; }
    .full-width-table { width: 100%; }
    
    th.mat-mdc-header-cell { font-weight: 600; color: var(--on-surface-variant); font-size: 12px; text-transform: uppercase; }
    td.mat-mdc-cell { font-size: 14px; }
    
    .score-badge { padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; display: inline-block; }
    .score-badge.good { background-color: rgba(30, 142, 62, 0.1); color: #1e8e3e; }
    .score-badge.bad { background-color: rgba(217, 48, 37, 0.1); color: #d93025; }
    
    .empty-state { padding: 36px; text-align: center; color: var(--on-surface-variant); font-size: 14px; }
    
    @media (max-width: 768px) {
       .dashboard-header { flex-direction: column; align-items: stretch; gap: 16px; }
       .filter-select { width: 100%; }
       .stats-row { flex-direction: column; gap: 16px; }
       .stat-card { max-width: none; }
    }
  `]
})
export class ControllerDashboardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dailyLogService = inject(DailyLogService);
  private coffeeService = inject(CoffeeService);
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);

  @ViewChild('yearlyChartCanvas') yearlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | undefined;

  form: FormGroup;
  coffees: Coffee[] = [];
  logs: (DailyTimeRecord & { score: number })[] = [];
  today = new Date();
  lastMonthScore = 0;

  constructor() {
    this.form = this.fb.group({
      coffee_id: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.coffeeService.getCoffees().subscribe(coffees => {
      this.coffees = coffees;
      const user = this.authService.currentUser();
      if (user && user.coffee_id) {
        this.form.patchValue({ coffee_id: user.coffee_id });
      } else if (coffees.length > 0) {
        this.form.patchValue({ coffee_id: coffees[0].id });
      }
      this.loadLogs();
    });

    this.form.get('coffee_id')?.valueChanges.subscribe(() => {
      this.loadLogs();
    });
  }

  ngOnDestroy() {
     if (this.chart) this.chart.destroy();
  }

  loadLogs() {
    this.dailyLogService.getLogs().subscribe(logs => {
      const myCoffeeId = this.form.get('coffee_id')?.value;
      const coffee = this.coffees.find(c => c.id === myCoffeeId);
      
      const enrichedLogs = logs.filter(l => l.coffee_id === myCoffeeId).map(log => {
         let score = 0;
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
            }

            // 2. Closing Score (Max 50 points)
            if (coffee.closing_time && log.closing_time) {
              const diffC = parseTimeToMinutes(coffee.closing_time) - parseTimeToMinutes(log.closing_time);
              cScore = diffC <= 0 ? 50 : 50 * (1 - Math.min(diffC / 30, 1));
            }

            score = Math.round(oScore + cScore);
         }
         return { ...log, score };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      this.logs = enrichedLogs;
      this.calculateScores();
    });
  }

  calculateScores() {
    const now = new Date();
    
    // Last month
    let lastMonth = now.getMonth() - 1;
    let yearOfLastMonth = now.getFullYear();
    if (lastMonth < 0) {
       lastMonth = 11;
       yearOfLastMonth--;
    }

    const lastMonthLogs = this.logs.filter(l => {
       const d = new Date(l.date);
       return d.getMonth() === lastMonth && d.getFullYear() === yearOfLastMonth;
    });

    if (lastMonthLogs.length > 0) {
       this.lastMonthScore = lastMonthLogs.reduce((acc, l) => acc + l.score, 0) / lastMonthLogs.length;
    } else {
       this.lastMonthScore = 0;
    }

    this.drawChart(now);
  }

  drawChart(now: Date) {
     if (!this.yearlyChartCanvas) return;
     if (this.chart) this.chart.destroy();

     const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
     const labels: string[] = [];
     const scores: number[] = [];

     // Last 12 months
     for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        labels.push(`${monthNames[m]} ${y}`);

        const monthLogs = this.logs.filter(l => {
           const ld = new Date(l.date);
           return ld.getMonth() === m && ld.getFullYear() === y;
        });

        if (monthLogs.length > 0) {
           scores.push(monthLogs.reduce((acc, l) => acc + l.score, 0) / monthLogs.length);
        } else {
           scores.push(0);
        }
     }

     const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
     const secondaryColor = this.themeService.getColor('--secondary') || '#5f6368';
     const errorColor = this.themeService.getColor('--error') || '#d93025';
     const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
     const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

     this.chart = new Chart(this.yearlyChartCanvas.nativeElement, {
        type: 'bar',
        data: {
           labels: labels,
           datasets: [{
              label: 'Score Moyen (%)',
              data: scores,
              backgroundColor: scores.map(s => s >= 80 ? primaryColor : (s >= 50 ? secondaryColor : errorColor)),
              borderRadius: 4
           }]
        },
        options: {
           responsive: true,
           maintainAspectRatio: false,
           scales: {
              y: { max: 100, min: 0, ticks: { color: textColor }, grid: { color: gridColor } },
              x: { ticks: { color: textColor }, grid: { display: false } }
           },
           plugins: { legend: { display: false } }
        }
     });
  }
}

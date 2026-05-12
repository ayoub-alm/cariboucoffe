import { Component, inject, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DailyLogService } from '../../../core/services/daily-log.service';
import { CoffeeService } from '../../../core/services/coffee.service';
import { AuthService } from '../../../core/services/auth.service';
import { Coffee } from '../../../core/models/coffee.model';
import { MatSnackBar } from '@angular/material/snack-bar';
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
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatTableModule
  ],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">Tableau de Bord Contrôleur</h1>
      <p class="subtitle">Enregistrer les horaires d'ouverture et de fermeture</p>

      <mat-card class="form-card">
        <mat-card-header>
          <mat-card-title>Saisir les horaires du jour</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="submit()" class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Café</mat-label>
              <mat-select formControlName="coffee_id">
                <mat-option *ngFor="let coffee of coffees" [value]="coffee.id">
                  {{ coffee.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Date d'aujourd'hui</mat-label>
              <input matInput [value]="today | date:'dd/MM/yyyy'" disabled>
            </mat-form-field>

            <div class="time-inputs-container">
               <div class="time-box" *ngIf="!todayLog?.opening_time">
                  <h3>Matin</h3>
                  <p class="box-desc">Saisissez l'heure à laquelle le café a été ouvert.</p>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Heure d'ouverture réelle</mat-label>
                    <input matInput type="time" formControlName="opening_time">
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="!form.value.opening_time">
                    Enregistrer l'ouverture
                  </button>
               </div>

               <div class="time-box" *ngIf="todayLog?.opening_time && !todayLog?.closing_time">
                  <h3>Soir</h3>
                  <p class="box-desc">Saisissez l'heure à laquelle le café a été fermé.</p>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Heure de fermeture réelle</mat-label>
                    <input matInput type="time" formControlName="closing_time">
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit" [disabled]="!form.value.closing_time">
                    Enregistrer la fermeture
                  </button>
               </div>
               
               <div class="time-box success-box" *ngIf="todayLog?.opening_time && todayLog?.closing_time">
                  <mat-icon class="success-icon">check_circle</mat-icon>
                  <h3>Horaires complétés</h3>
                  <p class="box-desc">Vous avez déjà enregistré l'ouverture ({{ todayLog?.opening_time }}) et la fermeture ({{ todayLog?.closing_time }}) pour aujourd'hui.</p>
               </div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <div class="stats-row">
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-title">Score du Mois Dernier</div>
            <div class="stat-value" [class.good]="lastMonthScore >= 80" [class.bad]="lastMonthScore < 80 && lastMonthScore > 0">
              {{ lastMonthScore | number:'1.0-0' }}%
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card" style="flex: 2; max-width: none;">
          <mat-card-header>
             <mat-card-title style="font-size: 16px;">Historique Annuel (Scores mensuels)</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="chart-container">
               <canvas #yearlyChartCanvas></canvas>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Historique des horaires</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="logs" class="full-width-table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef> Date </th>
              <td mat-cell *matCellDef="let log"> {{ log.date | date:'dd/MM/yyyy' }} </td>
            </ng-container>
            
            <ng-container matColumnDef="opening">
              <th mat-header-cell *matHeaderCellDef> Ouverture </th>
              <td mat-cell *matCellDef="let log"> {{ log.opening_time }} </td>
            </ng-container>

            <ng-container matColumnDef="closing">
              <th mat-header-cell *matHeaderCellDef> Fermeture </th>
              <td mat-cell *matCellDef="let log"> {{ log.closing_time }} </td>
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
          <div class="empty-state" *ngIf="logs.length === 0">Aucun historique disponible.</div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-container { padding: 24px; min-height: 100vh; background-color: var(--background); }
    .dashboard-title { margin-bottom: 4px; font-weight: 500; font-size: 24px; color: var(--on-background); }
    .subtitle { color: var(--on-surface-variant); margin-bottom: 24px; }
    .form-card { max-width: 600px; margin-top: 16px; border-radius: 12px; margin-bottom: 24px; }
    .form-grid { display: flex; flex-direction: column; gap: 16px; margin-top: 16px; }
    .stats-row { display: flex; gap: 16px; margin-bottom: 24px; }
    .stat-card { flex: 1; max-width: 292px; border-radius: 12px; }
    .stat-title { font-size: 14px; color: var(--on-surface-variant); font-weight: 500; }
    .stat-value { font-size: 32px; font-weight: 700; margin-top: 8px; }
    .good { color: #1e8e3e; }
    .bad { color: #d93025; }
    .table-card { border-radius: 12px; }
    .full-width-table { width: 100%; }
    .score-badge { padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 12px; }
    .score-badge.good { background-color: #e6f4ea; color: #1e8e3e; }
    .score-badge.bad { background-color: #fce8e6; color: #d93025; }
    .empty-state { padding: 24px; text-align: center; color: var(--on-surface-variant); }
    .chart-container { position: relative; height: 200px; width: 100%; margin-top: 8px; }
    .time-inputs-container { display: flex; gap: 16px; margin-bottom: 16px; }
    .time-box { flex: 1; padding: 16px; background: var(--surface-container); border-radius: 12px; }
    .time-box h3 { margin: 0 0 4px; font-size: 16px; color: var(--primary); }
    .box-desc { font-size: 13px; color: var(--on-surface-variant); margin-bottom: 12px; }
    .full-width { width: 100%; }
    .success-box { text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #e6f4ea; }
    .success-icon { color: #1e8e3e; font-size: 32px; height: 32px; width: 32px; margin-bottom: 8px; }
    
    @media (max-width: 600px) {
       .time-inputs-container { flex-direction: column; gap: 16px; }
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
  private snackBar = inject(MatSnackBar);
  private themeService = inject(ThemeService);

  @ViewChild('yearlyChartCanvas') yearlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | undefined;

  form: FormGroup;
  coffees: Coffee[] = [];
  logs: (DailyTimeRecord & { score: number })[] = [];
  todayLog: (DailyTimeRecord & { score: number }) | undefined;
  today = new Date();
  
  lastMonthScore = 0;

  constructor() {
    this.form = this.fb.group({
      coffee_id: ['', Validators.required],
      opening_time: [''],
      closing_time: ['']
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    this.coffeeService.getCoffees().subscribe(coffees => {
      if (user && user.coffee_id) {
        this.coffees = coffees.filter(c => c.id === user.coffee_id);
        this.form.patchValue({ coffee_id: user.coffee_id });
      } else {
        this.coffees = coffees;
      }
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
         if (coffee && coffee.opening_time && log.opening_time <= coffee.opening_time) score += 50;
         if (coffee && coffee.closing_time && log.closing_time >= coffee.closing_time) score += 50;
         return { ...log, score };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      this.logs = enrichedLogs;
      
      const dateStr = this.today.toISOString().split('T')[0];
      this.todayLog = this.logs.find(l => l.date === dateStr);
      
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

  submit() {
    if (this.form.valid && (this.form.value.opening_time || this.form.value.closing_time)) {
      const val = this.form.value;
      const dateStr = this.today.toISOString().split('T')[0];
      
      this.dailyLogService.createLog({
        coffee_id: val.coffee_id,
        date: dateStr,
        opening_time: val.opening_time || undefined,
        closing_time: val.closing_time || undefined
      } as any).subscribe(() => {
        this.snackBar.open('Horaires enregistrés avec succès', 'Fermer', { duration: 3000 });
        this.form.reset({ coffee_id: val.coffee_id, opening_time: '', closing_time: '' });
        this.loadLogs();
      }, err => {
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 3000 });
      });
    }
  }
}

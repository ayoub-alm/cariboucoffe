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

      <!-- SCHEDULES LOG REGISTER (Agenda View) -->
      <mat-card class="table-card">
        <mat-card-header class="table-header">
          <mat-card-title>Agenda des horaires (Logs)</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          
          <div class="agenda-cards">
            <div *ngFor="let log of logs" class="agenda-card">
              <div class="agenda-header">
                <span class="agenda-date">{{ log.date | date:'dd/MM/yyyy' }}</span>
                <span class="score-badge" [class.good]="log.score >= 100" [class.partial]="log.score >= 90 && log.score < 100" [class.bad]="log.score < 90">
                  {{ log.score }}%
                </span>
              </div>
              <div class="agenda-body">
                <div class="time-item">
                  <mat-icon>login</mat-icon>
                  <span>Ouverture: <strong>{{ log.opening_time || '--:--' }}</strong></span>
                </div>
                <div class="time-item">
                  <mat-icon>logout</mat-icon>
                  <span>Fermeture: <strong>{{ log.closing_time || '--:--' }}</strong></span>
                </div>
              </div>
            </div>
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

    .good { color: #1e8e3e; }
    .partial { color: #f57c00; }
    .bad { color: #d93025; }

    .table-card { border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); border: 1px solid var(--outline-variant); }
    .table-header { padding: 20px 20px 12px 20px; }
    
    .agenda-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
    .agenda-card { background: #fff; border: 1px solid var(--outline-variant); border-radius: 12px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s; }
    .agenda-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .agenda-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
    .agenda-date { font-weight: 600; font-size: 15px; color: var(--on-surface); }
    
    .agenda-body { display: flex; flex-direction: column; gap: 12px; }
    .time-item { display: flex; align-items: center; gap: 8px; color: var(--on-surface-variant); font-size: 14px; }
    .time-item mat-icon { font-size: 18px; width: 18px; height: 18px; opacity: 0.7; }
    .time-item strong { color: var(--on-surface); }
    
    .score-badge { padding: 6px 12px; border-radius: 20px; font-weight: 600; font-size: 12px; display: inline-block; }
    .score-badge.good { background-color: rgba(30, 142, 62, 0.1); color: #1e8e3e; }
    .score-badge.partial { background-color: rgba(245, 124, 0, 0.1); color: #f57c00; }
    .score-badge.bad { background-color: rgba(217, 48, 37, 0.1); color: #d93025; }
    
    .empty-state { padding: 36px; text-align: center; color: var(--on-surface-variant); font-size: 14px; }
    
    @media (max-width: 768px) {
       .dashboard-header { flex-direction: column; align-items: stretch; gap: 16px; }
       .filter-select { width: 100%; }
       .agenda-cards { grid-template-columns: 1fr; }
    }
  `]
})
export class ControllerDashboardComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dailyLogService = inject(DailyLogService);
  private coffeeService = inject(CoffeeService);
  private authService = inject(AuthService);
  form: FormGroup;
  coffees: Coffee[] = [];
  logs: (DailyTimeRecord & { score: number })[] = [];
  today = new Date();

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
  }

  loadLogs() {
    const myCoffeeId = this.form.get('coffee_id')?.value;
    if (!myCoffeeId) return;

    // getAllLogs passes coffee_id to the backend — no client-side filtering needed
    this.dailyLogService.getAllLogs({ coffee_id: myCoffeeId }).subscribe(logs => {
      // Backend already computes score; just sort desc by date
      this.logs = (logs as any[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
  }
}

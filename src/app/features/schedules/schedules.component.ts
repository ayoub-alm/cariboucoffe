import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Chart, registerables } from 'chart.js';
import { DailyLogService, DailyTimeRecord } from '../../core/services/daily-log.service';
import { CoffeeService } from '../../core/services/coffee.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Coffee } from '../../core/models/coffee.model';
import { User, UserRole } from '../../core/models/user.model';
import { ThemeService } from '../../core/services/theme.service';
import { ScheduleDialogComponent } from './schedule-dialog/schedule-dialog.component';

Chart.register(...registerables);

@Component({
  selector: 'app-schedules',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.css'
})
export class SchedulesComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private dailyLogService = inject(DailyLogService);
  private coffeeService = inject(CoffeeService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  themeService = inject(ThemeService);

  @ViewChild('trendChartCanvas') trendChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Roles & Permissions
  currentUser = this.authService.currentUser;
  isAdminOrBoss = computed(() => {
    const user = this.currentUser();
    return user ? [UserRole.ADMIN, UserRole.BOSS].includes(user.role) : false;
  });

  // State lists
  coffees: Coffee[] = [];
  users: User[] = [];
  userMap: { [id: number]: string } = {};

  // Filters Form
  filterForm: FormGroup;

  // Table Data Source
  dataSource = new MatTableDataSource<DailyTimeRecord & { coffeeName?: string, score?: number, controllerName?: string }>([]);
  displayedColumns: string[] = ['date', 'coffeeName', 'opening', 'closing', 'score', 'controllerName', 'actions'];

  // Stats Counters
  complianceRate = 0;
  monthlyComplianceRate = 0;
  weeklyComplianceRate = 0;
  totalLogsCount = 0;
  lateOpeningsCount = 0;
  earlyClosuresCount = 0;

  // Charts
  private chart: Chart | undefined;
  
  // Loading flags
  isLoading = false;

  constructor() {
    // Filters form
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    this.filterForm = this.fb.group({
      coffee_id: ['all'],
      start_date: [startOfMonth],
      end_date: [new Date()]
    });
  }

  ngOnInit() {
    this.isLoading = true;
    
    // Load Coffees
    this.coffeeService.getCoffees().subscribe({
      next: (coffees) => {
        this.coffees = coffees;
        
        // Setup initial controller coffee if not Admin/Boss
        const user = this.currentUser();
        if (user && user.role === UserRole.CONTROLLER && user.coffee_id) {
          this.filterForm.patchValue({ coffee_id: user.coffee_id });
        }
        
        this.loadLogs();
      },
      error: (err) => {
        console.error('Error loading coffees', err);
        this.isLoading = false;
      }
    });

    // Load Users
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        users.forEach(u => {
          this.userMap[u.id] = u.full_name || u.email;
        });
      },
      error: (err) => {
        console.warn('Could not load user list (using fallbacks).', err);
      }
    });
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  // Load daily logs based on filters
  loadLogs() {
    this.isLoading = true;
    const filters = this.filterForm.value;
    
    const queryParams: any = {
      limit: 1000
    };

    if (filters.coffee_id && filters.coffee_id !== 'all') {
      queryParams.coffee_id = Number(filters.coffee_id);
    }
    if (filters.start_date) {
      queryParams.start_date = this.formatDate(filters.start_date);
    }
    if (filters.end_date) {
      queryParams.end_date = this.formatDate(filters.end_date);
    }

    this.dailyLogService.getLogs(queryParams).subscribe({
      next: (logs) => {
        // Enriched logs with range-based calculations
        const enriched = logs.map(log => {
          const coffee = this.coffees.find(c => c.id === log.coffee_id);
          const coffeeName = coffee ? coffee.name : `Café #${log.coffee_id}`;
          
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
              // Perfect opening if diffO <= 0 (exactly on-time or early).
              // Otherwise, penalize linearly over a 30-minute range.
              oScore = diffO <= 0 ? 50 : 50 * (1 - Math.min(diffO / 30, 1));
            }

            // 2. Closing Score (Max 50 points)
            if (coffee.closing_time && log.closing_time) {
              const diffC = parseTimeToMinutes(coffee.closing_time) - parseTimeToMinutes(log.closing_time);
              // Perfect closing if diffC <= 0 (closed on time or stayed open longer).
              // Otherwise, penalize linearly over a 30-minute range.
              cScore = diffC <= 0 ? 50 : 50 * (1 - Math.min(diffC / 30, 1));
            }

            score = Math.round(oScore + cScore);
          } else {
            score = 100; // Fallback
          }
          
          const controllerName = this.userMap[log.controller_id] || (log.controller_id === this.currentUser()?.id ? 'Moi' : `Utilisateur #${log.controller_id}`);

          return {
            ...log,
            coffeeName,
            score,
            controllerName
          };
        });

        this.dataSource.data = enriched;
        
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.calculateStats(enriched);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading logs', err);
        this.snackBar.open('Erreur de chargement des horaires.', 'Fermer', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  // Calculate statistics
  calculateStats(records: any[]) {
    this.totalLogsCount = records.length;
    
    if (this.totalLogsCount === 0) {
      this.complianceRate = 0;
      this.monthlyComplianceRate = 0;
      this.weeklyComplianceRate = 0;
      this.lateOpeningsCount = 0;
      this.earlyClosuresCount = 0;
      this.drawChart([]);
      return;
    }

    const today = new Date();
    
    // Start of current ISO week (Monday)
    const currentWeekStart = new Date(today);
    const day = currentWeekStart.getDay();
    const diff = currentWeekStart.getDate() - day + (day === 0 ? -6 : 1);
    currentWeekStart.setDate(diff);
    currentWeekStart.setHours(0, 0, 0, 0);
    
    // Start of current calendar month
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0, 0);

    let totalScoreSum = 0;
    let lateOpenings = 0;
    let earlyClosures = 0;

    let monthScoreSum = 0;
    let monthLogsCount = 0;

    let weekScoreSum = 0;
    let weekLogsCount = 0;

    records.forEach(r => {
      totalScoreSum += r.score;
      const logDate = new Date(r.date);

      // Check current Month
      if (logDate >= currentMonthStart) {
        monthScoreSum += r.score;
        monthLogsCount++;
      }

      // Check current Week
      if (logDate >= currentWeekStart) {
        weekScoreSum += r.score;
        weekLogsCount++;
      }

      const coffee = this.coffees.find(c => c.id === r.coffee_id);
      if (coffee) {
        if (coffee.opening_time && r.opening_time && r.opening_time > coffee.opening_time) {
          lateOpenings++;
        }
        if (coffee.closing_time && r.closing_time && r.closing_time < coffee.closing_time) {
          earlyClosures++;
        }
      }
    });

    this.complianceRate = Math.round(totalScoreSum / this.totalLogsCount);
    this.monthlyComplianceRate = monthLogsCount > 0 ? Math.round(monthScoreSum / monthLogsCount) : 0;
    this.weeklyComplianceRate = weekLogsCount > 0 ? Math.round(weekScoreSum / weekLogsCount) : 0;
    this.lateOpeningsCount = lateOpenings;
    this.earlyClosuresCount = earlyClosures;

    this.drawChart(records);
  }

  // Draw trend chart
  drawChart(records: any[]) {
    setTimeout(() => {
      if (!this.trendChartCanvas) return;
      if (this.chart) this.chart.destroy();

      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const dataMap: { [key: string]: { sum: number, count: number } } = {};

      // Fill in data points
      records.forEach(r => {
        const d = new Date(r.date);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (!dataMap[label]) {
          dataMap[label] = { sum: 0, count: 0 };
        }
        dataMap[label].sum += r.score;
        dataMap[label].count += 1;
      });

      // Sort chronological labels
      const labels = Object.keys(dataMap).sort((a, b) => {
        const partsA = a.split(' ');
        const partsB = b.split(' ');
        const monthA = monthNames.indexOf(partsA[0]);
        const monthB = monthNames.indexOf(partsB[0]);
        const yearA = parseInt(partsA[1]);
        const yearB = parseInt(partsB[1]);
        if (yearA !== yearB) return yearA - yearB;
        return monthA - monthB;
      });

      const scores = labels.map(lbl => Math.round(dataMap[lbl].sum / dataMap[lbl].count));

      const primaryColor = this.themeService.getColor('--primary') || '#1a73e8';
      const secondaryColor = this.themeService.getColor('--secondary') || '#5f6368';
      const errorColor = this.themeService.getColor('--error') || '#d93025';
      const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
      const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

      this.chart = new Chart(this.trendChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: labels.length > 0 ? labels : ['Aucune donnée'],
          datasets: [{
            label: 'Score de Conformité (%)',
            data: scores.length > 0 ? scores : [0],
            borderColor: primaryColor,
            backgroundColor: 'rgba(26, 115, 232, 0.1)',
            fill: true,
            tension: 0.3,
            borderWidth: 3,
            pointBackgroundColor: primaryColor,
            pointRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { max: 100, min: 0, ticks: { color: textColor }, grid: { color: gridColor } },
            x: { ticks: { color: textColor }, grid: { display: false } }
          },
          plugins: {
            legend: { display: false }
          }
        }
      });
    }, 100);
  }

  // Open Reusable dialog modal for Creating or Updating schedules
  openScheduleDialog(log: DailyTimeRecord | null = null) {
    const dialogRef = this.dialog.open(ScheduleDialogComponent, {
      width: '600px',
      data: {
        log: log,
        coffees: this.coffees
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.dailyLogService.createLog(result).subscribe({
          next: () => {
            this.snackBar.open(
              log ? '📝 Horaires mis à jour avec succès !' : '🆕 Nouveaux horaires enregistrés !',
              'Fermer',
              { duration: 3000 }
            );
            this.loadLogs();
          },
          error: (err) => {
            console.error('Error saving schedule via modal', err);
            this.snackBar.open('Erreur lors de la sauvegarde des horaires.', 'Fermer', { duration: 3000 });
            this.isLoading = false;
          }
        });
      }
    });
  }

  // Reset Filters
  resetFilters() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    
    this.filterForm.patchValue({
      coffee_id: 'all',
      start_date: startOfMonth,
      end_date: new Date()
    });

    this.loadLogs();
  }

  // Helper date formatter: YYYY-MM-DD
  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();

    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}

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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
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
import { ConfigService, ScheduleThreshold } from '../../core/services/config.service';
import { ScheduleDialogComponent } from './schedule-dialog/schedule-dialog.component';
import { ThresholdConfigDialogComponent } from './threshold-config-dialog/threshold-config-dialog.component';

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
    MatDialogModule,
    MatButtonToggleModule
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
  private configService = inject(ConfigService);
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
  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);

  // Schedule thresholds (loaded from backend – used for color coding)
  thresholds: ScheduleThreshold | null = null;
  get conformeMin(): number { return this.thresholds?.green_min ?? 100; }
  get partielMin(): number { return this.thresholds?.orange_min ?? 90; }

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

  // Calendar State
  viewMode: 'list' | 'calendar' = 'list';
  currentMonth = new Date();
  calendarDays: { date: Date, isCurrentMonth: boolean, logs: any[] }[] = [];
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

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

    // Load schedule thresholds
    this.configService.getScheduleThresholds().subscribe({
      next: (t) => { this.thresholds = t; },
      error: () => { /* use defaults */ }
    });

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
        // Backend now returns score and status — just enrich with names
        const enriched = logs.map(log => {
          const coffee = this.coffees.find(c => c.id === log.coffee_id);
          const coffeeName = coffee ? coffee.name : `Café #${log.coffee_id}`;
          const controllerName = this.userMap[log.controller_id] || (log.controller_id === this.currentUser()?.id ? 'Moi' : `Utilisateur #${log.controller_id}`);
          return { ...log, coffeeName, controllerName };
        });

        this.dataSource.data = enriched;
        
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
        });

        this.calculateStats(enriched);
        
        if (this.viewMode === 'calendar') {
           this.generateCalendar();
        }
        
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
      const warningColor = '#f57c00';
      const errorColor = this.themeService.getColor('--error') || '#d93025';
      const textColor = this.themeService.getColor('--on-surface-variant') || '#5f6368';
      const gridColor = this.themeService.getColor('--outline-variant') || '#e8eaed';

      this.chart = new Chart(this.trendChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: labels.length > 0 ? labels : ['Aucune donnée'],
          datasets: [{
            label: 'Score de Conformité (%)',
            data: scores.length > 0 ? scores : [0],
            backgroundColor: scores.length > 0 
                ? scores.map(s => s >= this.conformeMin ? primaryColor : (s >= this.partielMin ? warningColor : errorColor)) 
                : [primaryColor],
            borderRadius: 4,
            barThickness: 40
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

  // Open Threshold Config Modal (Admin only)
  openThresholdConfig() {
    const ref = this.dialog.open(ThresholdConfigDialogComponent, {
      width: '600px',
      data: { current: this.thresholds }
    });
    ref.afterClosed().subscribe((updated: ScheduleThreshold | undefined) => {
      if (updated) {
        this.thresholds = updated;
        // Reload logs so backend recomputes scores with new thresholds
        this.loadLogs();
      }
    });
  }

  // Open Reusable dialog modal for Creating or Updating schedules
  openScheduleDialog(log: DailyTimeRecord | null = null, defaultDate: Date | null = null) {
    const filters = this.filterForm.value;
    const defaultCoffeeId = (filters && filters.coffee_id && filters.coffee_id !== 'all') ? Number(filters.coffee_id) : null;

    const dialogRef = this.dialog.open(ScheduleDialogComponent, {
      width: '600px',
      data: {
        log: log,
        coffees: this.coffees,
        defaultDate: defaultDate,
        defaultCoffeeId: defaultCoffeeId
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

  // Delete a daily log (Admin only)
  deleteLog(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cet horaire ?')) {
      this.isLoading = true;
      this.dailyLogService.deleteLog(id).subscribe({
        next: () => {
          this.snackBar.open('🗑️ Horaire supprimé avec succès !', 'Fermer', { duration: 3000 });
          this.loadLogs();
        },
        error: (err) => {
          console.error('Error deleting daily log', err);
          this.snackBar.open('Erreur lors de la suppression de l\'horaire.', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
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

  // Calendar logic
  toggleView(mode: 'list' | 'calendar') {
     this.viewMode = mode;
     if (mode === 'calendar') {
        this.generateCalendar();
     }
  }

  generateCalendar() {
     const year = this.currentMonth.getFullYear();
     const month = this.currentMonth.getMonth();
     const firstDay = new Date(year, month, 1);
     const lastDay = new Date(year, month + 1, 0);

     const daysInMonth = lastDay.getDate();
     const startDayOfWeek = firstDay.getDay();

     this.calendarDays = [];

     for (let i = 0; i < startDayOfWeek; i++) {
        const d = new Date(year, month, 1 - (startDayOfWeek - i));
        this.calendarDays.push({ date: d, isCurrentMonth: false, logs: this.getLogsForDate(d) });
     }

     for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i);
        this.calendarDays.push({ date, isCurrentMonth: true, logs: this.getLogsForDate(date) });
     }

     const remaining = 7 - (this.calendarDays.length % 7);
     if (remaining < 7) {
        for (let i = 1; i <= remaining; i++) {
           const d = new Date(year, month + 1, i);
           this.calendarDays.push({ date: d, isCurrentMonth: false, logs: this.getLogsForDate(d) });
        }
     }
  }

  getLogsForDate(date: Date): any[] {
     return this.dataSource.data.filter(log => {
        const d = new Date(log.date);
        return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear();
     });
  }

  prevMonth() {
     this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
     this.generateCalendar();
  }

  nextMonth() {
     this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
     this.generateCalendar();
  }
}

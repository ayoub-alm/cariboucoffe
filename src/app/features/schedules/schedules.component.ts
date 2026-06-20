import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTabsModule } from '@angular/material/tabs';
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

type EnrichedLog = DailyTimeRecord & { coffeeName?: string; controllerName?: string };

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
    MatButtonToggleModule,
    MatMenuModule,
    MatTabsModule
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
  @ViewChild('weeklyCoffeeChartCanvas') weeklyCoffeeChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cafeComplianceChartCanvas') cafeComplianceChartCanvas!: ElementRef<HTMLCanvasElement>;
  /** Sort wired to client-side sorting within the current page */
  @ViewChild(MatSort) set sort(s: MatSort) { this.dataSource.sort = s; }

  // ── Roles & Permissions ────────────────────────────────────────────────
  currentUser = this.authService.currentUser;
  isAdminOrBoss = computed(() => {
    const user = this.currentUser();
    return user ? [UserRole.ADMIN, UserRole.BOSS, UserRole.MANAGER].includes(user.role) : false;
  });
  isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);
  canExport = computed(() => {
    const role = this.currentUser()?.role;
    return role === UserRole.ADMIN || role === UserRole.BOSS;
  });
  canAddOrEdit = computed(() => {
    const role = this.currentUser()?.role;
    return role ? [UserRole.ADMIN, UserRole.CONTROLLER].includes(role) : false;
  });

  // ── Thresholds (max tolerable lost minutes) ─────────────────────────────
  thresholds: ScheduleThreshold | null = null;
  get greenMaxLoss(): number { return this.thresholds?.green_min  ?? 0; }
  get orangeMaxLoss(): number { return this.thresholds?.orange_min ?? 60; }

  isGreenStatus(log: DailyTimeRecord): boolean {
    return log.status === 'green';
  }
  isOrangeStatus(log: DailyTimeRecord): boolean {
    return log.status === 'orange';
  }
  isRedStatus(log: DailyTimeRecord): boolean {
    return log.status === 'red';
  }
  worstViolation(log: DailyTimeRecord): number {
    return Math.max(log.late_minutes ?? 0, log.early_minutes ?? 0);
  }
  lostStatusClass(lost: number): 'success' | 'warning' | 'error' {
    if (lost <= this.greenMaxLoss) return 'success';
    if (lost <= this.orangeMaxLoss) return 'warning';
    return 'error';
  }
  getConformityLabel(log: DailyTimeRecord): string {
    return log.conformity_label || this.configService.getScheduleConformityLabel(log.status);
  }
  getConformityTooltip(log: DailyTimeRecord): string {
    const expected = this.getExpectedTimes(log.coffee_id);
    const issues: string[] = [];
    if (log.is_late_opening) {
      issues.push(`Ouverture en retard de ${Math.round(log.late_minutes ?? 0)} min (prévu ${expected.opening})`);
    }
    if (log.is_early_closing) {
      issues.push(`Fermeture anticipée de ${Math.round(log.early_minutes ?? 0)} min (prévu ${expected.closing})`);
    }
    if (issues.length === 0) {
      return `Conforme — ouverture et fermeture respectées (${expected.opening} - ${expected.closing})`;
    }
    return issues.join(' · ');
  }
  getExpectedTimes(coffeeId: number): { opening: string; closing: string } {
    const coffee = this.coffees.find(c => c.id === coffeeId);
    return {
      opening: coffee?.opening_time || '--:--',
      closing: coffee?.closing_time || '--:--',
    };
  }

  // ── State lists ─────────────────────────────────────────────────────────
  coffees: Coffee[] = [];
  users: User[] = [];
  userMap: { [id: number]: string } = {};

  // ── Filters form ─────────────────────────────────────────────────────────
  filterForm: FormGroup;

  // ── Table data source ────────────────────────────────────────────────────
  dataSource = new MatTableDataSource<EnrichedLog>([]);
  displayedColumns: string[] = ['date', 'coffeeName', 'opening', 'closing', 'score', 'controllerName', 'actions'];

  // ── Server-side pagination ───────────────────────────────────────────────
  totalItems = 0;
  pageSize   = 25;
  pageIndex  = 0;
  pageSizeOptions = [10, 25, 50, 100];

  // ── KPI stats (from server) ──────────────────────────────────────────────
  averageCompliantMinutes = 0;
  averageLostMinutes      = 0;
  monthlyLostAverage      = 0;
  weeklyLostAverage       = 0;
  totalLogsCount        = 0;
  lateOpeningsCount     = 0;
  earlyClosuresCount    = 0;

  // ── New Data-Engineered KPIs ─────────────────────────────────────────────
  allFilteredLogs: EnrichedLog[] = [];
  perfectDaysRate        = 0;
  activeCafesCount       = 0;
  greenDaysCount         = 0;
  orangeDaysCount        = 0;
  redDaysCount           = 0;
  lateOpeningsRate       = 0;
  earlyClosuresRate      = 0;
  bestCoffeeSchedules    = { name: 'N/A', score: 0 };
  worstCoffeeSchedules   = { name: 'N/A', score: 0 };

  // ── Calendar ────────────────────────────────────────────────────────────
  viewMode: 'list' | 'calendar' = 'list';
  currentMonth = new Date();
  weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  calendarDays: { date: Date; isCurrentMonth: boolean; logs: EnrichedLog[] }[] = [];
  private calendarAllLogs: EnrichedLog[] = [];

  // ── Charts ───────────────────────────────────────────────────────────────
  private chart: Chart | undefined;
  private weeklyChart: Chart | undefined;
  private cafeComplianceChart: Chart | undefined;

  // ── Loading flag ─────────────────────────────────────────────────────────
  isLoading = false;

  constructor() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    this.filterForm = this.fb.group({
      coffee_id:  ['all'],
      start_date: [startOfMonth],
      end_date:   [new Date()]
    });
  }

  ngOnInit() {
    this.isLoading = true;

    if (!this.canAddOrEdit() && !this.isAdmin()) {
      this.displayedColumns = ['date', 'coffeeName', 'opening', 'closing', 'score', 'controllerName'];
    }

    this.configService.getScheduleThresholds().subscribe({
      next:  (t) => { this.thresholds = t; },
      error: ()  => { /* use defaults */ }
    });

    this.coffeeService.getCoffees().subscribe({
      next: (coffees) => {
        this.coffees = coffees;
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

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        users.forEach(u => { this.userMap[u.id] = u.full_name || u.email; });
      },
      error: (err) => console.warn('Could not load user list.', err)
    });
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
    if (this.weeklyChart) this.weeklyChart.destroy();
    if (this.cafeComplianceChart) this.cafeComplianceChart.destroy();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  /** Load one page of logs from the server. */
  loadLogs(resetPage = false) {
    this.isLoading = true;
    if (resetPage) this.pageIndex = 0;

    const filters = this.filterForm.value;
    const queryParams: { coffee_id?: number; start_date?: string; end_date?: string } = {};

    if (filters.coffee_id && filters.coffee_id !== 'all') {
      queryParams.coffee_id = Number(filters.coffee_id);
    }
    if (filters.start_date) queryParams.start_date = this.formatDate(filters.start_date);
    if (filters.end_date)   queryParams.end_date   = this.formatDate(filters.end_date);

    this.dailyLogService.getLogs(queryParams, this.pageIndex + 1, this.pageSize).subscribe({
      next: (response) => {
        // Enrich current page items with human-readable names
        this.dataSource.data = response.items.map(log => this.enrichLog(log));

        // Server-side pagination totals
        this.totalItems = response.total;

        // KPI stats (computed by backend over ALL filtered records)
        this.totalLogsCount         = response.total;
        this.averageCompliantMinutes = Math.round(response.average_score);
        this.averageLostMinutes     = Math.round(response.average_lost_minutes ?? 0);
        this.lateOpeningsCount      = response.late_openings;
        this.earlyClosuresCount     = response.early_closures;
        this.monthlyLostAverage     = Math.round(response.monthly_average);
        this.weeklyLostAverage      = Math.round(response.weekly_average);

        // Fetch all matching logs (unpaginated) to draw correct trends/averages across all records
        this.dailyLogService.getAllLogs(queryParams).subscribe({
          next: (allLogs) => {
            this.allFilteredLogs = allLogs.map(log => this.enrichLog(log));
            this.computeAdditionalKPIs(this.allFilteredLogs);
            this.drawChart(this.allFilteredLogs);
          },
          error: (err) => {
            console.error('Error loading all logs for charts', err);
            this.allFilteredLogs = this.dataSource.data;
            this.computeAdditionalKPIs(this.allFilteredLogs);
            this.drawChart(this.allFilteredLogs);
          }
        });

        if (this.viewMode === 'calendar') {
          this.loadCalendarLogs();
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

  onTabChange(event: any) {
    if (event.index === 1) {
      this.drawChart(this.allFilteredLogs);
    }
  }

  exportExcel() {
    if (!this.canExport()) return;

    const filters = this.filterForm.value;
    const queryParams: { coffee_id?: number; start_date?: string; end_date?: string } = {};

    if (filters.coffee_id && filters.coffee_id !== 'all') {
      queryParams.coffee_id = Number(filters.coffee_id);
    }
    if (filters.start_date) queryParams.start_date = this.formatDate(filters.start_date);
    if (filters.end_date)   queryParams.end_date   = this.formatDate(filters.end_date);

    this.dailyLogService.exportExcel(queryParams).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `export_horaires_${dateStr}.xls`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error exporting schedules to Excel', err)
    });
  }

  computeAdditionalKPIs(records: EnrichedLog[]) {
    const total = records.length;
    
    // 1. Ponctualité Parfaite (%)
    const perfectCount = records.filter(r => r.status === 'green').length;
    this.perfectDaysRate = total > 0 ? Math.round((perfectCount / total) * 100) : 0;
    
    // 2. Établissements Actifs
    this.activeCafesCount = new Set(records.map(r => r.coffee_id)).size;
    
    // 3. Status distribution
    this.greenDaysCount = records.filter(r => this.isGreenStatus(r)).length;
    this.orangeDaysCount = records.filter(r => this.isOrangeStatus(r)).length;
    this.redDaysCount = records.filter(r => this.isRedStatus(r)).length;
    
    // 4. Late Openings & Early Closures rates
    this.lateOpeningsRate = total > 0 ? Math.round((this.lateOpeningsCount / total) * 100) : 0;
    this.earlyClosuresRate = total > 0 ? Math.round((this.earlyClosuresCount / total) * 100) : 0;

    // 5. Best & Worst Coffee Schedules
    const cafeScores: { [name: string]: { sum: number; count: number } } = {};
    records.forEach(r => {
      const name = r.coffeeName || `Café #${r.coffee_id}`;
      if (!cafeScores[name]) cafeScores[name] = { sum: 0, count: 0 };
      cafeScores[name].sum += r.score;
      cafeScores[name].count += 1;
    });

    let bestName = 'N/A';
    let bestVal = -1;
    let worstName = 'N/A';
    let worstVal = Number.MAX_SAFE_INTEGER;

    Object.entries(cafeScores).forEach(([name, stats]) => {
      const avg = stats.count > 0 ? stats.sum / stats.count : 0;
      if (avg > bestVal) {
        bestVal = avg;
        bestName = name;
      }
      if (avg < worstVal) {
        worstVal = avg;
        worstName = name;
      }
    });

    this.bestCoffeeSchedules = {
      name: bestName,
      score: bestVal !== -1 ? Math.round(bestVal) : 0
    };
    this.worstCoffeeSchedules = {
      name: worstName,
      score: worstVal !== Number.MAX_SAFE_INTEGER ? Math.round(worstVal) : 0
    };
  }

  formatScore(log: DailyTimeRecord): string {
    return this.getConformityLabel(log);
  }

  /** Load ALL logs for the calendar month (ignores table pagination). */
  loadCalendarLogs() {
    const year  = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0);

    const filters = this.filterForm.value;
    const queryParams: { coffee_id?: number; start_date: string; end_date: string } = {
      start_date: this.formatDate(start),
      end_date:   this.formatDate(end),
    };
    if (filters.coffee_id && filters.coffee_id !== 'all') {
      queryParams.coffee_id = Number(filters.coffee_id);
    }

    this.dailyLogService.getAllLogs(queryParams).subscribe({
      next: (logs) => {
        this.calendarAllLogs = logs.map(log => this.enrichLog(log));
        this.generateCalendar();
      },
      error: (err) => console.error('Error loading calendar logs', err)
    });
  }

  private enrichLog(log: DailyTimeRecord): EnrichedLog {
    const coffee = this.coffees.find(c => c.id === log.coffee_id);
    const coffeeName     = coffee ? coffee.name : `Café #${log.coffee_id}`;
    const controllerName = this.userMap[log.controller_id]
      || (log.controller_id === this.currentUser()?.id ? 'Moi' : `Utilisateur #${log.controller_id}`);
    return { ...log, coffeeName, controllerName };
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.loadLogs();
  }

  // ── Filter helpers ────────────────────────────────────────────────────────

  resetFilters() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    this.filterForm.patchValue({ coffee_id: 'all', start_date: startOfMonth, end_date: new Date() });
    this.loadLogs(true);
  }

  // ── Chart ─────────────────────────────────────────────────────────────────

  drawChart(records: EnrichedLog[]) {
    setTimeout(() => {
      if (!this.trendChartCanvas) return;
      if (this.chart) this.chart.destroy();

      // ── 1. MONTHLY CHART (BAR) ──
      const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const monthlyMap: { [key: string]: { sum: number; count: number } } = {};

      records.forEach(r => {
        const d     = new Date(r.date);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
        if (!monthlyMap[label]) monthlyMap[label] = { sum: 0, count: 0 };
        monthlyMap[label].sum   += this.worstViolation(r);
        monthlyMap[label].count += 1;
      });

      const monthlyLabels = Object.keys(monthlyMap).sort((a, b) => {
        const [mA, yA] = [monthNames.indexOf(a.split(' ')[0]), parseInt(a.split(' ')[1])];
        const [mB, yB] = [monthNames.indexOf(b.split(' ')[0]), parseInt(b.split(' ')[1])];
        return yA !== yB ? yA - yB : mA - mB;
      });
      const monthlyLostAverages = monthlyLabels.map(lbl => Math.round(monthlyMap[lbl].sum / monthlyMap[lbl].count));
      const monthlyMax = Math.max(...monthlyLostAverages, this.orangeMaxLoss + 10, 10);

      const primaryColor = this.themeService.getColor('--primary')  || '#1a73e8';
      const warningColor = '#f57c00';
      const errorColor   = this.themeService.getColor('--error')     || '#d93025';
      const textColor    = this.themeService.getColor('--on-surface-variant') || '#5f6368';
      const gridColor    = this.themeService.getColor('--outline-variant')    || '#e8eaed';

      this.chart = new Chart(this.trendChartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: monthlyLabels.length > 0 ? monthlyLabels : ['Aucune donnée'],
          datasets: [{
            label: 'Perte moyenne (min)',
            data: monthlyLostAverages.length > 0 ? monthlyLostAverages : [0],
            backgroundColor: monthlyLostAverages.length > 0
              ? monthlyLostAverages.map(lost => lost <= this.greenMaxLoss ? primaryColor : (lost <= this.orangeMaxLoss ? warningColor : errorColor))
              : [primaryColor],
            borderRadius: 4,
            barThickness: 32
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { max: monthlyMax, min: 0, ticks: { color: textColor }, grid: { color: gridColor } },
            x: { ticks: { color: textColor }, grid: { display: false } }
          },
          plugins: { legend: { display: false } }
        }
      });

      // ── 2. WEEKLY CHART PER COFFEE (LINE) ──
      if (!this.weeklyCoffeeChartCanvas) return;
      if (this.weeklyChart) this.weeklyChart.destroy();

      const weeklyMap: { [week: string]: { [coffee: string]: { sum: number; count: number } } } = {};
      const uniqueCoffees = new Set<string>();

      records.forEach(r => {
        const d = new Date(r.date);
        
        // Calculate ISO Week Number
        const target = new Date(d.valueOf());
        const dayNr = (d.getDay() + 6) % 7;
        target.setDate(target.getDate() - dayNr + 3);
        const firstThursday = target.valueOf();
        target.setMonth(0, 1);
        if (target.getDay() !== 4) {
          target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
        }
        const weekNo = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
        const weekLabel = `Semaine ${weekNo}`;
        const coffeeName = r.coffeeName || `Café #${r.coffee_id}`;

        uniqueCoffees.add(coffeeName);

        if (!weeklyMap[weekLabel]) weeklyMap[weekLabel] = {};
        if (!weeklyMap[weekLabel][coffeeName]) weeklyMap[weekLabel][coffeeName] = { sum: 0, count: 0 };

        weeklyMap[weekLabel][coffeeName].sum += this.worstViolation(r);
        weeklyMap[weekLabel][coffeeName].count += 1;
      });

      const weeklyLabels = Object.keys(weeklyMap).sort((a, b) => {
        const weekA = parseInt(a.replace('Semaine ', ''));
        const weekB = parseInt(b.replace('Semaine ', ''));
        return weekA - weekB;
      });

      const weeklyMaxValues: number[] = [];

      const colorPalette = [
        '#1a73e8', // Blue
        '#ab47bc', // Purple
        '#00acc1', // Cyan
        '#ff7043', // Coral
        '#43a047', // Green
        '#fdd835', // Yellow
        '#ec407a', // Pink
        '#8d6e63'  // Brown
      ];

      const weeklyDatasets = Array.from(uniqueCoffees).map((coffeeName, idx) => {
        const data = weeklyLabels.map(week => {
          const stats = weeklyMap[week][coffeeName];
          if (!stats) return null;
          const avg = Math.round(stats.sum / stats.count);
          weeklyMaxValues.push(avg);
          return avg;
        });
        const color = colorPalette[idx % colorPalette.length];
        return {
          label: coffeeName,
          data: data,
          borderColor: color,
          backgroundColor: color,
          tension: 0.3,
          fill: false,
          spanGaps: true,
          pointRadius: 4,
          pointHoverRadius: 6
        };
      });

      const weeklyMax = Math.max(...weeklyMaxValues, this.orangeMaxLoss + 10, 10);

      this.weeklyChart = new Chart(this.weeklyCoffeeChartCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: weeklyLabels.length > 0 ? weeklyLabels : ['Aucune donnée'],
          datasets: weeklyDatasets.length > 0 ? weeklyDatasets : [{
            label: 'Aucun établissement',
            data: [0],
            borderColor: primaryColor,
            tension: 0.3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { max: weeklyMax, min: 0, ticks: { color: textColor }, grid: { color: gridColor } },
            x: { ticks: { color: textColor }, grid: { display: false } }
          },
          plugins: {
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: textColor,
                boxWidth: 10,
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 11, family: 'sans-serif' }
              }
            }
          }
        }
      });

      // ── 3. CAFE SCORE CHART (BAR) ──
      if (this.cafeComplianceChartCanvas) {
        if (this.cafeComplianceChart) this.cafeComplianceChart.destroy();

        const coffeeScoreMap: { [coffeeName: string]: { total: number; sum: number } } = {};
        
        records.forEach(r => {
          const coffeeName = r.coffeeName || `Café #${r.coffee_id}`;
          if (!coffeeScoreMap[coffeeName]) {
            coffeeScoreMap[coffeeName] = { total: 0, sum: 0 };
          }
          coffeeScoreMap[coffeeName].total += 1;
          coffeeScoreMap[coffeeName].sum += this.worstViolation(r);
        });

        const coffeeLabels = Object.keys(coffeeScoreMap).sort();
        const averageLostByCoffee = coffeeLabels.map(name => {
          const stats = coffeeScoreMap[name];
          return stats.total > 0 ? Math.round(stats.sum / stats.total) : 0;
        });
        const cafeChartMax = Math.max(...averageLostByCoffee, this.orangeMaxLoss + 10, 10);

        this.cafeComplianceChart = new Chart(this.cafeComplianceChartCanvas.nativeElement, {
          type: 'bar',
          data: {
            labels: coffeeLabels.length > 0 ? coffeeLabels.map(s => s.replace('Caribou ', '')) : ['Aucune donnée'],
            datasets: [{
              label: 'Perte moyenne (min)',
              data: averageLostByCoffee.length > 0 ? averageLostByCoffee : [0],
              backgroundColor: averageLostByCoffee.length > 0
                ? averageLostByCoffee.map(lost => lost <= this.greenMaxLoss ? primaryColor : (lost <= this.orangeMaxLoss ? warningColor : errorColor))
                : [primaryColor],
              borderRadius: 4,
              barThickness: 32
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { max: cafeChartMax, min: 0, ticks: { color: textColor }, grid: { color: gridColor } },
              x: { ticks: { color: textColor }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
          }
        });
      }
    }, 100);
  }

  // ── Dialogs ───────────────────────────────────────────────────────────────

  openThresholdConfig() {
    const ref = this.dialog.open(ThresholdConfigDialogComponent, {
      width: '600px',
      data: { current: this.thresholds }
    });
    ref.afterClosed().subscribe((updated: ScheduleThreshold | undefined) => {
      if (updated) {
        this.thresholds = updated;
        this.loadLogs(true);
      }
    });
  }

  openScheduleDialog(log: DailyTimeRecord | null = null, defaultDate: Date | null = null) {
    if (!this.canAddOrEdit() && !this.isAdmin()) return;
    const filters = this.filterForm.value;
    const defaultCoffeeId = (filters?.coffee_id && filters.coffee_id !== 'all') ? Number(filters.coffee_id) : null;

    const dialogRef = this.dialog.open(ScheduleDialogComponent, {
      width: '600px',
      data: { log, coffees: this.coffees, defaultDate, defaultCoffeeId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.isLoading = true;
        this.dailyLogService.createLog(result).subscribe({
          next: () => {
            this.snackBar.open(
              log ? '📝 Horaires mis à jour avec succès !' : '🆕 Nouveaux horaires enregistrés !',
              'Fermer', { duration: 3000 }
            );
            this.loadLogs();
            if (this.viewMode === 'calendar') this.loadCalendarLogs();
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

  deleteLog(id: number) {
    if (confirm('Voulez-vous vraiment supprimer cet horaire ?')) {
      this.isLoading = true;
      this.dailyLogService.deleteLog(id).subscribe({
        next: () => {
          this.snackBar.open('🗑️ Horaire supprimé avec succès !', 'Fermer', { duration: 3000 });
          this.loadLogs();
          if (this.viewMode === 'calendar') this.loadCalendarLogs();
        },
        error: (err) => {
          console.error('Error deleting daily log', err);
          this.snackBar.open('Erreur lors de la suppression.', 'Fermer', { duration: 3000 });
          this.isLoading = false;
        }
      });
    }
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  toggleView(mode: 'list' | 'calendar') {
    this.viewMode = mode;
    if (mode === 'calendar') {
      this.loadCalendarLogs();
    }
  }

  generateCalendar() {
    const year  = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay    = new Date(year, month, 1);
    const lastDay     = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay    = firstDay.getDay();

    this.calendarDays = [];

    for (let i = 0; i < startDay; i++) {
      const d = new Date(year, month, 1 - (startDay - i));
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

  getLogsForDate(date: Date): EnrichedLog[] {
    return this.calendarAllLogs.filter(log => {
      const d = new Date(log.date);
      return d.getDate()     === date.getDate()     &&
             d.getMonth()    === date.getMonth()    &&
             d.getFullYear() === date.getFullYear();
    });
  }

  prevMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.loadCalendarLogs();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.loadCalendarLogs();
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  formatDate(date: any): string {
    if (!date) return '';
    const d     = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day   = '' + d.getDate();
    return [d.getFullYear(), month.padStart(2, '0'), day.padStart(2, '0')].join('-');
  }
}

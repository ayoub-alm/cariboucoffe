import { Component, ViewChild, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { AuditService } from '../../../core/services/audit.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfigService } from '../../../core/services/config.service';
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { canCreateAudits, isAdmin, UserRole } from '../../../core/models/user.model';
import { Router, RouterModule } from '@angular/router';
import { AuditDialogComponent } from '../audit-dialog/audit-dialog.component';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { FilterBarComponent } from '../../../shared/components/filter-bar/filter-bar.component';

@Component({
    selector: 'app-audit-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule, MatPaginatorModule, MatSortModule,
        MatInputModule, MatFormFieldModule, MatButtonModule,
        MatIconModule, MatChipsModule, MatTooltipModule,
        MatDialogModule, MatCheckboxModule, MatMenuModule,
        MatButtonToggleModule,
        DatePipe, NgClass, RouterModule, FilterBarComponent
    ],
    templateUrl: './audit-list.component.html',
    styleUrls: ['./audit-list.component.css']
})
export class AuditListComponent {
    get displayedColumns(): string[] {
        const cols = ['coffeeShop', 'date', 'score', 'status', 'actions'];
        if (this.canSeeAuditor()) {
            cols.splice(1, 0, 'auditor');
        }
        if (this.canDeleteAudit()) {
            cols.unshift('select');
        }
        return cols;
    }
    dataSource: MatTableDataSource<Audit>;
    selection = new SelectionModel<Audit>(true, []);

    showFilter = false;
    currentFilters: any = {};

    // ── Server-side pagination state ───────────────────────────────────────
    totalItems = 0;
    pageSize   = 25;
    pageIndex  = 0;
    searchTerm = '';
    pageSizeOptions = [10, 25, 50, 100];

    private auditService = inject(AuditService);
    private authService  = inject(AuthService);
    public  configService = inject(ConfigService);
    private dialog       = inject(MatDialog);
    private router       = inject(Router);

    getAuditStatus(score: number): string {
        return this.configService.getAuditStatus(score);
    }

    getScoreClass(score: number): string {
        const status = this.configService.getAuditStatus(score);
        if (status === 'Conforme') return 'score-high';
        if (status === 'Partiel')  return 'score-warning';
        return 'score-low';
    }

    canCreate() {
        return canCreateAudits(this.authService.currentUser());
    }

    isAdmin() {
        return isAdmin(this.authService.currentUser());
    }

    canSeeAuditor() {
        const user = this.authService.currentUser();
        return !!user && (user.role === UserRole.ADMIN || user.role === UserRole.BOSS);
    }

    /** Administrators or authorized users can edit any audit; Owners can edit their own */
    canEditAudit(audit: Audit): boolean {
        const user = this.authService.currentUser();
        if (!user) return false;
        if (isAdmin(user) || user.permissions?.audits?.update) return true;
        return audit.auditorId === user.id;
    }

    canDeleteAudit(): boolean {
        const user = this.authService.currentUser();
        return !!user && (isAdmin(user) || !!user.permissions?.audits?.delete);
    }

    // Connect sort to client-side sorting within the current page
    @ViewChild(MatSort) set sort(sort: MatSort) {
        this.dataSource.sort = sort;
    }

    // View Mode State
    viewMode: 'list' | 'calendar' = 'list';
    currentMonth = new Date();
    calendarDays: { date: Date, isCurrentMonth: boolean, audits: Audit[] }[] = [];
    weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    // KPI stats (from server totals)
    totalAudits  = 0;
    averageScore = 0;

    constructor() {
        this.dataSource = new MatTableDataSource<Audit>([]);
        this.loadAudits();
    }

    // ── Data loading ────────────────────────────────────────────────────────

    loadAudits(resetPage = false) {
        if (resetPage) {
            this.pageIndex = 0;
        }

        const filters = this.currentFilters ?? {};

        this.auditService
            .getAudits(filters, this.pageIndex + 1, this.pageSize, this.searchTerm)
            .subscribe(response => {
                this.dataSource.data = response.items;
                this.totalItems      = response.total;
                this.totalAudits     = response.total;
                this.averageScore    = Math.round(response.average_score);
                this.selection.clear();
                if (this.viewMode === 'calendar') {
                    this.generateCalendar();
                }
            });
    }

    // ── Search & Filter ─────────────────────────────────────────────────────

    applyFilter(event: Event) {
        this.searchTerm = (event.target as HTMLInputElement).value.trim();
        this.loadAudits(true);   // reset to page 1 on new search
    }

    onAdvancedFilterChange(filters: any) {
        this.currentFilters = filters;
        this.loadAudits(true);
    }

    toggleFilterBar() {
        this.showFilter = !this.showFilter;
    }

    // ── Pagination ──────────────────────────────────────────────────────────

    onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize  = event.pageSize;
        this.loadAudits();
    }

    // ── Selection helpers ───────────────────────────────────────────────────

    isAllSelected() {
        return this.selection.selected.length === this.dataSource.data.length;
    }

    toggleAllRows() {
        if (this.isAllSelected()) {
            this.selection.clear();
            return;
        }
        this.selection.select(...this.dataSource.data);
    }

    checkboxLabel(row?: Audit): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
    }

    // ── CRUD Actions ────────────────────────────────────────────────────────

    openAddDialog() {
        this.router.navigate(['/audits/new']);
    }

    viewDetails(audit: Audit) {
        this.router.navigate(['/audits', audit.id]);
    }

    continueAudit(audit: Audit) {
        this.router.navigate(['/audits', audit.id, 'edit']);
    }

    openEditDialog(audit: Audit) {
        const dialogRef = this.dialog.open(AuditDialogComponent, {
            width: '500px',
            data: audit
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && audit.id) {
                this.auditService.updateAudit(audit.id, result).subscribe({
                    next:  () => this.loadAudits(),
                    error: (err) => console.error('Error updating audit', err)
                });
            }
        });
    }

    deleteAudit(audit: Audit) {
        if (audit.id && confirm(`Êtes-vous sûr de vouloir supprimer l'audit #${audit.id} ?`)) {
            const id = audit.id;
            this.auditService.deleteAudit(id).subscribe(() => {
                this.loadAudits();
            });
        }
    }

    bulkDelete() {
        if (this.selection.selected.length === 0) return;
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selection.selected.length} audit(s) sélectionnés ?`)) {
            const idsToDelete = this.selection.selected
                .map(a => a.id)
                .filter((id): id is number => id !== undefined);

            this.auditService.deleteAudits(idsToDelete).subscribe(() => {
                this.selection.clear();
                this.loadAudits();
            });
        }
    }

    exportExcel() {
        this.auditService.exportExcel(this.currentFilters).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const timestamp = new Date().getTime();
                a.download = `audits_export_${timestamp}.xls`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => console.error('Error exporting audits to Excel', err)
        });
    }

    // ── Calendar view ───────────────────────────────────────────────────────

    toggleView(mode: 'list' | 'calendar') {
        this.viewMode = mode;
        if (mode === 'calendar') {
            // Load ALL audits for the calendar (no pagination)
            this.loadCalendarAudits();
        }
    }

    private calendarAllAudits: Audit[] = [];

    loadCalendarAudits() {
        const year  = this.currentMonth.getFullYear();
        const month = this.currentMonth.getMonth();
        const start = new Date(year, month, 1);
        const end   = new Date(year, month + 1, 0);

        this.auditService.getAllAudits({ startDate: start, endDate: end }).subscribe(audits => {
            this.calendarAllAudits = audits;
            this.generateCalendar();
        });
    }

    generateCalendar() {
        const year        = this.currentMonth.getFullYear();
        const month       = this.currentMonth.getMonth();
        const firstDay    = new Date(year, month, 1);
        const lastDay     = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay    = firstDay.getDay();

        this.calendarDays = [];

        for (let i = 0; i < startDay; i++) {
            const d = new Date(year, month, 1 - (startDay - i));
            this.calendarDays.push({ date: d, isCurrentMonth: false, audits: this.getAuditsForDate(d) });
        }
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            this.calendarDays.push({ date, isCurrentMonth: true, audits: this.getAuditsForDate(date) });
        }
        const remaining = 7 - (this.calendarDays.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                const d = new Date(year, month + 1, i);
                this.calendarDays.push({ date: d, isCurrentMonth: false, audits: this.getAuditsForDate(d) });
            }
        }
    }

    getAuditsForDate(date: Date): Audit[] {
        return this.calendarAllAudits.filter(a => this.isSameDate(new Date(a.date), date));
    }

    isSameDate(d1: Date, d2: Date): boolean {
        return d1.getDate()     === d2.getDate()     &&
               d1.getMonth()    === d2.getMonth()    &&
               d1.getFullYear() === d2.getFullYear();
    }

    prevMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
        this.loadCalendarAudits();
    }

    nextMonth() {
        this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
        this.loadCalendarAudits();
    }
}

import { Component, ViewChild, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
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
import { AuditUI as Audit } from '../../../core/models/audit.model';
import { canCreateAudits, isAdmin } from '../../../core/models/user.model';
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
        const cols = ['coffeeShop', 'auditor', 'date', 'score', 'status', 'actions'];
        if (this.canDeleteAudit()) {
            cols.unshift('select');
        }
        return cols;
    }
    dataSource: MatTableDataSource<Audit>;
    selection = new SelectionModel<Audit>(true, []);
    
    showFilter = false;
    currentFilters: any = {};

    private auditService = inject(AuditService);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);
    private router = inject(Router);

    canCreate() {
        return canCreateAudits(this.authService.currentUser());
    }

    isAdmin() {
        return isAdmin(this.authService.currentUser());
    }

    /** Auditors can only edit their own IN_PROGRESS audits; admin can edit any */
    canEditAudit(audit: Audit): boolean {
        const user = this.authService.currentUser();
        if (!user) return false;
        if (isAdmin(user) || user.permissions?.audits?.update) return true;
        return audit.workflowStatus === 'IN_PROGRESS' && canCreateAudits(user);
    }

    canDeleteAudit(): boolean {
        const user = this.authService.currentUser();
        return !!user && (isAdmin(user) || !!user.permissions?.audits?.delete);
    }

    // Use setters for ViewChild to handle *ngIf re-creation
    @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
        this.dataSource.paginator = paginator;
    }
    @ViewChild(MatSort) set sort(sort: MatSort) {
        this.dataSource.sort = sort;
    }

    // View Mode State
    viewMode: 'list' | 'calendar' = 'list';
    currentMonth = new Date();
    calendarDays: { date: Date, isCurrentMonth: boolean, audits: Audit[] }[] = [];
    weekDays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

    constructor() {
        this.dataSource = new MatTableDataSource<Audit>([]);
        
        // Custom filter predicate for the FilterBarComponent
        this.dataSource.filterPredicate = (data: Audit, filter: string) => {
            const searchStr = (data.coffeeShop + data.auditorName + data.status).toLowerCase();
            const matchesText = searchStr.includes(filter);

            let matchesAdvanced = true;
            if (this.currentFilters) {
                if (this.currentFilters.coffeeShop && data.coffeeShop !== this.currentFilters.coffeeShop) matchesAdvanced = false;
                if (this.currentFilters.auditorName && data.auditorName !== this.currentFilters.auditorName) matchesAdvanced = false;
                if (this.currentFilters.startDate) {
                    const d = new Date(data.date);
                    if (d < new Date(this.currentFilters.startDate)) matchesAdvanced = false;
                }
                if (this.currentFilters.endDate) {
                    const d = new Date(data.date);
                    if (d > new Date(this.currentFilters.endDate)) matchesAdvanced = false;
                }
                // Category filtering is tricky since it's inside items, skipping for simple audit list if not joined natively, or could be skipped
            }

            return matchesText && matchesAdvanced;
        };

        this.loadAudits();
    }

    totalAudits = 0;
    averageScore = 0;

    loadAudits() {
        this.auditService.getAudits().subscribe(data => {
            this.dataSource.data = data;
            this.calculateStats(data);
            if (this.viewMode === 'calendar') {
                this.generateCalendar();
            }
        });
    }

    calculateStats(data: Audit[]) {
        this.totalAudits = data.length;
        if (this.totalAudits > 0) {
            const sum = data.reduce((acc, curr) => acc + curr.score, 0);
            this.averageScore = Math.round(sum / this.totalAudits);
        } else {
            this.averageScore = 0;
        }
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    }

    onAdvancedFilterChange(filters: any) {
        this.currentFilters = filters;
        // Trigger filter predicate execution by reassigning filter (a hack)
        this.dataSource.filter = this.dataSource.filter || ' ';
        if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    }

    toggleFilterBar() {
        this.showFilter = !this.showFilter;
    }

    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
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
                    next: (updatedAudit) => {
                        console.log('Audit updated:', updatedAudit);
                        this.loadAudits();
                    },
                    error: (err) => console.error('Error updating audit', err)
                });
            }
        });
    }

    deleteAudit(audit: Audit) {
        if (audit.id && confirm(`Êtes-vous sûr de vouloir supprimer l'audit #${audit.id} ?`)) {
            const id = audit.id;
            this.auditService.deleteAudit(id).subscribe(() => {
                this.dataSource.data = this.dataSource.data.filter(a => a.id !== id);
                this.calculateStats(this.dataSource.data);
                if (this.viewMode === 'calendar') this.generateCalendar();
            });
        }
    }

    bulkDelete() {
        if (this.selection.selected.length === 0) return;
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${this.selection.selected.length} audit(s) sélectionnés ?`)) {
            const idsToDelete = this.selection.selected.map(a => a.id).filter((id): id is number => id !== undefined);
            
            this.auditService.deleteAudits(idsToDelete).subscribe(() => {
                 this.dataSource.data = this.dataSource.data.filter(a => a.id !== undefined && !idsToDelete.includes(a.id));
                 this.selection.clear();
                 this.calculateStats(this.dataSource.data);
                 if (this.viewMode === 'calendar') this.generateCalendar();
            });
        }
    }

    exportExcel() {
        const data = this.dataSource.filteredData.map(a => ({
            'ID': a.id,
            'Café': a.coffeeShop,
            'Auditeur': a.auditorName,
            'Date': new DatePipe('en-US').transform(a.date, 'dd/MM/yyyy'),
            'Score': a.score + '%',
            'Statut': a.status,
            'Etat Workflow': a.workflowStatus
        }));

        const replacer = (key: string, value: any) => value === null ? '' : value;
        const header = Object.keys(data[0]);
        const csv = data.map(row => header.map(fieldName => JSON.stringify((row as any)[fieldName], replacer)).join(','));
        csv.unshift(header.join(','));
        const csvArray = csv.join('\r\n');

        const blob = new Blob([csvArray], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audits_export_${new Date().getTime()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    // Calendar Methods
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

        // Previous month padding
        for (let i = 0; i < startDayOfWeek; i++) {
            const d = new Date(year, month, 1 - (startDayOfWeek - i));
            this.calendarDays.push({ date: d, isCurrentMonth: false, audits: this.getAuditsForDate(d) });
        }

        // Current month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            this.calendarDays.push({ date, isCurrentMonth: true, audits: this.getAuditsForDate(date) });
        }

        // Next month padding
        const remaining = 7 - (this.calendarDays.length % 7);
        if (remaining < 7) {
            for (let i = 1; i <= remaining; i++) {
                const d = new Date(year, month + 1, i);
                this.calendarDays.push({ date: d, isCurrentMonth: false, audits: this.getAuditsForDate(d) });
            }
        }
    }

    getAuditsForDate(date: Date): Audit[] {
        return this.dataSource.data.filter(a => this.isSameDate(new Date(a.date), date));
    }

    isSameDate(d1: Date, d2: Date): boolean {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
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

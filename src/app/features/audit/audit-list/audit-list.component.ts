import { Component, AfterViewInit, ViewChild, inject } from '@angular/core';
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
import { DatePipe, NgClass } from '@angular/common';
import { AuditService } from '../../../core/services/audit.service';
import { Audit } from '../../../core/models/audit.model';
import { Router, RouterModule } from '@angular/router';
import { AuditDialogComponent } from '../audit-dialog/audit-dialog.component';

import { MatMenuModule } from '@angular/material/menu';

@Component({
    selector: 'app-audit-list',
    standalone: true,
    imports: [
        MatTableModule, MatPaginatorModule, MatSortModule,
        MatInputModule, MatFormFieldModule, MatButtonModule,
        MatIconModule, MatChipsModule, MatTooltipModule,
        MatDialogModule, MatCheckboxModule, MatMenuModule,
        DatePipe, NgClass, RouterModule
    ],
    templateUrl: './audit-list.component.html',
    styleUrls: ['./audit-list.component.css']
})
export class AuditListComponent implements AfterViewInit {
    displayedColumns: string[] = ['select', 'coffeeShop', 'auditor', 'date', 'score', 'status', 'actions'];
    dataSource: MatTableDataSource<Audit>;
    selection = new SelectionModel<Audit>(true, []);

    private auditService = inject(AuditService);
    private dialog = inject(MatDialog);
    private router = inject(Router);
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor() {
        this.dataSource = new MatTableDataSource<Audit>([]);
        this.loadAudits();
    }

    loadAudits() {
        this.auditService.getAudits().subscribe(data => {
            this.dataSource.data = data;
            this.initTableFeatures();
        });
    }

    initTableFeatures() {
        if (this.paginator) this.dataSource.paginator = this.paginator;
        if (this.sort) this.dataSource.sort = this.sort;
    }

    ngAfterViewInit() {
        this.initTableFeatures();
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
        if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
    }

    /** Whether the number of selected elements matches the total number of rows. */
    isAllSelected() {
        const numSelected = this.selection.selected.length;
        const numRows = this.dataSource.data.length;
        return numSelected === numRows;
    }

    /** Selects all rows if they are not all selected; otherwise clear selection. */
    toggleAllRows() {
        if (this.isAllSelected()) {
            this.selection.clear();
            return;
        }

        this.selection.select(...this.dataSource.data);
    }

    /** The label for the checkbox on the passed row */
    checkboxLabel(row?: Audit): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
    }

    openAddDialog() {
        // const dialogRef = this.dialog.open(AuditDialogComponent, {
        //     width: '500px'
        // });

        // dialogRef.afterClosed().subscribe(result => {
        //     if (result) {
        //         // Add logic to save the new audit (mock)
        //         console.log('New audit:', result);
        //         this.dataSource.data = [result, ...this.dataSource.data]; // Add to top
        //     }
        // });
        this.router.navigate(['/audits/new']);
    }

    viewDetails(audit: Audit) {
        this.router.navigate(['/audits', audit.id]);
    }

    openEditDialog(audit: Audit) {
        const dialogRef = this.dialog.open(AuditDialogComponent, {
            width: '500px',
            data: audit
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Update logic (mock)
                console.log('Updated audit:', result);
                const index = this.dataSource.data.findIndex(a => a.id === result.id);
                if (index >= 0) {
                    const updatedData = [...this.dataSource.data];
                    updatedData[index] = result;
                    this.dataSource.data = updatedData;
                }
            }
        });
    }
}

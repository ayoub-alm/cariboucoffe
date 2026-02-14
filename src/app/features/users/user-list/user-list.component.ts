import { Component, AfterViewInit, ViewChild, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatMenuModule,
        MatDialogModule
    ],
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements AfterViewInit {
    displayedColumns: string[] = ['select', 'name', 'email', 'role', 'coffeeShop', 'status', 'actions'];
    dataSource: MatTableDataSource<User>;
    selection = new SelectionModel<User>(true, []);

    private userService = inject(UserService);
    private router = inject(Router);
    private dialog = inject(MatDialog);

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor() {
        this.dataSource = new MatTableDataSource<User>([]);
        this.loadUsers();
    }

    totalUsers = 0;
    activeUsers = 0;

    loadUsers() {
        this.userService.getUsers().subscribe(data => {
            this.dataSource.data = data;
            this.calculateStats(data);
            this.initTableFeatures();
        });
    }

    calculateStats(data: User[]) {
        this.totalUsers = data.length;
        this.activeUsers = data.filter(u => u.is_active).length;
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

    checkboxLabel(row?: User): string {
        if (!row) {
            return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
        }
        return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.id}`;
    }

    openAddDialog() {
        const dialogRef = this.dialog.open(UserDialogComponent, {
            width: '600px',
            data: null
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Actually, the dialog handles the call? Or returns data?
                // The dialog returned 'result' which was an object.
                // We should call service here.
                // Assuming dialog returns the FORM data, not the created user.

                this.userService.createUser(result).subscribe({
                    next: (newUser) => {
                        this.dataSource.data = [newUser, ...this.dataSource.data];
                    },
                    error: (err) => console.error(err)
                });
            }
        });
    }

    viewDetails(user: User) {
        this.router.navigate(['/users', user.id]);
    }

    editUser(user: User) {
        const dialogRef = this.dialog.open(UserDialogComponent, {
            width: '600px',
            data: user
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.userService.updateUser(user.id, result).subscribe({
                    next: (updatedUser) => {
                        const index = this.dataSource.data.findIndex(u => u.id === updatedUser.id);
                        if (index >= 0) {
                            const updatedData = [...this.dataSource.data];
                            updatedData[index] = updatedUser;
                            this.dataSource.data = updatedData;
                        }
                    },
                    error: (err) => console.error(err)
                });
            }
        });
    }

    deleteUser(user: User) {
        if (confirm(`Êtes-vous sûr de vouloir supprimer ${user.full_name}?`)) {
            this.userService.deleteUser(user.id).subscribe({
                next: () => {
                    this.dataSource.data = this.dataSource.data.filter(u => u.id !== user.id);
                },
                error: (err) => console.error(err)
            });
        }
    }
}

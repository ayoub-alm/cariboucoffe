import { Component, OnInit, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models/user.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    FormsModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule
  ],
  templateUrl: './notification-manager.component.html',
  styleUrl: './notification-manager.component.css'
})
export class NotificationManagerComponent implements OnInit, AfterViewInit {
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<User>([]);
  displayedColumns: string[] = ['name', 'email', 'daily', 'weekly', 'monthly'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadUsers();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      },
      error: (err) => console.error('Error loading users', err)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  togglePreference(user: User, field: 'receive_daily_report' | 'receive_weekly_report' | 'receive_monthly_report', checked: boolean) {
    const update = { [field]: checked };
    this.userService.updateUser(user.id, update).subscribe({
      next: () => {
        this.snackBar.open(`Préférence mise à jour pour ${user.full_name}`, 'OK', { duration: 2000 });
        user[field] = checked; // Local update
      },
      error: (err) => {
        this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
        console.error(err);
        // Revert checkbox in UI would require more complex state management or reloading
        user[field] = !checked;
      }
    });
  }
}

import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatMenuModule } from '@angular/material/menu';
import { CoffeeService } from '../../../core/services/coffee.service';
import { Coffee } from '../../../core/models/coffee.model';
import { CoffeeDialogComponent } from '../coffee-dialog/coffee-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-coffee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './coffee-list.component.html',
  styleUrl: './coffee-list.component.css'
})
export class CoffeeListComponent implements OnInit, AfterViewInit {
  private coffeeService = inject(CoffeeService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  dataSource = new MatTableDataSource<Coffee>([]);
  displayedColumns: string[] = ['ref', 'name', 'location', 'active', 'actions'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.loadCoffees();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadCoffees() {
    this.coffeeService.getCoffees().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        if (this.paginator) {
          this.dataSource.paginator = this.paginator;
        }
        if (this.sort) {
          this.dataSource.sort = this.sort;
        }
      },
      error: (err) => console.error('Error loading coffees', err)
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openDialog(coffee?: Coffee) {
    const dialogRef = this.dialog.open(CoffeeDialogComponent, {
      width: '100%',
      maxWidth: '500px',
      data: coffee ? { ...coffee } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (coffee) {
          this.coffeeService.updateCoffee(coffee.id, result).subscribe(() => {
            this.snackBar.open('Café mis à jour', 'Fermer', { duration: 3000 });
            this.loadCoffees();
          });
        } else {
          this.coffeeService.createCoffee(result).subscribe(() => {
            this.snackBar.open('Café créé', 'Fermer', { duration: 3000 });
            this.loadCoffees();
          });
        }
      }
    });
  }

  deleteCoffee(coffee: Coffee) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${coffee.name}?`)) {
      this.coffeeService.deleteCoffee(coffee.id).subscribe(() => {
        this.snackBar.open('Café supprimé', 'Fermer', { duration: 3000 });
        this.loadCoffees();
      });
    }
  }
}

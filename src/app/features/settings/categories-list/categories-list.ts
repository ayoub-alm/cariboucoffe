import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { CategoryDialogComponent } from '../category-dialog/category-dialog';

@Component({
  selector: 'app-categories-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './categories-list.html',
  styleUrls: ['./categories-list.css']
})
export class CategoriesListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  displayedColumns = ['name', 'description', 'actions'];
  isLoading = signal(false);

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.snackBar.open('Erreur lors du chargement des catégories', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  openAddDialog() {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  openEditDialog(category: Category) {
    const dialogRef = this.dialog.open(CategoryDialogComponent, {
      width: '500px',
      data: category
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCategories();
      }
    });
  }

  deleteCategory(category: Category) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Catégorie supprimée avec succès', 'Fermer', { duration: 3000 });
          this.loadCategories();
        },
        error: (err) => {
          console.error('Error deleting category:', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  viewQuestions(category: Category) {
    this.router.navigate(['/settings/questions', category.id]);
  }
}

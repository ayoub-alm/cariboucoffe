import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { CategoryDialogComponent } from '../category-dialog/category-dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-categories-list',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    DragDropModule,
  ],
  templateUrl: './categories-list.html',
  styleUrls: ['./categories-list.css']
})
export class CategoriesListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  categories = signal<Category[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);
  isSavingOrder = signal(false);

  isAdmin = () => this.authService.currentUser()?.role === UserRole.ADMIN;

  filteredCategories = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.categories();
    return this.categories().filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set([...data].sort((a, b) => a.display_order - b.display_order));
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des catégories', 'Fermer', { duration: 3000 });
        this.isLoading.set(false);
      }
    });
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  clearSearch() {
    this.searchQuery.set('');
  }

  onDrop(event: CdkDragDrop<Category[]>) {
    if (!this.isAdmin() || this.searchQuery()) return;
    const list = [...this.categories()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    list.forEach((cat, idx) => cat.display_order = idx);
    this.categories.set(list);
    this.saveOrder(list);
  }

  private saveOrder(list: Category[]) {
    this.isSavingOrder.set(true);
    const items = list.map((c, idx) => ({ id: c.id, display_order: idx }));
    this.categoryService.reorderCategories(items).subscribe({
      next: () => {
        this.isSavingOrder.set(false);
        this.snackBar.open('Ordre mis à jour', undefined, { duration: 2000 });
      },
      error: () => {
        this.isSavingOrder.set(false);
        this.snackBar.open('Erreur lors de la mise à jour de l\'ordre', 'Fermer', { duration: 3000 });
      }
    });
  }

  openAddDialog() {
    this.dialog.open(CategoryDialogComponent, { width: '500px', data: null })
      .afterClosed().subscribe(r => { if (r) this.loadCategories(); });
  }

  openEditDialog(category: Category) {
    this.dialog.open(CategoryDialogComponent, { width: '500px', data: category })
      .afterClosed().subscribe(r => { if (r) this.loadCategories(); });
  }

  deleteCategory(category: Category) {
    if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      this.categoryService.deleteCategory(category.id).subscribe({
        next: () => {
          this.snackBar.open('Catégorie supprimée', 'Fermer', { duration: 3000 });
          this.loadCategories();
        },
        error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 })
      });
    }
  }

  viewQuestions(category: Category) {
    this.router.navigate(['/settings/questions', category.id]);
  }
}

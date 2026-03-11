import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
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
import { Category, Question } from '../../../core/models/category.model';
import { QuestionDialogComponent } from '../question-dialog/question-dialog';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-questions-list',
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
  templateUrl: './questions-list.html',
  styleUrls: ['./questions-list.css']
})
export class QuestionsListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  category = signal<Category | null>(null);
  questions = signal<Question[]>([]);
  searchQuery = signal('');
  isLoading = signal(false);
  isSavingOrder = signal(false);
  categoryId: number | null = null;
  totalScore = 0;

  isAdmin = () => this.authService.currentUser()?.role === UserRole.ADMIN;

  filteredQuestions = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.questions();
    return this.questions().filter(question =>
      question.text.toLowerCase().includes(q)
    );
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId = +id;
      this.loadCategory();
      this.loadQuestions();
    }
  }

  loadCategory() {
    if (!this.categoryId) return;
    this.categoryService.getCategory(this.categoryId).subscribe({
      next: (data) => this.category.set(data),
      error: () => this.snackBar.open('Erreur lors du chargement de la catégorie', 'Fermer', { duration: 3000 })
    });
  }

  loadQuestions() {
    if (!this.categoryId) return;
    this.isLoading.set(true);
    this.categoryService.getQuestions(this.categoryId).subscribe({
      next: (data) => {
        const sorted = [...data].sort((a, b) => a.display_order - b.display_order);
        this.questions.set(sorted);
        this.totalScore = sorted.reduce((acc, q) => acc + q.weight, 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des questions', 'Fermer', { duration: 3000 });
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

  onDrop(event: CdkDragDrop<Question[]>) {
    if (!this.isAdmin() || this.searchQuery()) return;
    const list = [...this.questions()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    list.forEach((q, idx) => q.display_order = idx);
    this.questions.set(list);
    this.saveOrder(list);
  }

  private saveOrder(list: Question[]) {
    this.isSavingOrder.set(true);
    const items = list.map((q, idx) => ({ id: q.id, display_order: idx }));
    this.categoryService.reorderQuestions(items).subscribe({
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
    if (!this.categoryId) return;
    this.dialog.open(QuestionDialogComponent, {
      width: '600px',
      data: { categoryId: this.categoryId, question: null }
    }).afterClosed().subscribe(r => { if (r) this.loadQuestions(); });
  }

  openEditDialog(question: Question) {
    this.dialog.open(QuestionDialogComponent, {
      width: '600px',
      data: { categoryId: this.categoryId, question }
    }).afterClosed().subscribe(r => { if (r) this.loadQuestions(); });
  }

  deleteQuestion(question: Question) {
    if (confirm('Supprimer cette question ?')) {
      this.categoryService.deleteQuestion(question.id).subscribe({
        next: () => {
          this.snackBar.open('Question supprimée', 'Fermer', { duration: 3000 });
          this.loadQuestions();
        },
        error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 })
      });
    }
  }

  goBack() {
    this.router.navigate(['/settings/categories']);
  }
}

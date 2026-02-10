import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { CategoryService } from '../../../core/services/category.service';
import { Category, Question } from '../../../core/models/category.model';
import { QuestionDialogComponent } from '../question-dialog/question-dialog';

@Component({
  selector: 'app-questions-list',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './questions-list.html',
  styleUrls: ['./questions-list.css']
})
export class QuestionsListComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  category = signal<Category | null>(null);
  questions = signal<Question[]>([]);
  displayedColumns = ['text', 'weight', 'actions'];
  isLoading = signal(false);
  categoryId: number | null = null;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.categoryId = +id;
      this.loadCategory();
      this.loadQuestions();
    }
  }

  loadCategory() {
    if (this.categoryId) {
      this.categoryService.getCategory(this.categoryId).subscribe({
        next: (data) => {
          this.category.set(data);
        },
        error: (err) => {
          console.error('Error loading category:', err);
          this.snackBar.open('Erreur lors du chargement de la catégorie', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  loadQuestions() {
    if (this.categoryId) {
      this.isLoading.set(true);
      this.categoryService.getQuestions(this.categoryId).subscribe({
        next: (data) => {
          this.questions.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading questions:', err);
          this.snackBar.open('Erreur lors du chargement des questions', 'Fermer', { duration: 3000 });
          this.isLoading.set(false);
        }
      });
    }
  }

  openAddDialog() {
    if (!this.categoryId) return;

    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '600px',
      data: { categoryId: this.categoryId, question: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadQuestions();
      }
    });
  }

  openEditDialog(question: Question) {
    const dialogRef = this.dialog.open(QuestionDialogComponent, {
      width: '600px',
      data: { categoryId: this.categoryId, question }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadQuestions();
      }
    });
  }

  deleteQuestion(question: Question) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette question ?`)) {
      this.categoryService.deleteQuestion(question.id).subscribe({
        next: () => {
          this.snackBar.open('Question supprimée avec succès', 'Fermer', { duration: 3000 });
          this.loadQuestions();
        },
        error: (err) => {
          console.error('Error deleting question:', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/settings/categories']);
  }

  getWeightColor(weight: number): string {
    if (weight >= 3) return 'warn';
    if (weight === 2) return 'accent';
    return 'primary';
  }
}

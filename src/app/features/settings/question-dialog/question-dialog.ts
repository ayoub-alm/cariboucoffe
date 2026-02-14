import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../core/services/category.service';
import { Question, QuestionCreate } from '../../../core/models/category.model';

interface DialogData {
  categoryId: number;
  question: Question | null;
}

@Component({
  selector: 'app-question-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule
  ],
  templateUrl: './question-dialog.html',
  styleUrls: ['./question-dialog.css']
})
export class QuestionDialogComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<QuestionDialogComponent>);

  isEdit = false;
  weights = [1, 2, 3, 4, 5];

  questionForm = this.fb.group({
    text: ['', [Validators.required, Validators.minLength(10)]],
    weight: [1, [Validators.required, Validators.min(0)]],
    correct_answer: ['oui', [Validators.required]],
    na_score: [0, [Validators.required, Validators.min(0)]]
  });




  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    if (data.question) {
      this.isEdit = true;
      this.questionForm.patchValue({
        text: data.question.text,
        weight: data.question.weight,
        correct_answer: data.question.correct_answer || 'oui', // Fallback if old data doesn't have it
        na_score: data.question.na_score || 0
      });

    }
  }

  onSubmit() {
    if (this.questionForm.valid) {
      const formValue = this.questionForm.value;
      const questionData: QuestionCreate = {
        text: formValue.text!,
        weight: formValue.weight!,
        correct_answer: formValue.correct_answer! as 'oui' | 'non',
        na_score: formValue.na_score!,
        category_id: this.data.categoryId
      };


      if (this.isEdit && this.data.question) {
        this.categoryService.updateQuestion(this.data.question.id, questionData).subscribe({
          next: () => {
            this.snackBar.open('Question modifiée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Error updating question:', err);
            this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
          }
        });
      } else {
        this.categoryService.createQuestion(questionData).subscribe({
          next: () => {
            this.snackBar.open('Question créée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Error creating question:', err);
            this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
          }
        });
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}

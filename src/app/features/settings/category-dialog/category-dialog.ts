import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './category-dialog.html',
  styleUrls: ['./category-dialog.css']
})
export class CategoryDialogComponent {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CategoryDialogComponent>);

  isEdit = false;

  categoryForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: Category | null) {
    if (data) {
      this.isEdit = true;
      this.categoryForm.patchValue({
        name: data.name,
        description: data.description || ''
      });
    }
  }

  onSubmit() {
    if (this.categoryForm.valid) {
      const formValue = this.categoryForm.value;
      const categoryData = {
        name: formValue.name!,
        description: formValue.description || undefined
      };

      if (this.isEdit && this.data) {
        this.categoryService.updateCategory(this.data.id, categoryData).subscribe({
          next: () => {
            this.snackBar.open('Catégorie modifiée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Error updating category:', err);
            this.snackBar.open('Erreur lors de la modification', 'Fermer', { duration: 3000 });
          }
        });
      } else {
        this.categoryService.createCategory(categoryData).subscribe({
          next: () => {
            this.snackBar.open('Catégorie créée avec succès', 'Fermer', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (err) => {
            console.error('Error creating category:', err);
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

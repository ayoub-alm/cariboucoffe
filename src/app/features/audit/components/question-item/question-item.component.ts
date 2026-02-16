import { Component, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuditQuestion } from '../../../../core/models/audit.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-question-item',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatExpansionModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div [formGroup]="group()" class="question-item">
      <div class="header-row">
        <div class="question-content">
          <p class="question-label">{{ item().label }}</p>
          
          <mat-button-toggle-group formControlName="status" class="status-toggle">
            <mat-button-toggle value="oui" class="toggle-success">
              <mat-icon class="icon-spacer">check_circle</mat-icon> Oui
            </mat-button-toggle>
            <mat-button-toggle value="non" class="toggle-error">
              <mat-icon class="icon-spacer">cancel</mat-icon> Non
            </mat-button-toggle>
            <mat-button-toggle value="n/a">
              <mat-icon class="icon-spacer">not_interested</mat-icon> N/A
            </mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>

      <!-- Expansion panel for remarks -->
      <mat-accordion class="remarks-accordion" *ngIf="showDetails()">
        <mat-expansion-panel [expanded]="isExpanded()" (opened)="isExpanded.set(true)" (closed)="isExpanded.set(false)">
          <mat-expansion-panel-header>
            <mat-panel-title class="panel-warning-title" [class.text-danger]="isNonConform()">
              <mat-icon class="icon-spacer" *ngIf="isNonConform()">warning</mat-icon> 
              <mat-icon class="icon-spacer" *ngIf="!isNonConform()">info</mat-icon>
              {{ isNonConform() ? 'Non-conformité détectée - Remarque obligatoire' : 'Détails & Photo' }}
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Détails / Action corrective</mat-label>
            <textarea matInput formControlName="remarks" rows="3" placeholder="Décrire le problème et l'action à entreprendre..."></textarea>
            <mat-error *ngIf="group().get('remarks')?.hasError('required')">
              La remarque est obligatoire en cas de non-conformité.
            </mat-error>
          </mat-form-field>

          <!-- Photo Upload Section -->
          <div class="photo-section">
            <div class="photo-actions" *ngIf="!photoPreview()">
                <button mat-stroked-button color="primary" type="button" (click)="fileInput.click()" [disabled]="isCompressing()">
                  <mat-icon>add_a_photo</mat-icon> Ajouter Photo
                </button>
                <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" style="display: none;">
            </div>

            <div *ngIf="photoPreview()" class="photo-preview-container">
                <img [src]="photoPreview()" class="preview-img">
                <button mat-icon-button color="warn" class="remove-btn" type="button" (click)="removePhoto()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>
             <div *ngIf="isCompressing()" class="compressing-text">Optimisation...</div>
          </div>

        </mat-expansion-panel>
      </mat-accordion>
    </div>
  `,
  styles: [`
    .question-item {
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #eee;
      margin-bottom: 16px;
    }
    .header-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
    .question-content {
      flex: 1;
    }
    .question-label {
      font-size: 1rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    .icon-spacer {
      margin-right: 4px;
    }
    
    /* Toggle Colors */
    .toggle-success.mat-button-toggle-checked {
      background-color: #e8f5e9 !important;
      color: #2e7d32 !important;
    }
    .toggle-error.mat-button-toggle-checked {
      background-color: #ffebee !important;
      color: #c62828 !important;
    }

    /* Accordion */
    .remarks-accordion {
      margin-top: 12px;
      display: block;
    }
    .panel-warning-title {
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    .text-danger { color: #c62828; }
    
    .full-width {
      width: 100%;
    }
    .photo-section {
        margin-top: 12px;
    }
    .photo-actions {
      display: flex;
      gap: 8px;
    }
    .photo-preview-container {
        position: relative;
        display: inline-block;
        margin-top: 8px;
    }
    .preview-img {
        max-height: 150px;
        border-radius: 8px;
        border: 1px solid #ddd;
    }
    .remove-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        background: white;
        border: 1px solid #ddd;
        width: 24px;
        height: 24px;
        line-height: 24px;
        display: flex; /* For centering icon */
        align-items: center;
        justify-content: center;
    }
    .compressing-text {
        font-size: 0.8rem;
        color: #666;
        margin-top: 4px;
    }
  `]
})
export class QuestionItemComponent implements OnInit, OnDestroy {
  group = input.required<FormGroup>();
  item = input.required<AuditQuestion>();
  isExpanded = signal(false);
  private sub?: Subscription;
  showDetails = signal(false);
  isNonConform = signal(false);

  // Photo signals
  photoPreview = signal<string | null>(null);
  isCompressing = signal(false);

  ngOnInit() {
    this.sub = this.group().get('status')?.valueChanges.subscribe(val => {
      this.checkConformity(val);
    });
    // Initial check
    this.checkConformity(this.group().get('status')?.value);

    // Resume photo preview if exist
    const existingPhoto = this.group().get('photoData')?.value;
    if (existingPhoto) {
      this.photoPreview.set(existingPhoto);
    }
  }

  private checkConformity(val: string | null | undefined) {
    if (!val) {
      this.showDetails.set(false);
      this.isNonConform.set(false);
      return;
    }

    // Default to 'oui' if undefined
    const correctAnswer = this.item().correct_answer?.toLowerCase() || 'oui';
    const choice = val.toLowerCase();

    // It is non-conform if it's NOT the correct answer AND it's NOT 'n/a'
    const isNonConform = (choice !== correctAnswer && choice !== 'n/a');
    this.isNonConform.set(isNonConform);

    this.showDetails.set(true);

    if (isNonConform && !this.isExpanded()) {
      this.isExpanded.set(true);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  processFile(file: File) {
    this.isCompressing.set(true);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        this.photoPreview.set(dataUrl);

        // Keep the control if mapped, handle if missing
        const control = this.group().get('photoData');
        if (control) {
          control.setValue(dataUrl);
        } else {
          // Maybe we should add it if missing?
          // Better to rely on parent creating it properly
        }

        this.isCompressing.set(false);
      };
    };
    reader.readAsDataURL(file);
  }

  removePhoto() {
    this.photoPreview.set(null);
    this.group().patchValue({ photoData: null });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

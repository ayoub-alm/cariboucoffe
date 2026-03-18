import { Component, inject, input, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { AuditQuestion } from '../../../../core/models/audit.model';
import { CameraDialogComponent } from '../camera-dialog/camera-dialog.component';
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
          
          <mat-button-toggle-group formControlName="status" class="status-toggle custom-toggle-group" hideSingleSelectionIndicator="true">
            <mat-button-toggle value="oui" class="custom-toggle custom-success">
              <mat-icon class="icon-spacer toggle-active-icon">check_circle</mat-icon> Oui
            </mat-button-toggle>
            <mat-button-toggle value="non" class="custom-toggle custom-error">
              <mat-icon class="icon-spacer toggle-active-icon">cancel</mat-icon> Non
            </mat-button-toggle>
            <mat-button-toggle value="n/a" class="custom-toggle custom-na">
              <mat-icon class="icon-spacer toggle-active-icon">not_interested</mat-icon> N/A
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
              {{ isNonConform() ? 'Non-conformité détectée - Remarque obligatoire' : 'Détails & Photos' }}
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
            <div class="photo-actions">
                <button mat-stroked-button color="primary" type="button" (click)="fileInput.click()" [disabled]="isCompressing()">
                  <mat-icon>add_photo_alternate</mat-icon> Depuis l'appareil
                </button>
                <button mat-stroked-button color="primary" type="button" (click)="openCamera(cameraInput)" [disabled]="isCompressing()">
                  <mat-icon>photo_camera</mat-icon> Prendre photo
                </button>
                <input #fileInput type="file" (change)="onFilesSelected($event)" accept="image/*" multiple style="display: none;">
                <input #cameraInput type="file" (change)="onFilesSelected($event)" accept="image/*" capture="environment" style="display: none;">
            </div>

            <div *ngIf="photoPreviews().length" class="photo-grid">
                <div *ngFor="let photo of photoPreviews(); let idx = index" class="photo-preview-container">
                    <img [src]="photo" class="preview-img">
                    <button mat-icon-button color="warn" class="remove-btn" type="button" (click)="removePhoto(idx)">
                        <mat-icon>close</mat-icon>
                    </button>
                </div>
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
    .custom-toggle-group {
      border: none !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
      border-radius: 8px;
    }
    .custom-toggle {
      border: none !important;
      padding: 0 16px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .toggle-active-icon {
        opacity: 0.5;
        transition: opacity 0.2s, transform 0.2s;
    }
    
    .custom-success.mat-button-toggle-checked {
      background-color: #e8f5e9 !important;
      color: #2e7d32 !important;
    }
    .custom-success.mat-button-toggle-checked .toggle-active-icon { opacity: 1; transform: scale(1.1); }
    
    .custom-error.mat-button-toggle-checked {
      background-color: #ffebee !important;
      color: #c62828 !important;
    }
    .custom-error.mat-button-toggle-checked .toggle-active-icon { opacity: 1; transform: scale(1.1); }
    
    .custom-na.mat-button-toggle-checked {
      background-color: #f5f5f5 !important;
      color: #616161 !important;
    }
    .custom-na.mat-button-toggle-checked .toggle-active-icon { opacity: 1; transform: scale(1.1); }

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
      flex-wrap: wrap;
    }
    .photo-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
    }
    .photo-preview-container {
        position: relative;
        display: inline-block;
    }
    .preview-img {
        height: 100px;
        width: 100px;
        object-fit: cover;
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
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .compressing-text {
        font-size: 0.8rem;
        color: #666;
        margin-top: 4px;
    }

    @media (max-width: 600px) {
      .header-row {
        flex-direction: column;
        align-items: stretch;
      }
      .custom-toggle-group {
        width: 100%;
        display: flex;
        flex-direction: column;
      }
      .custom-toggle {
        width: 100%;
        text-align: center;
        padding: 12px 0;
      }
    }
  `]
})
export class QuestionItemComponent implements OnInit, OnDestroy {
  private dialog = inject(MatDialog);

  group = input.required<FormGroup>();
  item = input.required<AuditQuestion>();
  isExpanded = signal(false);
  private sub?: Subscription;
  showDetails = signal(false);
  isNonConform = signal(false);

  photoPreviews = signal<string[]>([]);
  isCompressing = signal(false);
  isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  ngOnInit() {
    this.sub = this.group().get('status')?.valueChanges.subscribe(val => {
      this.checkConformity(val);
    });
    this.checkConformity(this.group().get('status')?.value);

    const existing = this.group().get('photosData')?.value;
    if (existing?.length) {
      this.photoPreviews.set([...existing]);
    }
  }

  private checkConformity(val: string | null | undefined) {
    if (!val || val === 'null' || val === 'undefined') {
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

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        this.processFile(files[i]);
      }
    }
    input.value = '';
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
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const updated = [...this.photoPreviews(), dataUrl];
        this.photoPreviews.set(updated);

        const control = this.group().get('photosData');
        if (control) {
          control.setValue(updated);
        }

        this.isCompressing.set(false);
      };
    };
    reader.readAsDataURL(file);
  }

  removePhoto(index: number) {
    const updated = this.photoPreviews().filter((_, i) => i !== index);
    this.photoPreviews.set(updated);
    this.group().patchValue({ photosData: updated });
  }

  openCamera(mobileInput?: HTMLInputElement) {
    if (this.isMobile && mobileInput) {
      mobileInput.click();
    } else {
      this.dialog.open(CameraDialogComponent, { width: '600px', autoFocus: false }).afterClosed().subscribe(dataUrl => {
        if (dataUrl) {
          const updated = [...this.photoPreviews(), dataUrl];
          this.photoPreviews.set(updated);
          const control = this.group().get('photosData');
          if (control) {
            control.setValue(updated);
          }
        }
      });
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

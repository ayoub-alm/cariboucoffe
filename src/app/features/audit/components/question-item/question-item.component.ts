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
      <mat-accordion class="remarks-accordion" *ngIf="showRemarks()">
        <mat-expansion-panel [expanded]="isExpanded()" (opened)="isExpanded.set(true)" (closed)="isExpanded.set(false)">
          <mat-expansion-panel-header>
            <mat-panel-title class="panel-warning-title">
              <mat-icon class="icon-spacer">warning</mat-icon> 
              Non-conformité détectée - Remarque obligatoire
            </mat-panel-title>
          </mat-expansion-panel-header>
          
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Détails / Action corrective</mat-label>
            <textarea matInput formControlName="remarks" rows="3" placeholder="Décrire le problème et l'action à entreprendre..."></textarea>
            <mat-error *ngIf="group().get('remarks')?.hasError('required')">
              La remarque est obligatoire en cas de non-conformité.
            </mat-error>
          </mat-form-field>

          <div class="photo-actions">
            <button mat-stroked-button color="primary" type="button">
              <mat-icon>add_a_photo</mat-icon> Ajouter Photo
            </button>
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
      color: #c62828; /* Red 800 */
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    .full-width {
      width: 100%;
    }
    .photo-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  `]
})
export class QuestionItemComponent implements OnInit, OnDestroy {
  group = input.required<FormGroup>();
  item = input.required<AuditQuestion>();
  isExpanded = signal(false);
  private sub?: Subscription;
  showRemarks = signal(false);

  ngOnInit() {
    this.sub = this.group().get('status')?.valueChanges.subscribe(val => {
      const isNon = val === 'non';
      this.showRemarks.set(isNon);
      if (isNon) this.isExpanded.set(true);
    });
    // Initial check
    if (this.group().get('status')?.value === 'non') {
      this.showRemarks.set(true);
      this.isExpanded.set(true);
    }
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}

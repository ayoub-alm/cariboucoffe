import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AUDIT_CATEGORIES_TEMPLATE, AuditQuestion } from '../../../../core/models/audit.model';

@Component({
    selector: 'app-audit-summary',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatListModule,
        MatIconModule,
        MatProgressBarModule
    ],
    template: `
    <div class="summary-container">
      <mat-card class="score-card" [ngClass]="scoreClass()">
        <mat-card-header>
          <mat-card-title class="card-title">Score de Conformité</mat-card-title>
        </mat-card-header>
        <mat-card-content class="score-content">
          <div class="score-value">{{ score() | number:'1.0-0' }}%</div>
          <mat-progress-bar mode="determinate" [value]="score()" class="score-bar"></mat-progress-bar>
          <p class="score-label">{{ scoreStatus() }}</p>
        </mat-card-content>
      </mat-card>

      <h3 class="section-heading error-text" *ngIf="nonConformities().length > 0">
        <mat-icon class="heading-icon">warning</mat-icon> Non-Conformités ({{ nonConformities().length }})
      </h3>

      <div class="non-conformity-list">
        <mat-card *ngFor="let item of nonConformities()" class="nc-card">
          <mat-card-content>
            <h4 class="nc-title">{{ item.label }}</h4>
            <p class="nc-category">Catégorie: {{ item.categoryName }}</p>
            <div class="nc-actions">
              <strong>Action requise:</strong> {{ item.remarks || 'Aucune remarque saisie' }}
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div *ngIf="nonConformities().length === 0" class="success-message">
        <mat-icon class="success-icon">verified</mat-icon>
        <h3 class="success-title">Excellent !</h3>
        <p>Aucune non-conformité détectée.</p>
      </div>
    </div>
  `,
    styles: [`
    .summary-container { padding: 16px; }
    
    /* Score Card */
    .score-card { 
      border-radius: 12px; 
      margin-bottom: 24px;
    }
    .score-content { 
      text-align: center; 
      padding: 24px 0; 
    }
    .card-title { font-size: 1.5rem; }
    .score-value { 
      font-size: 3rem; 
      font-weight: 700; 
      margin-bottom: 8px; 
    }
    .score-bar { 
      height: 1rem; 
      border-radius: 4px; 
      margin-bottom: 8px;
    }
    .score-label { font-size: 1.125rem; font-weight: 500; }

    /* Score Variants */
    .score-success { background-color: #f1f8e9; border: 1px solid #c5e1a5; color: #33691e; }
    .score-warning { background-color: #fff8e1; border: 1px solid #ffe082; color: #ff6f00; }
    .score-danger { background-color: #ffebee; border: 1px solid #ffcdd2; color: #c62828; }

    /* Non Conformities */
    .section-heading {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
    }
    .heading-icon { margin-right: 8px; }
    .error-text { color: #c62828; }
    
    .non-conformity-list { display: grid; gap: 16px; }
    
    .nc-card {
      border-left: 4px solid #f44336;
    }
    .nc-title { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
    .nc-category { font-size: 0.875rem; color: #666; margin-bottom: 8px; }
    .nc-actions {
      background-color: #ffebee;
      padding: 12px;
      border-radius: 4px;
      color: #b71c1c;
      border: 1px solid #ffcdd2;
    }

    /* Success Message */
    .success-message {
      text-align: center;
      padding: 32px;
      color: #2e7d32;
      background-color: #e8f5e9;
      border-radius: 8px;
      border: 1px solid #c8e6c9;
    }
    .success-icon { font-size: 3rem; width: 3rem; height: 3rem; margin-bottom: 8px; }
    .success-title { font-size: 1.25rem; font-weight: 700; }
  `]
})
export class AuditSummaryComponent {
    auditForm = input.required<FormGroup>();

    allQuestionsWithAnswers = computed(() => {
        const categoriesFormArray = this.auditForm().get('categories')?.value;
        if (!categoriesFormArray || !Array.isArray(categoriesFormArray)) return [];

        const results: any[] = [];
        AUDIT_CATEGORIES_TEMPLATE.forEach((tplCat, catIndex) => {
            const formCat = categoriesFormArray[catIndex];
            if (!formCat || !formCat.items) return;

            tplCat.items.forEach((tplItem, itemIndex) => {
                const formItem = formCat.items[itemIndex];
                if (formItem) {
                    results.push({
                        ...tplItem,
                        status: formItem.status,
                        remarks: formItem.remarks,
                        categoryName: tplCat.name
                    });
                }
            });
        });
        return results;
    });

    score = computed(() => {
        const items = this.allQuestionsWithAnswers();
        const scorable = items.filter(i => i.status === 'oui' || i.status === 'non');
        if (scorable.length === 0) return 100;
        const yesCount = scorable.filter(i => i.status === 'oui').length;
        return (yesCount / scorable.length) * 100;
    });

    nonConformities = computed(() => {
        return this.allQuestionsWithAnswers().filter(i => i.status === 'non');
    });

    scoreStatus = computed(() => {
        const s = this.score();
        if (s >= 85) return 'Conforme (Excellent)';
        if (s >= 70) return 'Conforme (Moyen)';
        return 'Non-conforme';
    });

    scoreClass = computed(() => {
        const s = this.score();
        if (s >= 85) return 'score-success';
        if (s >= 70) return 'score-warning';
        return 'score-danger';
    });
}

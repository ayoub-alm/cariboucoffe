import { Component, input, computed, ChangeDetectionStrategy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AuditCategory } from '../../../../core/models/audit.model';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap, startWith } from 'rxjs';

interface ReviewQuestion {
  label: string;
  status: 'oui' | 'non' | 'n/a' | null;
  remarks: string;
  photos: string[];
  weight: number;
  correct_answer: string;
  categoryName: string;
  isNonConform: boolean;
}

interface ReviewCategory {
  name: string;
  questions: ReviewQuestion[];
  score: number;
  total: number;
  percentage: number;
  naCount: number;
}

@Component({
  selector: 'app-audit-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="review-container">

      <!-- ── Score Hero ───────────────────────────── -->
      <div class="score-hero" [class]="scoreClass()">
        <div class="score-ring-wrap">
          <svg class="score-ring" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-width="12"/>
            <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="12"
              stroke-linecap="round"
              stroke-dasharray="327"
              [attr.stroke-dashoffset]="327 - (327 * score() / 100)"/>
          </svg>
          <div class="score-inner">
            <span class="score-pct">{{ score() | number:'1.0-0' }}%</span>
            <span class="score-lbl">{{ scoreStatus() }}</span>
          </div>
        </div>

        <div class="score-stats">
          <div class="stat-item">
            <mat-icon class="stat-icon ok">check_circle</mat-icon>
            <span class="stat-num">{{ conformCount() }}</span>
            <span class="stat-lbl">Conformes</span>
          </div>
          <div class="stat-item">
            <mat-icon class="stat-icon nok">cancel</mat-icon>
            <span class="stat-num">{{ nonConformCount() }}</span>
            <span class="stat-lbl">Non-conformes</span>
          </div>
          <div class="stat-item">
            <mat-icon class="stat-icon na">not_interested</mat-icon>
            <span class="stat-num">{{ naCount() }}</span>
            <span class="stat-lbl">N/A</span>
          </div>
        </div>
      </div>

      <!-- ── Category bars ────────────────────────── -->
      <div class="cats-section">
        <h3 class="section-title">
          <mat-icon>bar_chart</mat-icon> Scores par catégorie
        </h3>
        <div class="cat-bars">
          @for (cat of reviewCategories(); track cat.name) {
            <div class="cat-bar-item">
              <div class="cat-bar-header">
                <span class="cat-bar-name">{{ cat.name }}</span>
                <div class="cat-bar-badges">
                  @if (cat.naCount > 0) {
                    <span class="badge-na">{{ cat.naCount }} N/A</span>
                  }
                  <span class="cat-bar-pct" [class]="cat.percentage >= 85 ? 'pct-ok' : cat.percentage >= 70 ? 'pct-warn' : 'pct-bad'">
                    {{ cat.percentage | number:'1.0-0' }}%
                  </span>
                </div>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill"
                  [style.width.%]="cat.percentage"
                  [class]="cat.percentage >= 85 ? 'fill-ok' : cat.percentage >= 70 ? 'fill-warn' : 'fill-bad'">
                </div>
              </div>
              <div class="cat-bar-sub">{{ cat.score }} / {{ cat.total }} pts évalués</div>
            </div>
          }
        </div>
      </div>

      <!-- ── Full question breakdown ───────────────── -->
      <div class="breakdown-section">
        <h3 class="section-title">
          <mat-icon>list_alt</mat-icon> Détail complet des réponses
        </h3>

        @for (cat of reviewCategories(); track cat.name) {
          <div class="cat-block">
            <div class="cat-block-header">
              <span class="cat-block-name">{{ cat.name }}</span>
              <span class="cat-block-score"
                [class]="cat.percentage >= 85 ? 'pct-ok' : cat.percentage >= 70 ? 'pct-warn' : 'pct-bad'">
                {{ cat.score }}/{{ cat.total }} pts · {{ cat.percentage | number:'1.0-0' }}%
              </span>
            </div>

            @for (q of cat.questions; track q.label) {
              <div class="q-row" [class.q-nc]="q.isNonConform" [class.q-na]="q.status === 'n/a'">
                <div class="q-row-main">
                  <span class="q-label">{{ q.label }}</span>
                  <div class="q-row-right">
                    <span class="q-pts">{{ q.weight }} pt{{ q.weight > 1 ? 's' : '' }}</span>
                    <span class="q-badge"
                      [class.badge-oui]="q.status === 'oui'"
                      [class.badge-non]="q.status === 'non'"
                      [class.badge-na]="q.status === 'n/a'"
                      [class.badge-null]="!q.status">
                      @if (q.status === 'oui') { <mat-icon class="badge-icon">check</mat-icon> Oui }
                      @else if (q.status === 'non') { <mat-icon class="badge-icon">close</mat-icon> Non }
                      @else if (q.status === 'n/a') { <mat-icon class="badge-icon">remove</mat-icon> N/A }
                      @else { — }
                    </span>
                  </div>
                </div>
                @if (q.remarks) {
                  <div class="q-remark">
                    <mat-icon class="remark-icon">comment</mat-icon> {{ q.remarks }}
                  </div>
                }
                @if (q.photos.length) {
                  <div class="q-photo-row">
                    @for (p of q.photos; track p) {
                      <img [src]="p" class="q-thumb" alt="photo">
                    }
                    <span class="q-photo-lbl"><mat-icon>photo_camera</mat-icon> {{ q.photos.length }} photo(s)</span>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- ── Non-conformities alert ────────────────── -->
      @if (nonConformList().length > 0) {
        <div class="nc-alert-section">
          <h3 class="section-title nc-title">
            <mat-icon>warning</mat-icon> {{ nonConformList().length }} Non-conformité(s) à corriger
          </h3>
          @for (nc of nonConformList(); track nc.label) {
            <div class="nc-card">
              <div class="nc-card-header">
                <mat-icon class="nc-icon">error_outline</mat-icon>
                <div>
                  <div class="nc-label">{{ nc.label }}</div>
                  <div class="nc-cat">{{ nc.categoryName }} · {{ nc.weight }} pt(s)</div>
                </div>
              </div>
              @if (nc.remarks) {
                <div class="nc-remark">
                  <strong>Action corrective :</strong> {{ nc.remarks }}
                </div>
              } @else {
                <div class="nc-remark nc-remark-missing">
                  <mat-icon style="font-size:14px;width:14px;height:14px;">warning_amber</mat-icon>
                  Aucune remarque saisie — pensez à décrire l'action corrective
                </div>
              }
              @if (nc.photos.length) {
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
                  @for (p of nc.photos; track p) {
                    <img [src]="p" class="nc-thumb" alt="photo nc">
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="all-ok-banner">
          <mat-icon class="ok-icon">verified</mat-icon>
          <div>
            <div class="ok-title">Excellent !</div>
            <div class="ok-sub">Aucune non-conformité détectée sur cet audit.</div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .review-container { display: flex; flex-direction: column; gap: 28px; padding: 8px 0; }

    /* ── Score Hero ── */
    .score-hero {
      display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
      padding: 28px 32px; border-radius: 16px;
    }
    .score-hero.score-ok   { background: linear-gradient(135deg,#e8f5e9,#f1f8e9); color:#2e7d32; border:1px solid #a5d6a7; }
    .score-hero.score-warn { background: linear-gradient(135deg,#fff8e1,#fffde7); color:#e65100; border:1px solid #ffe082; }
    .score-hero.score-bad  { background: linear-gradient(135deg,#ffebee,#fce4ec); color:#c62828; border:1px solid #ef9a9a; }

    .score-ring-wrap { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .score-ring { width: 100%; height: 100%; transform: rotate(-90deg); }
    .score-inner {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .score-pct { font-size: 1.8rem; font-weight: 800; line-height: 1; }
    .score-lbl { font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; margin-top: 2px; }

    .score-stats { display: flex; gap: 24px; flex-wrap: wrap; }
    .stat-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .stat-icon { font-size: 28px; width: 28px; height: 28px; }
    .stat-icon.ok  { color: #2e7d32; }
    .stat-icon.nok { color: #c62828; }
    .stat-icon.na  { color: #f57c00; }
    .stat-num { font-size: 1.6rem; font-weight: 700; line-height: 1; }
    .stat-lbl { font-size: 0.7rem; text-transform: uppercase; letter-spacing: .5px; opacity: .75; }

    /* ── Shared ── */
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 1rem; font-weight: 700; color: #424242;
      margin: 0 0 16px;
    }
    .section-title mat-icon { font-size: 20px; width: 20px; height: 20px; }

    /* ── Category bars ── */
    .cats-section {}
    .cat-bars { display: flex; flex-direction: column; gap: 14px; }
    .cat-bar-item {}
    .cat-bar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .cat-bar-name { font-size: 13px; font-weight: 600; color: #424242; }
    .cat-bar-badges { display: flex; align-items: center; gap: 8px; }
    .badge-na {
      font-size: 11px; font-weight: 600; padding: 1px 7px;
      background: #fff3e0; color: #e65100; border-radius: 4px;
    }
    .cat-bar-pct { font-size: 13px; font-weight: 700; }
    .pct-ok   { color: #2e7d32; }
    .pct-warn { color: #e65100; }
    .pct-bad  { color: #c62828; }
    .cat-bar-track { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    .cat-bar-fill { height: 100%; border-radius: 4px; transition: width .4s ease; }
    .fill-ok   { background: #4caf50; }
    .fill-warn { background: #ff9800; }
    .fill-bad  { background: #f44336; }
    .cat-bar-sub { font-size: 11px; color: #9e9e9e; margin-top: 4px; text-align: right; }

    /* ── Breakdown ── */
    .breakdown-section {}
    .cat-block { border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; margin-bottom: 16px; }
    .cat-block-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px;
      background: #f5f5f5; border-bottom: 1px solid #e0e0e0;
      font-weight: 700; font-size: 13px;
    }
    .cat-block-name { color: #424242; }
    .cat-block-score { font-size: 12px; }

    .q-row {
      padding: 11px 16px; border-bottom: 1px solid #f0f0f0;
      background: #fff; transition: background .15s;
    }
    .q-row:last-child { border-bottom: none; }
    .q-row.q-nc { background: #fff8f8; border-left: 3px solid #f44336; }
    .q-row.q-na { opacity: .75; }

    .q-row-main { display: flex; align-items: center; gap: 12px; }
    .q-label { flex: 1; font-size: 13px; color: #424242; line-height: 1.4; }
    .q-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .q-pts { font-size: 11px; color: #9e9e9e; }

    .q-badge {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 3px 10px; border-radius: 5px; font-size: 12px; font-weight: 600;
    }
    .badge-icon { font-size: 14px; width: 14px; height: 14px; }
    .badge-oui  { background: #e8f5e9; color: #2e7d32; }
    .badge-non  { background: #ffebee; color: #c62828; }
    .badge-na   { background: #fff3e0; color: #e65100; }
    .badge-null { background: #f5f5f5; color: #9e9e9e; }

    .q-remark {
      display: flex; align-items: flex-start; gap: 6px;
      margin-top: 8px; padding: 8px 10px;
      background: #fafafa; border-radius: 5px;
      font-size: 12px; color: #616161; line-height: 1.5;
    }
    .remark-icon { font-size: 14px; width: 14px; height: 14px; margin-top: 1px; color:#9e9e9e; }

    .q-photo-row {
      display: flex; align-items: center; gap: 10px; margin-top: 8px;
    }
    .q-thumb {
      width: 72px; height: 50px; object-fit: cover; border-radius: 5px;
      border: 1px solid #ddd;
    }
    .q-photo-lbl { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #1976d2; font-weight: 500; }
    .q-photo-lbl mat-icon { font-size: 14px; width: 14px; height: 14px; }

    /* ── NC section ── */
    .nc-alert-section {}
    .nc-title { color: #c62828; }
    .nc-card {
      border: 1px solid #ffcdd2; border-left: 4px solid #f44336;
      border-radius: 8px; padding: 14px 16px; margin-bottom: 12px;
      background: #fff;
    }
    .nc-card-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .nc-icon { color: #f44336; font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .nc-label { font-size: 14px; font-weight: 700; color: #424242; }
    .nc-cat { font-size: 12px; color: #757575; margin-top: 2px; }
    .nc-remark {
      padding: 10px 12px; border-radius: 6px;
      background: #fff8f8; border: 1px solid #ffcdd2;
      font-size: 13px; color: #b71c1c; line-height: 1.5;
    }
    .nc-remark-missing {
      display: flex; align-items: center; gap: 6px;
      background: #fffde7; border-color: #ffe082; color: #e65100;
    }
    .nc-thumb {
      display: block;
      max-height: 90px; border-radius: 6px; border: 1px solid #ddd;
    }

    /* ── All OK ── */
    .all-ok-banner {
      display: flex; align-items: center; gap: 20px;
      padding: 24px 28px; border-radius: 12px;
      background: linear-gradient(135deg,#e8f5e9,#f1f8e9);
      border: 1px solid #a5d6a7; color: #2e7d32;
    }
    .ok-icon { font-size: 48px; width: 48px; height: 48px; }
    .ok-title { font-size: 1.2rem; font-weight: 700; }
    .ok-sub { font-size: 14px; opacity: .8; margin-top: 4px; }
  `]
})
export class AuditSummaryComponent {
  auditForm = input.required<FormGroup>();
  /** Real categories loaded from backend — passed from the stepper */
  auditCategories = input<AuditCategory[]>([]);

  /**
   * A signal that emits the RAW form value every time any control changes.
   * This is what makes computed() reactive — without it, computed() only
   * runs once because the FormGroup reference never changes.
   */
  private formSnapshot = toSignal(
    toObservable(this.auditForm).pipe(
      switchMap(form => form.valueChanges.pipe(startWith(form.getRawValue())))
    )
  );

  /** Build a rich review structure from form values + category metadata */
  reviewCategories = computed<ReviewCategory[]>(() => {
    this.formSnapshot(); // subscribe so computed re-runs on every change
    const cats = this.auditCategories();
    const form = this.auditForm();
    const formCatsValue = form.getRawValue()?.categories as any[];
    if (!cats.length || !formCatsValue?.length) return [];

    return cats.map((cat, catIdx) => {
      const formCat = formCatsValue[catIdx];
      const formItems: any[] = formCat?.items ?? [];

      let score = 0;
      let total = 0;
      let naCount = 0;

      const questions: ReviewQuestion[] = cat.items.map((item, itemIdx) => {
        const formItem = formItems[itemIdx] ?? {};
        const status: 'oui' | 'non' | 'n/a' | null = formItem.status ?? null;
        const weight = item.weight ?? 1;
        const correct = item.correct_answer ?? 'oui';
        const isNonConform = !!status && status !== 'n/a' && status !== correct;

        if (status === 'n/a') {
          naCount++;
        } else if (status) {
          total += weight;
          if (status === correct) score += weight;
        }

        return {
          label: item.label,
          status,
          remarks: formItem.remarks ?? '',
          photos: formItem.photosData ?? [],
          weight,
          correct_answer: correct,
          categoryName: cat.name,
          isNonConform
        };
      });

      const percentage = total > 0 ? (score / total) * 100 : 100;

      return { name: cat.name, questions, score, total, percentage, naCount };
    });
  });

  score = computed(() => {
    const cats = this.reviewCategories();
    let s = 0, t = 0;
    cats.forEach(c => { s += c.score; t += c.total; });
    return t > 0 ? (s / t) * 100 : 100;
  });

  conformCount = computed(() =>
    this.reviewCategories().flatMap(c => c.questions).filter(q => q.status !== 'n/a' && !q.isNonConform && q.status).length
  );

  nonConformCount = computed(() => this.nonConformList().length);

  naCount = computed(() =>
    this.reviewCategories().flatMap(c => c.questions).filter(q => q.status === 'n/a').length
  );

  nonConformList = computed(() =>
    this.reviewCategories().flatMap(c => c.questions).filter(q => q.isNonConform)
  );

  scoreStatus = computed(() => {
    const s = this.score();
    if (s >= 85) return 'Conforme';
    if (s >= 70) return 'Partiel';
    return 'Non-conforme';
  });

  scoreClass = computed(() => {
    const s = this.score();
    if (s >= 85) return 'score-ok';
    if (s >= 70) return 'score-warn';
    return 'score-bad';
  });
}

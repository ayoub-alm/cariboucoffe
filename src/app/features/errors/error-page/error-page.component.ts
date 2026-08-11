import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-page">
      <!-- Animated background beans -->
      <div class="bg-beans">
        <div class="bean bean-1">☕</div>
        <div class="bean bean-2">☕</div>
        <div class="bean bean-3">☕</div>
        <div class="bean bean-4">☕</div>
        <div class="bean bean-5">☕</div>
      </div>

      <!-- Steam particles -->
      <div class="steam-container" *ngIf="code !== '503'">
        <div class="steam s1"></div>
        <div class="steam s2"></div>
        <div class="steam s3"></div>
      </div>

      <div class="error-card">
        <!-- Top coffee accent bar -->
        <div class="card-accent"></div>

        <!-- Cup icon area -->
        <div class="cup-wrapper">
          <div class="cup" [class.spilled]="code === '500'" [class.cold]="code === '503'">
            <div class="cup-body">
              <div class="cup-inner">
                <span class="cup-emoji">{{ cupEmoji }}</span>
              </div>
              <div class="cup-handle"></div>
            </div>
            <div class="saucer"></div>
          </div>

          <!-- Spill effect for 500 -->
          <div class="spill" *ngIf="code === '500'"></div>
        </div>

        <!-- Error code -->
        <div class="error-code-wrapper">
          <span class="error-code">{{ code }}</span>
        </div>

        <!-- Content -->
        <h1 class="error-title">{{ title }}</h1>
        <p class="error-subtitle">{{ subtitle }}</p>
        <p class="error-hint">{{ hint }}</p>

        <!-- Actions -->
        <div class="error-actions">
          <button class="btn-primary" (click)="goHome()">
            <span class="btn-icon">🏠</span>
            Retour à l'accueil
          </button>
          <button class="btn-secondary" (click)="goBack()" *ngIf="showBack">
            <span class="btn-icon">←</span>
            Page précédente
          </button>
          <button class="btn-secondary" (click)="reload()" *ngIf="showReload">
            <span class="btn-icon">↻</span>
            Réessayer
          </button>
        </div>

        <!-- Caribou branding -->
        <div class="branding">
          <span class="brand-dot">●</span>
          <span class="brand-name">Caribou Coffee</span>
          <span class="brand-dot">●</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap');

    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1b130e 0%, #3e2b21 40%, #291c15 70%, #150f0b 100%);
      position: relative;
      overflow: hidden;
      font-family: 'Outfit', 'Google Sans', sans-serif;
      padding: 24px;
    }

    /* ── Background floating beans ── */
    .bg-beans {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .bean {
      position: absolute;
      font-size: 2rem;
      opacity: 0.08;
      animation: floatBean 8s ease-in-out infinite;
      filter: grayscale(100%);
    }
    .bean-1 { top: 10%; left: 5%;  animation-delay: 0s;   font-size: 2.5rem; }
    .bean-2 { top: 70%; left: 8%;  animation-delay: 1.5s; font-size: 1.8rem; }
    .bean-3 { top: 20%; right: 6%; animation-delay: 3s;   font-size: 3rem;   }
    .bean-4 { bottom: 15%; right: 10%; animation-delay: 2s; font-size: 2rem; }
    .bean-5 { top: 50%; left: 50%; animation-delay: 4s; font-size: 1.5rem; opacity: 0.05; }

    @keyframes floatBean {
      0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.08; }
      50%       { transform: translateY(-20px) rotate(15deg); opacity: 0.14; }
    }

    /* ── Steam particles ── */
    .steam-container {
      position: absolute;
      top: 20%;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }

    .steam {
      position: absolute;
      width: 6px;
      border-radius: 50px;
      background: rgba(255, 255, 255, 0.15);
      animation: steamRise 3s ease-in-out infinite;
    }
    .s1 { height: 40px; left: -20px; animation-delay: 0s;   }
    .s2 { height: 60px; left:   0px; animation-delay: 0.8s; }
    .s3 { height: 45px; left:  20px; animation-delay: 1.6s; }

    @keyframes steamRise {
      0%   { transform: translateY(0)   scaleX(1);   opacity: 0; }
      20%  { opacity: 0.6; }
      80%  { opacity: 0.2; }
      100% { transform: translateY(-80px) scaleX(2.5); opacity: 0; }
    }

    /* ── Error card ── */
    .error-card {
      position: relative;
      background: rgba(255, 255, 255, 0.07);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      padding: 0 48px 40px;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.1);
      animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(40px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0)    scale(1); }
    }

    .card-accent {
      height: 4px;
      background: linear-gradient(90deg, #5ba4b7, #78c2d4, #4893a7, #5ba4b7);
      background-size: 200% 100%;
      border-radius: 28px 28px 0 0;
      margin: 0 -1px;
      animation: shimmer 3s linear infinite;
    }

    @keyframes shimmer {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }

    /* ── Cup ── */
    .cup-wrapper {
      position: relative;
      display: inline-block;
      margin: 28px 0 8px;
    }

    .cup {
      display: flex;
      flex-direction: column;
      align-items: center;
      animation: gentleWobble 4s ease-in-out infinite;
    }
    .cup.spilled { animation: tippedCup 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both, tippedCupHold 4s 0.8s ease-in-out infinite; }
    .cup.cold    { animation: shiver 1.5s ease-in-out infinite; }

    @keyframes gentleWobble {
      0%, 100% { transform: rotate(0deg); }
      25%      { transform: rotate(2deg); }
      75%      { transform: rotate(-2deg); }
    }
    @keyframes tippedCup {
      from { transform: rotate(0deg) translateX(0); }
      to   { transform: rotate(-30deg) translateX(-10px); }
    }
    @keyframes tippedCupHold {
      0%, 100% { transform: rotate(-30deg) translateX(-10px); }
      50%      { transform: rotate(-28deg) translateX(-8px); }
    }
    @keyframes shiver {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
      20%, 40%, 60%, 80%       { transform: translateX(3px); }
    }

    .cup-body {
      position: relative;
      width: 80px;
      height: 72px;
      background: linear-gradient(160deg, #6db1c2, #418596);
      border-radius: 6px 6px 20px 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 -4px 8px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.4);
    }

    .cup-inner {
      width: 64px;
      height: 56px;
      background: linear-gradient(160deg, #78c2d4, #4893a7);
      border-radius: 4px 4px 16px 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cup-emoji {
      font-size: 28px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    }

    .cup-handle {
      position: absolute;
      right: -14px;
      top: 16px;
      width: 16px;
      height: 28px;
      border: 4px solid #6db1c2;
      border-left: none;
      border-radius: 0 12px 12px 0;
    }

    .saucer {
      width: 96px;
      height: 12px;
      background: linear-gradient(160deg, #5ba4b7, #377686);
      border-radius: 50%;
      margin-top: -2px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }

    .spill {
      position: absolute;
      bottom: -10px;
      left: 50%;
      transform: translateX(-70%);
      width: 60px;
      height: 20px;
      background: radial-gradient(ellipse, rgba(62, 43, 33, 0.9) 0%, transparent 70%);
      border-radius: 50%;
      animation: spreadSpill 1.2s ease-out 0.8s both;
    }

    @keyframes spreadSpill {
      from { transform: translateX(-50%) scale(0); opacity: 0; }
      to   { transform: translateX(-70%) scale(1); opacity: 1; }
    }

    /* ── Error code ── */
    .error-code-wrapper {
      margin: 12px 0 4px;
    }

    .error-code {
      font-size: clamp(72px, 15vw, 110px);
      font-weight: 900;
      font-family: 'Outfit', sans-serif;
      line-height: 1;
      background: linear-gradient(135deg, #78c2d4 0%, #6db1c2 40%, #5ba4b7 60%, #78c2d4 100%);
      background-size: 200% 200%;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: tealShimmer 4s linear infinite;
      letter-spacing: -4px;
    }

    @keyframes tealShimmer {
      0%   { background-position: 0% 50%; }
      50%  { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    /* ── Text ── */
    .error-title {
      font-size: clamp(20px, 4vw, 26px);
      font-weight: 700;
      color: #ffffff;
      margin: 4px 0 12px;
      letter-spacing: -0.3px;
      font-family: 'Outfit', sans-serif;
    }

    .error-subtitle {
      font-size: 15px;
      color: rgba(255, 255, 255, 0.65);
      margin: 0 0 8px;
      line-height: 1.6;
    }

    .error-hint {
      font-size: 13px;
      color: rgba(109, 177, 194, 0.9);
      margin: 0 0 32px;
      font-style: italic;
    }

    /* ── Buttons ── */
    .error-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 32px;
    }

    .btn-primary, .btn-secondary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 600;
      font-family: 'Outfit', sans-serif;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
      letter-spacing: 0.2px;
    }

    .btn-primary {
      background: linear-gradient(135deg, #78c2d4, #5ba4b7);
      color: #1a0a00;
      box-shadow: 0 4px 20px rgba(109, 177, 194, 0.35);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(109, 177, 194, 0.5);
      background: linear-gradient(135deg, #8ad3e6, #6db1c2);
    }

    .btn-primary:active { transform: translateY(0); }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.1);
      color: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.18);
      transform: translateY(-2px);
      color: #ffffff;
    }

    .btn-icon { font-size: 16px; }

    /* ── Branding ── */
    .branding {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: rgba(255, 255, 255, 0.3);
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 600;
    }

    .brand-dot { color: #6db1c2; font-size: 8px; }

    /* ── Responsive ── */
    @media (max-width: 480px) {
      .error-card { padding: 0 24px 32px; border-radius: 20px; }
      .error-actions { flex-direction: column; align-items: center; }
      .btn-primary, .btn-secondary { width: 100%; justify-content: center; }
    }
  `]
})
export class ErrorPageComponent {
  @Input() code: '404' | '500' | '503' = '404';

  constructor(private router: Router) {}

  get title(): string {
    return {
      '404': 'Page introuvable',
      '500': 'Erreur serveur',
      '503': 'Service indisponible',
    }[this.code];
  }

  get subtitle(): string {
    return {
      '404': 'Oups ! La page que vous cherchez s\'est évaporée comme la vapeur d\'un espresso.',
      '500': 'Quelque chose a mal tourné côté serveur. Notre équipe est déjà sur le coup !',
      '503': 'Notre service fait une courte pause — comme une machine à café qui chauffe.',
    }[this.code];
  }

  get hint(): string {
    return {
      '404': 'Vérifiez l\'URL ou revenez à l\'accueil.',
      '500': 'Réessayez dans quelques instants ou contactez le support.',
      '503': 'Veuillez patienter et réessayer dans quelques minutes.',
    }[this.code];
  }

  get cupEmoji(): string {
    return {
      '404': '🔍',
      '500': '💥',
      '503': '⏳',
    }[this.code];
  }

  get showBack(): boolean {
    return this.code === '404';
  }

  get showReload(): boolean {
    return this.code === '500' || this.code === '503';
  }

  goHome() {
    this.router.navigate(['/dashboard']);
  }

  goBack() {
    window.history.back();
  }

  reload() {
    window.location.reload();
  }
}

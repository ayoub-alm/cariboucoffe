import { Component, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-camera-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <h2 mat-dialog-title class="cam-title">
      <mat-icon>photo_camera</mat-icon> Prendre une photo
    </h2>

    <mat-dialog-content class="cam-content">
      <!-- Error state -->
      <div *ngIf="error()" class="cam-error">
        <mat-icon>videocam_off</mat-icon>
        <p>{{ error() }}</p>
        <button mat-stroked-button (click)="close()">Fermer</button>
      </div>

      <!-- Loading -->
      <div *ngIf="!error() && !ready()" class="cam-loading">
        <mat-icon class="spin">sync</mat-icon>
        <p>Accès à la caméra...</p>
      </div>

      <!-- Live video -->
      <div class="cam-video-wrapper" [style.display]="ready() && !captured() ? 'block' : 'none'">
        <video #videoEl autoplay playsinline muted class="cam-video"></video>
      </div>

      <!-- Captured preview -->
      <div *ngIf="captured()" class="cam-preview-wrapper">
        <img [src]="captured()" class="cam-preview" alt="Captured">
      </div>

      <canvas #canvasEl style="display:none;"></canvas>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="cam-actions">
      <button mat-button (click)="close()">Annuler</button>

      <button mat-stroked-button *ngIf="captured()" (click)="retake()">
        <mat-icon>replay</mat-icon> Reprendre
      </button>

      <button mat-raised-button color="primary" *ngIf="ready() && !captured()" (click)="capture()">
        <mat-icon>camera</mat-icon> Capturer
      </button>

      <button mat-raised-button color="primary" *ngIf="captured()" (click)="confirm()">
        <mat-icon>check</mat-icon> Utiliser
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .cam-title {
      display: flex; align-items: center; gap: 8px;
      margin: 0; padding: 16px 24px 8px;
    }
    .cam-content {
      min-width: 340px; max-width: 640px;
      display: flex; flex-direction: column; align-items: center;
      padding: 8px 24px 16px;
    }
    .cam-video-wrapper { width: 100%; border-radius: 8px; overflow: hidden; background: #000; }
    .cam-video { width: 100%; display: block; border-radius: 8px; }
    .cam-preview-wrapper { width: 100%; border-radius: 8px; overflow: hidden; }
    .cam-preview { width: 100%; display: block; border-radius: 8px; }
    .cam-error, .cam-loading {
      display: flex; flex-direction: column; align-items: center; gap: 12px;
      padding: 40px 20px; color: var(--on-surface-variant); text-align: center;
    }
    .cam-error mat-icon, .cam-loading mat-icon { font-size: 48px; width: 48px; height: 48px; color: var(--outline); }
    .cam-error p, .cam-loading p { margin: 0; font-size: 14px; }
    .cam-actions { padding: 8px 24px 16px; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }

    @media (max-width: 500px) {
      .cam-content { min-width: unset; }
    }
  `]
})
export class CameraDialogComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasRef!: ElementRef<HTMLCanvasElement>;

  ready = signal(false);
  error = signal<string | null>(null);
  captured = signal<string | null>(null);

  private stream: MediaStream | null = null;

  constructor(private dialogRef: MatDialogRef<CameraDialogComponent>) {}

  async ngAfterViewInit() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false
      });
      this.videoRef.nativeElement.srcObject = this.stream;
      this.ready.set(true);
    } catch (err: any) {
      console.error('Camera access failed:', err);
      if (err.name === 'NotAllowedError') {
        this.error.set('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.');
      } else if (err.name === 'NotFoundError') {
        this.error.set('Aucune caméra détectée sur cet appareil.');
      } else {
        this.error.set('Impossible d\'accéder à la caméra. Vérifiez vos permissions.');
      }
    }
  }

  capture() {
    const video = this.videoRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    const MAX = 1024;
    let w = canvas.width;
    let h = canvas.height;
    if (w > h) {
      if (w > MAX) { h *= MAX / w; w = MAX; }
    } else {
      if (h > MAX) { w *= MAX / h; h = MAX; }
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    outCanvas.getContext('2d')!.drawImage(canvas, 0, 0, w, h);

    this.captured.set(outCanvas.toDataURL('image/jpeg', 0.7));
    this.stopStream();
  }

  retake() {
    this.captured.set(null);
    this.ready.set(false);
    this.ngAfterViewInit();
  }

  confirm() {
    this.dialogRef.close(this.captured());
  }

  close() {
    this.stopStream();
    this.dialogRef.close(null);
  }

  private stopStream() {
    this.stream?.getTracks().forEach(t => t.stop());
    this.stream = null;
  }

  ngOnDestroy() {
    this.stopStream();
  }
}

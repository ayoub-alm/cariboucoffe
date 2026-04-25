import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-pwa-install-ios-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './pwa-install-ios-dialog.component.html',
    styleUrl: './pwa-install-ios-dialog.component.css'
})
export class PwaInstallIosDialogComponent {
    private dialogRef = inject(MatDialogRef<PwaInstallIosDialogComponent>);

    close() {
        this.dialogRef.close();
    }
}

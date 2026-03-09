import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../core/services/user.service';
import { User, UserRole, getRoleDisplayName } from '../../../core/models/user.model';

@Component({
    selector: 'app-user-details',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatCheckboxModule,
        MatSnackBarModule
    ],
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private userService = inject(UserService);
    private snackBar = inject(MatSnackBar);
    UserRole = UserRole;
    getRoleDisplayName = getRoleDisplayName;

    user: User | undefined;

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const numericId = parseInt(id, 10);
            if (!isNaN(numericId)) {
                this.userService.getUserById(numericId).subscribe({
                    next: (data) => {
                        if (data) {
                            this.user = data;
                        } else {
                            console.error('User not found');
                            this.router.navigate(['/users']);
                        }
                    },
                    error: (err) => {
                        console.error('Error fetching user', err);
                        this.router.navigate(['/users']);
                    }
                });
            } else {
                console.error('Invalid user ID');
                this.router.navigate(['/users']);
            }
        }
    }

    goBack() {
        this.router.navigate(['/users']);
    }

    updateNotificationPreference(preference: 'receive_daily_report' | 'receive_weekly_report' | 'receive_monthly_report', value: boolean) {
        if (!this.user) return;

        // Optimistic update
        this.user[preference] = value;

        this.userService.updateUser(this.user.id, { [preference]: value }).subscribe({
            next: () => {
                this.snackBar.open('Préférence de notification mise à jour', 'Fermer', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error updating preference', err);
                // Revert on error
                if (this.user) {
                    this.user[preference] = !value;
                }
                this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
            }
        });
    }
}

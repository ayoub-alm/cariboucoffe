import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../../../core/services/user.service';
import { UserRightsService, ModuleKey } from '../../../core/services/user-rights.service';
import { User, UserRole, getRoleDisplayName, UserPermissions, ModulePermissions } from '../../../core/models/user.model';
import { AuthService } from '../../../core/services/auth.service';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { ResetPasswordDialogComponent } from '../reset-password-dialog/reset-password-dialog.component';

type ActionKey = 'read' | 'create' | 'update' | 'delete';

@Component({
    selector: 'app-user-details',
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatCheckboxModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatMenuModule,
        MatDialogModule,
        MatDividerModule,
    ],
    templateUrl: './user-details.component.html',
    styleUrls: ['./user-details.component.css']
})
export class UserDetailsComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private userService = inject(UserService);
    private userRightsService = inject(UserRightsService);
    private snackBar = inject(MatSnackBar);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);

    UserRole = UserRole;
    getRoleDisplayName = getRoleDisplayName;

    user: User | undefined;
    permissions = signal<UserPermissions | null>(null);
    savingPermissions = signal(false);

    isAdmin = computed(() => this.authService.currentUser()?.role === UserRole.ADMIN);

    readonly modules: { key: ModuleKey; label: string }[] = [
        { key: 'coffees', label: 'Cafés' },
        { key: 'audits', label: 'Audits' },
        { key: 'users', label: 'Utilisateurs' },
        { key: 'categories', label: 'Catégories' },
        { key: 'questions', label: 'Questions' },
    ];

    readonly actions: { key: ActionKey; label: string }[] = [
        { key: 'read', label: 'Lire' },
        { key: 'create', label: 'Créer' },
        { key: 'update', label: 'Modifier' },
        { key: 'delete', label: 'Supprimer' },
    ];

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            const numericId = parseInt(id, 10);
            if (!isNaN(numericId)) {
                this.userService.getUserById(numericId).subscribe({
                    next: (data) => {
                        if (data) {
                            this.user = data;
                            // Load permissions for this user (admin only)
                            if (this.isAdmin()) {
                                this.loadPermissions(numericId);
                            }
                        } else {
                            this.router.navigate(['/users']);
                        }
                    },
                    error: () => this.router.navigate(['/users'])
                });
            } else {
                this.router.navigate(['/users']);
            }
        }
    }

    private loadPermissions(userId: number) {
        this.userRightsService.getUserRights(userId).subscribe({
            next: (perms) => this.permissions.set(perms),
            error: (err) => console.error('Failed to load permissions', err)
        });
    }

    getPermission(module: ModuleKey, action: ActionKey): boolean {
        const perms = this.permissions();
        return perms ? (perms[module] as ModulePermissions)[action] : false;
    }

    togglePermission(module: ModuleKey, action: ActionKey, checked: boolean) {
        if (!this.isAdmin() || !this.user) return;
        const current = this.permissions();
        const defaultModule: ModulePermissions = { read: false, create: false, update: false, delete: false };
        const updated: UserPermissions = {
            coffees: { ...defaultModule, ...(current?.coffees ?? {}) },
            audits: { ...defaultModule, ...(current?.audits ?? {}) },
            users: { ...defaultModule, ...(current?.users ?? {}) },
            categories: { ...defaultModule, ...(current?.categories ?? {}) },
            questions: { ...defaultModule, ...(current?.questions ?? {}) },
        };

        (updated[module] as any)[action] = checked;

        // Auto-logic:
        // - Enabling create/update/delete also enables read
        // - Disabling read also disables create, update, delete
        if (checked && action !== 'read') {
            (updated[module] as any)['read'] = true;
        }
        if (!checked && action === 'read') {
            (updated[module] as any)['create'] = false;
            (updated[module] as any)['update'] = false;
            (updated[module] as any)['delete'] = false;
        }

        this.permissions.set(updated);
    }

    savePermissions() {
        if (!this.user || !this.isAdmin()) return;
        const perms = this.permissions();
        if (!perms) return;

        this.savingPermissions.set(true);
        this.userRightsService.updateUserRights(this.user.id, perms).subscribe({
            next: (saved) => {
                this.permissions.set(saved);
                this.savingPermissions.set(false);
                this.snackBar.open('Permissions mises à jour', 'Fermer', { duration: 3000 });
            },
            error: () => {
                this.savingPermissions.set(false);
                this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
            }
        });
    }

    goBack() {
        this.router.navigate(['/users']);
    }

    editUser() {
        if (!this.user) return;
        this.dialog.open(UserDialogComponent, {
            width: '600px',
            data: this.user
        }).afterClosed().subscribe(result => {
            if (result) {
                this.userService.updateUser(this.user!.id, result).subscribe({
                    next: (updated) => {
                        this.user = updated;
                        this.snackBar.open('Utilisateur mis à jour', 'Fermer', { duration: 3000 });
                    },
                    error: () => this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 })
                });
            }
        });
    }

    resetPassword() {
        if (!this.user) return;
        this.dialog.open(ResetPasswordDialogComponent, {
            width: '400px',
            data: this.user
        });
    }

    deleteUser() {
        if (!this.user) return;
        if (confirm(`Supprimer l'utilisateur "${this.user.full_name}" ? Cette action est irréversible.`)) {
            this.userService.deleteUser(this.user.id).subscribe({
                next: () => {
                    this.snackBar.open('Utilisateur supprimé', 'Fermer', { duration: 3000 });
                    this.router.navigate(['/users']);
                },
                error: () => this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 3000 })
            });
        }
    }

    toggleActive() {
        if (!this.user) return;
        const newStatus = !this.user.is_active;
        this.userService.updateUser(this.user.id, { is_active: newStatus }).subscribe({
            next: (updated) => {
                this.user = updated;
                this.snackBar.open(
                    newStatus ? 'Utilisateur activé' : 'Utilisateur désactivé',
                    'Fermer', { duration: 3000 }
                );
            },
            error: () => this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 })
        });
    }
    updateNotificationPreference(preference: 'receive_daily_report' | 'receive_weekly_report' | 'receive_monthly_report', value: boolean) {
        if (!this.user) return;
        this.user[preference] = value;

        this.userService.updateUser(this.user.id, { [preference]: value }).subscribe({
            next: () => {
                this.snackBar.open('Préférence de notification mise à jour', 'Fermer', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error updating preference', err);
                if (this.user) {
                    this.user[preference] = !value;
                }
                this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000, panelClass: ['error-snackbar'] });
            }
        });
    }
}

import { Component, inject, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, NgIf, Location } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Observable } from 'rxjs';
import { map, shareReplay, filter } from 'rxjs/operators';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { UserRole, getRoleDisplayName } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordDialogComponent } from '../../features/users/change-password-dialog/change-password-dialog.component';

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.css'],
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatSidenavModule,
        MatListModule,
        MatIconModule,
        MatMenuModule,
        MatBadgeModule,
        MatTooltipModule,
        MatDividerModule,
        AsyncPipe,
        NgIf,
        RouterOutlet,
        RouterLink,
        RouterLinkActive
    ]
})
export class NavComponent {
    private breakpointObserver = inject(BreakpointObserver);
    private router = inject(Router);
    private authService = inject(AuthService);
    themeService = inject(ThemeService);
    private dialog = inject(MatDialog);
    private location = inject(Location);

    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
        .pipe(
            map(result => result.matches),
            shareReplay()
        );

    currentUser = this.authService.currentUser;
    isAdmin = this.authService.isAdmin;

    /** Sidebar is shown for ALL authenticated users */
    showSidebar = computed(() => !!this.currentUser());

    sidebarMode = computed(() => this.currentUser()?.role ?? null);

    /** True for ADMIN role */
    isAdminRole = computed(() => this.currentUser()?.role === UserRole.ADMIN);

    /** Cafés visible if admin OR has coffees.read permission */
    canSeeCoffees = computed(() => {
        if (this.isAdmin()) return true;
        return !!this.currentUser()?.permissions?.coffees?.read;
    });

    /** Schedules visible to ADMIN, BOSS, CONTROLLER, and MANAGER */
    canSeeSchedules = computed(() => {
        const role = this.currentUser()?.role;
        return role ? [UserRole.ADMIN, UserRole.BOSS, UserRole.CONTROLLER, UserRole.MANAGER].includes(role) : false;
    });

    /** Audits visible to anyone except CONTROLLER in sidebar */
    canSeeAudits = computed(() => {
        const role = this.currentUser()?.role;
        return role ? role !== UserRole.CONTROLLER : false;
    });

    /** Grille d'Audit visible if admin OR has categories/questions read permission */
    canSeeSettings = computed(() => {
        if (this.isAdmin()) return true;
        const p = this.currentUser()?.permissions;
        return !!(p?.categories?.read || p?.questions?.read);
    });

    roleDisplay = computed(() => {
        const user = this.currentUser();
        return user ? getRoleDisplayName(user.role) : '';
    });

    /** First letter of user name for avatar circle */
    userInitials = computed(() => {
        const user = this.currentUser();
        if (!user) return '?';
        const name = user.full_name || user.email || '';
        return name.charAt(0).toUpperCase();
    });

    pageTitle = 'Dashboard';

    constructor() {
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd)
        ).subscribe(() => {
            this.updatePageTitle();
        });
    }

    toggleDarkMode() {
        this.themeService.toggleTheme();
    }

    private updatePageTitle() {
        const url = this.router.url;

        if (url.includes('/dashboard')) {
            this.pageTitle = 'Dashboard';
        } else if (url.includes('/audits')) {
            this.pageTitle = 'Audits';
        } else if (url.includes('/users')) {
            this.pageTitle = 'Utilisateurs';
        } else if (url.includes('/coffees')) {
            this.pageTitle = 'Cafés';
        } else if (url.includes('/schedules')) {
            this.pageTitle = 'Horaires d\'Ouverture';
        } else if (url.includes('/settings')) {
            this.pageTitle = "Grille d'Audit";
        } else {
            this.pageTitle = 'Caribou Coffee';
        }
    }

    logout() {
        this.authService.logout();
    }

    resetAndReload() {
        if (confirm('Voulez-vous réinitialiser la session et recharger la page ?')) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        }
    }

    openChangePasswordDialog() {

        this.dialog.open(ChangePasswordDialogComponent, { width: '400px' });
    }

    goBack() {
        // If the previous URL was login (or there is no previous URL), go to dashboard
        const state = this.location.getState() as { navigationId?: number };
        if (state?.navigationId && state.navigationId <= 1) {
            this.router.navigate(['/dashboard']);
        } else {
            this.location.back();
        }
    }
}

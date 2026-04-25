import { Component, inject, computed, isDevMode } from '@angular/core';
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
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { UserRole, getRoleDisplayName } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChangePasswordDialogComponent } from '../../features/users/change-password-dialog/change-password-dialog.component';
import { PwaInstallIosDialogComponent } from '../pwa-install-ios-dialog/pwa-install-ios-dialog.component';

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
    pwaInstall = inject(PwaInstallService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
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

    async installPwa() {
        if (this.pwaInstall.isIosSafari) {
            this.dialog.open(PwaInstallIosDialogComponent, { width: '420px', autoFocus: false });
            return;
        }

        if (this.pwaInstall.isIos) {
            // iOS Chrome/Firefox can't install PWAs — direct user to Safari.
            this.snackBar.open(
                "Sur iOS, ouvrez ce site dans Safari pour installer l'application",
                'OK',
                { duration: 5000 }
            );
            return;
        }

        if (this.pwaInstall.canInstall()) {
            const outcome = await this.pwaInstall.promptInstall();
            if (outcome === 'accepted') {
                this.snackBar.open('Application installée', 'OK', { duration: 3000 });
            } else if (outcome === 'dismissed') {
                this.snackBar.open('Installation annulée', 'OK', { duration: 2000 });
            }
            return;
        }

        // No native prompt fired yet. Common reasons:
        //   - Dev mode (service worker is disabled, so PWA criteria aren't met)
        //   - Browser doesn't support PWA install (Firefox desktop)
        //   - Site is served over HTTP (not HTTPS) in production
        //   - First page load — Chrome may need a few seconds + user engagement before firing the event
        const msg = isDevMode()
            ? "Installation indisponible en mode développement. Lancez une build de production pour tester."
            : "L'installation n'est pas disponible sur ce navigateur. Essayez Chrome, Edge ou Safari (iOS).";
        this.snackBar.open(msg, 'OK', { duration: 5000 });
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

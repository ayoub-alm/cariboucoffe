import { Component, inject, signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe, NgIf } from '@angular/common';
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

@Component({
    selector: 'app-nav',
    templateUrl: './nav.component.html',
    styleUrls: ['./nav.component.css'],
    standalone: true,
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

    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
        .pipe(
            map(result => result.matches),
            shareReplay()
        );

    // User information
    currentUser = this.authService.currentUser;

    // Notifications
    notificationCount = 2;

    // Page title
    pageTitle = 'Dashboard';

    constructor() {
        // Update page title based on route
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
        } else if (url.includes('/settings')) {
            this.pageTitle = 'Paramètres';
        } else {
            this.pageTitle = 'Caribou Coffee';
        }
    }

    logout() {
        this.authService.logout();
    }
}

import { Component, inject, computed } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole } from '../../../core/models/user.model';
import { DashboardComponent } from '../dashboard.component';
import { AuditorDashboardComponent } from '../auditor-dashboard/auditor-dashboard.component';
import { ManagerDashboardComponent } from '../manager-dashboard/manager-dashboard.component';
import { BossDashboardComponent } from '../boss-dashboard/boss-dashboard.component';
import { ViewerDashboardComponent } from '../viewer-dashboard/viewer-dashboard.component';
import { ControllerDashboardComponent } from '../controller-dashboard/controller-dashboard.component';

@Component({
    selector: 'app-role-dashboard',
    standalone: true,
    imports: [
        DashboardComponent,
        AuditorDashboardComponent,
        ManagerDashboardComponent,
        BossDashboardComponent,
        ViewerDashboardComponent,
        ControllerDashboardComponent
    ],
    template: `
        @switch (userRole()) {
            @case ('ADMIN') {
                <app-dashboard />
            }
            @case ('AUDITOR') {
                <app-auditor-dashboard />
            }
            @case ('MANAGER') {
                <app-manager-dashboard />
            }
            @case ('BOSS') {
                <app-boss-dashboard />
            }
            @case ('VIEWER') {
                <app-viewer-dashboard />
            }
            @case ('CONTROLLER') {
                <app-controller-dashboard />
            }
            @default {
                <app-viewer-dashboard />
            }
        }
    `
})
export class RoleDashboardComponent {
    private authService = inject(AuthService);
    userRole = computed(() => this.authService.currentUser()?.role ?? UserRole.VIEWER);
}

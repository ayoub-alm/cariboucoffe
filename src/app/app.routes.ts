import { Routes } from '@angular/router';
import { NavComponent } from './layout/nav/nav.component';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: NavComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'audits/new', loadComponent: () => import('./features/audit/audit-stepper/audit-stepper.component').then(m => m.AuditStepperComponent) },
            { path: 'audits/:id', loadComponent: () => import('./features/audit/audit-details/audit-details.component').then(m => m.AuditDetailsComponent) },
            { path: 'audits', loadComponent: () => import('./features/audit/audit-list/audit-list.component').then(m => m.AuditListComponent) },
            { path: 'users/:id', loadComponent: () => import('./features/users/user-details/user-details.component').then(m => m.UserDetailsComponent) },
            { path: 'users', loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent) },
            { path: 'settings', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
        ]
    },
    { path: '**', redirectTo: 'login' }
];

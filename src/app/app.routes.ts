import { Routes } from '@angular/router';
import { NavComponent } from './layout/nav/nav.component';
import { LoginComponent } from './features/auth/login/login.component';

import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: NavComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'audits/new', loadComponent: () => import('./features/audit/audit-stepper/audit-stepper.component').then(m => m.AuditStepperComponent) },
            { path: 'audits/:id', loadComponent: () => import('./features/audit/audit-details/audit-details.component').then(m => m.AuditDetailsComponent) },
            { path: 'audits', loadComponent: () => import('./features/audit/audit-list/audit-list.component').then(m => m.AuditListComponent) },
            { path: 'users/:id', loadComponent: () => import('./features/users/user-details/user-details.component').then(m => m.UserDetailsComponent) },
            { path: 'users', loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent) },
            { path: 'coffees', loadComponent: () => import('./features/coffees/coffee-list/coffee-list.component').then(m => m.CoffeeListComponent) },
            { path: 'notifications', loadComponent: () => import('./features/notifications/notification-manager/notification-manager.component').then(m => m.NotificationManagerComponent) },
            { path: 'kpi', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
            { path: 'settings/categories', loadComponent: () => import('./features/settings/categories-list/categories-list').then(m => m.CategoriesListComponent) },
            { path: 'settings/questions/:id', loadComponent: () => import('./features/settings/questions-list/questions-list').then(m => m.QuestionsListComponent) },
            { path: 'settings', redirectTo: 'settings/categories', pathMatch: 'full' },
        ]
    },
    { path: '**', redirectTo: 'login' }
];

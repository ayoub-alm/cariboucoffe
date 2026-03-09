import { Routes } from '@angular/router';
import { NavComponent } from './layout/nav/nav.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        component: NavComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent)
            },
            {
                path: 'audits/new',
                loadComponent: () => import('./features/audit/audit-stepper/audit-stepper.component').then(m => m.AuditStepperComponent),
                canActivate: [roleGuard(UserRole.ADMIN, UserRole.AUDITOR)]
            },
            {
                path: 'audits/:id/edit',
                loadComponent: () => import('./features/audit/audit-stepper/audit-stepper.component').then(m => m.AuditStepperComponent),
                canActivate: [roleGuard(UserRole.ADMIN, UserRole.AUDITOR)]
            },
            {
                path: 'audits/:id',
                loadComponent: () => import('./features/audit/audit-details/audit-details.component').then(m => m.AuditDetailsComponent)
            },
            {
                path: 'audits',
                loadComponent: () => import('./features/audit/audit-list/audit-list.component').then(m => m.AuditListComponent)
            },
            {
                path: 'users/:id',
                loadComponent: () => import('./features/users/user-details/user-details.component').then(m => m.UserDetailsComponent),
                canActivate: [roleGuard(UserRole.ADMIN)]
            },
            {
                path: 'users',
                loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
                canActivate: [roleGuard(UserRole.ADMIN)]
            },
            {
                path: 'coffees',
                loadComponent: () => import('./features/coffees/coffee-list/coffee-list.component').then(m => m.CoffeeListComponent),
                canActivate: [roleGuard(UserRole.ADMIN)]
            },
            {
                path: 'kpi',
                loadComponent: () => import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
                canActivate: [roleGuard(UserRole.ADMIN, UserRole.MANAGER, UserRole.BOSS)]
            },
            {
                path: 'settings/categories',
                loadComponent: () => import('./features/settings/categories-list/categories-list').then(m => m.CategoriesListComponent),
                canActivate: [roleGuard(UserRole.ADMIN)]
            },
            {
                path: 'settings/questions/:id',
                loadComponent: () => import('./features/settings/questions-list/questions-list').then(m => m.QuestionsListComponent),
                canActivate: [roleGuard(UserRole.ADMIN)]
            },
            {
                path: 'settings',
                redirectTo: 'settings/categories',
                pathMatch: 'full'
            },
        ]
    },
    { path: '**', redirectTo: 'login' }
];

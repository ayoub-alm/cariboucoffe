import { Routes } from '@angular/router';
import { NavComponent } from './layout/nav/nav.component';
import { LoginComponent } from './features/auth/login/login.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { permissionGuard } from './core/guards/permission.guard';
import { UserRole } from './core/models/user.model';
import { noAuthGuard } from './core/guards/no-auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent, canActivate: [noAuthGuard] },
    {
        path: '',
        component: NavComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

            // ── Dashboard — anyone authenticated ──────────────────────────
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent)
            },

            // ── Audits — anyone authenticated can read; ADMIN + AUDITOR can create/edit ──
            {
                path: 'audits/new',
                loadComponent: () => import('./features/audit/audit-stepper/audit-stepper.component').then(m => m.AuditStepperComponent),
                canActivate: [permissionGuard({ module: 'audits', action: 'create' })]
            },
            {
                path: 'audits/:id/edit',
                loadComponent: () => import('./features/audit/audit-stepper/audit-stepper.component').then(m => m.AuditStepperComponent),
                canActivate: [permissionGuard({ module: 'audits', action: 'update' })]
            },
            {
                path: 'audits/:id',
                loadComponent: () => import('./features/audit/audit-details/audit-details.component').then(m => m.AuditDetailsComponent)
            },
            {
                path: 'audits',
                loadComponent: () => import('./features/audit/audit-list/audit-list.component').then(m => m.AuditListComponent)
            },

            // ── Users — ADMIN or users.read permission ──────────────────────────
            {
                path: 'users/:id',
                loadComponent: () => import('./features/users/user-details/user-details.component').then(m => m.UserDetailsComponent),
                canActivate: [permissionGuard({ module: 'users', action: 'update' })]
            },
            {
                path: 'users',
                loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent),
                canActivate: [permissionGuard({ module: 'users', action: 'read' })]
            },

            // ── Coffees — ADMIN or coffees.read permission ───────────────
            {
                path: 'coffees',
                loadComponent: () => import('./features/coffees/coffee-list/coffee-list.component').then(m => m.CoffeeListComponent),
                canActivate: [permissionGuard({ module: 'coffees', action: 'read' })]
            },

            // ── KPI ───────────────────────────────────────────────────────
            {
                path: 'kpi',
                loadComponent: () => import('./features/dashboard/role-dashboard/role-dashboard.component').then(m => m.RoleDashboardComponent),
                canActivate: [roleGuard(UserRole.ADMIN, UserRole.MANAGER, UserRole.BOSS)]
            },

            // ── Settings/Categories — ADMIN or categories.read OR questions.read ──
            {
                path: 'settings/categories',
                loadComponent: () => import('./features/settings/categories-list/categories-list').then(m => m.CategoriesListComponent),
                canActivate: [permissionGuard(
                    { module: 'categories', action: 'read' },
                    { module: 'questions', action: 'read' }
                )]
            },
            {
                path: 'settings/questions/:id',
                loadComponent: () => import('./features/settings/questions-list/questions-list').then(m => m.QuestionsListComponent),
                canActivate: [permissionGuard(
                    { module: 'categories', action: 'read' },
                    { module: 'questions', action: 'read' }
                )]
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

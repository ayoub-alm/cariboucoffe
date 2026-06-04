import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CoffeeService } from '../../../core/services/coffee.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuditService } from '../../../core/services/audit.service';
import { UserService } from '../../../core/services/user.service';

import { Coffee } from '../../../core/models/coffee.model';
import { Category } from '../../../core/models/category.model';
import { UserRole } from '../../../core/models/user.model';

export interface DashboardFilters {
  startDate: Date | null;
  endDate: Date | null;
  coffeeShop: string | null;
  auditorName: string | null;
  categoryName: string | null;
}

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="filter-container">
      <mat-form-field appearance="outline" class="filter-field date-range">
        <mat-label>Période (Début - Fin)</mat-label>
        <mat-date-range-input [rangePicker]="picker">
          <input matStartDate placeholder="Date début" [(ngModel)]="filters.startDate" (dateChange)="onFilterChange()">
          <input matEndDate placeholder="Date fin" [(ngModel)]="filters.endDate" (dateChange)="onFilterChange()">
        </mat-date-range-input>
        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-date-range-picker #picker></mat-date-range-picker>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Café</mat-label>
        <mat-select [(ngModel)]="filters.coffeeShop" (selectionChange)="onFilterChange()">
          <mat-option [value]="null">Tous les cafés</mat-option>
          <mat-option *ngFor="let coffee of coffees" [value]="coffee.name">
            {{ coffee.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-field">
        <mat-label>Auditeur</mat-label>
        <mat-select [(ngModel)]="filters.auditorName" (selectionChange)="onFilterChange()">
          <mat-option [value]="null">Tous les auditeurs</mat-option>
          <mat-option *ngFor="let auditor of auditors" [value]="auditor">
            {{ auditor }}
          </mat-option>
        </mat-select>
      </mat-form-field>


      
      <button mat-icon-button color="warn" (click)="resetFilters()" matTooltip="Réinitialiser les filtres" *ngIf="hasActiveFilters()">
         <mat-icon>clear</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .filter-container {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
      align-items: center;
      background: var(--surface);
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: var(--shadow-sm);
    }
    .filter-field {
      flex: 1 1 200px;
      margin-bottom: -1.25em; /* Remove extra space from material fields */
    }
    .date-range {
      flex: 1 1 300px;
    }
  `]
})
export class FilterBarComponent implements OnInit {
  @Output() filterChanged = new EventEmitter<DashboardFilters>();

  private coffeeService = inject(CoffeeService);
  private categoryService = inject(CategoryService);
  private auditService = inject(AuditService);
  private userService = inject(UserService);

  coffees: Coffee[] = [];
  auditors: string[] = [];
  categories: Category[] = [];

  filters: DashboardFilters = {
    startDate: null,
    endDate: null,
    coffeeShop: null,
    auditorName: null,
    categoryName: null
  };

  ngOnInit() {
    // Default to last month
    const now = new Date();
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    this.filters.startDate = firstDayLastMonth;
    this.filters.endDate = lastDayLastMonth;

    this.categoryService.getCategories().subscribe(c => this.categories = c);
    
    // Load ALL coffees from database
    this.coffeeService.getCoffees().subscribe(coffees => {
      this.coffees = coffees;
    });

    // Load ALL auditors from database
    this.userService.getUsers().subscribe(users => {
      const allowedRoles = [UserRole.AUDITOR, UserRole.ADMIN, UserRole.BOSS];
      const filteredUsers = users.filter(u => allowedRoles.includes(u.role));
      this.auditors = filteredUsers.map(u => u.full_name || u.email).filter(Boolean);
    });

    // Emit the default filter so dashboards load last month's data immediately
    setTimeout(() => this.onFilterChange(), 0);
  }

  onFilterChange() {
    this.filterChanged.emit({ ...this.filters });
  }

  hasActiveFilters(): boolean {
    return this.filters.startDate !== null ||
           this.filters.endDate !== null ||
           this.filters.coffeeShop !== null ||
           this.filters.auditorName !== null;
  }

  resetFilters() {
    this.filters = {
      startDate: null,
      endDate: null,
      coffeeShop: null,
      auditorName: null,
      categoryName: null
    };
    this.onFilterChange();
  }
}

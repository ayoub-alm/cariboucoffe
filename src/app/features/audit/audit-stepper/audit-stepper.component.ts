import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { provideAnimations } from '@angular/platform-browser/animations';

import { AUDIT_CATEGORIES_TEMPLATE, Audit, AuditCategory } from '../../../core/models/audit.model';
import { QuestionItemComponent } from '../components/question-item/question-item.component';
import { AuditSummaryComponent } from '../components/audit-summary/audit-summary.component';
import { AuditService } from '../../../core/services/audit.service';

@Component({
    selector: 'app-audit-stepper',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatStepperModule,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule, // Usually implicit with provideNativeDateAdapter
        MatIconModule,
        QuestionItemComponent,
        AuditSummaryComponent
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './audit-stepper.component.html',
    styleUrl: './audit-stepper.component.css'
})
export class AuditStepperComponent {
    private fb = inject(FormBuilder);
    private auditService = inject(AuditService);

    auditForm: FormGroup;
    auditCategories = AUDIT_CATEGORIES_TEMPLATE;

    constructor() {
        this.auditForm = this.fb.group({
            info: this.fb.group({
                auditor: ['', Validators.required],
                coffeeShop: ['', Validators.required],
                shift: ['AM', Validators.required],
                date: [new Date(), Validators.required],
                staffPresent: ['', Validators.required]
            }),
            categories: this.fb.array([]),
            conclusion: this.fb.group({
                actionsCorrectives: [''],
                trainingNeeds: [''],
                purchases: ['']
            })
        });

        this.initCategories();
    }

    get itemsArray(): FormArray {
        return this.categoriesArray.at(0).get('items')! as FormArray; // purely helpers
    }

    get infoGroup(): FormGroup {
        return this.auditForm.get('info')! as FormGroup;
    }

    get conclusionGroup(): FormGroup {
        return this.auditForm.get('conclusion')! as FormGroup;
    }

    get categoriesArray(): FormArray {
        return this.auditForm.get('categories')! as FormArray;
    }

    getCategoryGroup(index: number): FormGroup {
        return this.categoriesArray.at(index) as FormGroup;
    }

    getItemsArray(catIndex: number): FormArray {
        return this.getCategoryGroup(catIndex).get('items')! as FormArray;
    }

    getItemGroup(catIndex: number, itemIndex: number): FormGroup {
        return this.getItemsArray(catIndex).at(itemIndex) as FormGroup;
    }

    private initCategories() {
        this.auditCategories.forEach(cat => {
            const catGroup = this.fb.group({
                id: [cat.id],
                items: this.fb.array([])
            });

            const itemsArray = catGroup.get('items') as FormArray;
            cat.items.forEach(item => {
                const itemGroup = this.fb.group({
                    id: [item.id],
                    status: [null, Validators.required], // Required to answer 'oui', 'non', or 'n/a'
                    remarks: [''] // Conditional validation handled in component or dynamically?
                    // It's handled in QuestionItemComponent via template error, but Form Control validation needs to be set if we want the STEP to be invalid.
                    // I will add a validator hook or relying on QuestionItemComponent logic.
                    // To strictly enforce: listen to status changes.
                });

                // Add dynamic validator for remarks if status is 'non'
                itemGroup.get('status')?.valueChanges.subscribe(val => {
                    const remarksCtrl = itemGroup.get('remarks');
                    if (val === 'non') {
                        remarksCtrl?.setValidators([Validators.required]);
                    } else {
                        remarksCtrl?.clearValidators();
                    }
                    remarksCtrl?.updateValueAndValidity();
                });

                itemsArray.push(itemGroup);
            });

            this.categoriesArray.push(catGroup);
        });
    }

    submitAudit() {
        if (this.auditForm.invalid) {
            // Should mark all as touched
            this.auditForm.markAllAsTouched();
            return;
        }

        const formVal = this.auditForm.getRawValue();
        // Here we would map formVal back to Audit model and call service
        console.log('Audit Submitted:', formVal);
        // TODO: Map to Audit interface and save
    }
}

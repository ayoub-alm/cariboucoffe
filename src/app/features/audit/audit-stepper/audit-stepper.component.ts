import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

import { AuditUI as Audit, AuditCategory } from '../../../core/models/audit.model';
import { QuestionItemComponent } from '../components/question-item/question-item.component';
import { AuditSummaryComponent } from '../components/audit-summary/audit-summary.component';
import { AuditService } from '../../../core/services/audit.service';
import { CoffeeService } from '../../../core/services/coffee.service';
import { AuthService } from '../../../core/services/auth.service';

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
        MatNativeDateModule,
        MatIconModule,
        QuestionItemComponent,
        AuditSummaryComponent,
        AsyncPipe
    ],
    providers: [provideNativeDateAdapter()],
    templateUrl: './audit-stepper.component.html',
    styleUrl: './audit-stepper.component.css'
})
export class AuditStepperComponent {
    private fb = inject(FormBuilder);
    private auditService = inject(AuditService);
    private coffeeService = inject(CoffeeService);
    private authService = inject(AuthService);
    private router = inject(Router);

    auditForm!: FormGroup;
    auditCategories: AuditCategory[] = [];
    isLoadingCategories = true;

    coffees$ = this.coffeeService.getCoffees();

    // Photo handling
    selectedFileName: string | null = null;
    photoPreview: string | null = null;
    photoData: string | null = null;
    isCompressing = false;

    constructor() {
        const currentUser = this.authService.currentUser();
        const auditorName = currentUser?.full_name || currentUser?.email || '';

        this.auditForm = this.fb.group({
            info: this.fb.group({
                auditor: [{ value: auditorName, disabled: true }, Validators.required],
                coffeeShop: [null, Validators.required],
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

        // Fetch categories from backend
        this.auditService.getAuditTemplate().subscribe({
            next: (categories) => {
                this.auditCategories = categories;
                this.isLoadingCategories = false;
                this.initCategories();
            },
            error: (err) => {
                console.error('Error loading audit template:', err);
                this.isLoadingCategories = false;
            }
        });
    }

    get itemsArray(): FormArray {
        return this.categoriesArray.at(0).get('items')! as FormArray;
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
                    status: [null, Validators.required],
                    remarks: [''],
                    photoData: [null]
                });

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

    onFileSelected(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (file) {
            this.selectedFileName = file.name;
            this.processFile(file);
        }
    }

    processFile(file: File) {
        this.isCompressing = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Strategy: Max dimension 1024px for good balance of quality and size
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);

                // Strategy: JPEG with 0.7 quality - significant size reduction
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                this.photoPreview = dataUrl;
                this.photoData = dataUrl;
                this.isCompressing = false;
            };
        };
        reader.readAsDataURL(file);
    }

    removePhoto() {
        this.selectedFileName = null;
        this.photoPreview = null;
        this.photoData = null;
    }

    submitAudit() {
        if (this.auditForm.invalid || this.isCompressing) {
            this.auditForm.markAllAsTouched();
            return;
        }

        const formVal = this.auditForm.getRawValue();

        const auditData: Audit = {
            date: formVal.info.date,
            coffeeShop: '',
            coffeeId: formVal.info.coffeeShop,
            auditorName: formVal.info.auditor,
            score: 0,
            shift: formVal.info.shift,
            staffPresent: formVal.info.staffPresent,
            actionsCorrectives: formVal.conclusion.actionsCorrectives,
            trainingNeeds: formVal.conclusion.trainingNeeds,
            purchases: formVal.conclusion.purchases,
            photoData: this.photoData || undefined, // Include the photo data
            categories: this.auditCategories.map((cat, i) => ({
                ...cat,
                items: cat.items.map((item, j) => ({
                    ...item,
                    status: formVal.categories[i].items[j].status,
                    remarks: formVal.categories[i].items[j].remarks,
                    photoData: formVal.categories[i].items[j].photoData
                }))
            }))
        };

        this.auditService.createAudit(auditData).subscribe({
            next: (res) => {
                console.log('Audit Created:', res);
                this.router.navigate(['/audits']);
            },
            error: (err) => console.error('Error creating audit', err)
        });
    }
}

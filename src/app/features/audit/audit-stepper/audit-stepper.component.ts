import { Component, inject, ViewChild, computed, signal } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, ActivatedRoute } from '@angular/router';
import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { debounceTime, filter } from 'rxjs/operators';

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
        MatSnackBarModule,
        MatProgressBarModule,
        MatTooltipModule,
        QuestionItemComponent,
        AuditSummaryComponent,
        AsyncPipe
    ],
    providers: [
        provideNativeDateAdapter(),
        { provide: STEPPER_GLOBAL_OPTIONS, useValue: { showError: true } }
    ],
    templateUrl: './audit-stepper.component.html',
    styleUrl: './audit-stepper.component.css'
})
export class AuditStepperComponent {
    private fb = inject(FormBuilder);
    private auditService = inject(AuditService);
    private coffeeService = inject(CoffeeService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private snackBar = inject(MatSnackBar);

    @ViewChild('stepper') stepper!: MatStepper;

    auditForm!: FormGroup;
    auditCategories: AuditCategory[] = [];
    isLoadingCategories = true;
    isSaving = signal(false);
    editingAuditId: number | null = null;

    coffees$ = this.coffeeService.getCoffees();

    selectedFileName: string | null = null;
    photoPreview: string | null = null;
    photoData: string | null = null;
    isCompressing = false;

    answeredCount = signal(0);
    totalQuestions = signal(0);
    progressPercent = computed(() => {
        const total = this.totalQuestions();
        return total > 0 ? Math.round((this.answeredCount() / total) * 100) : 0;
    });
    allQuestionsAnswered = computed(() => {
        const total = this.totalQuestions();
        return total > 0 && this.answeredCount() === total;
    });

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

        this.auditService.getAuditTemplate().subscribe({
            next: (categories) => {
                this.auditCategories = categories;
                this.isLoadingCategories = false;
                this.initCategories();
                this.totalQuestions.set(categories.reduce((sum, c) => sum + c.items.length, 0));

                const editId = this.route.snapshot.paramMap.get('id');
                if (editId) {
                    this.loadExistingAudit(+editId);
                }
            },
            error: (err) => {
                console.error('Error loading audit template:', err);
                this.isLoadingCategories = false;
            }
        });

        // Real-time update auto-save
        this.auditForm.valueChanges.pipe(
            debounceTime(2000),
            filter(() => !!this.infoGroup.get('coffeeShop')?.value && !this.isSaving())
        ).subscribe(() => {
            this.silentAutoSave();
        });
    }

    private loadExistingAudit(id: number) {
        this.auditService.getAudit(id).subscribe({
            next: (audit) => {
                this.editingAuditId = id;
                this.infoGroup.patchValue({
                    coffeeShop: audit.coffeeId,
                    shift: audit.shift || 'AM',
                    date: audit.date,
                    staffPresent: audit.staffPresent || ''
                });

                if (audit.actionsCorrectives || audit.trainingNeeds || audit.purchases) {
                    this.conclusionGroup.patchValue({
                        actionsCorrectives: audit.actionsCorrectives || '',
                        trainingNeeds: audit.trainingNeeds || '',
                        purchases: audit.purchases || ''
                    });
                }

                if (audit.photoUrl) {
                    this.photoPreview = audit.photoUrl;
                }

                if (audit.categories?.length) {
                    for (const savedCat of audit.categories) {
                        const catIdx = this.auditCategories.findIndex(c => c.name === savedCat.name);
                        if (catIdx === -1) continue;
                        for (const savedItem of savedCat.items) {
                            const itemIdx = this.auditCategories[catIdx].items.findIndex(
                                q => q.backendId === savedItem.backendId
                            );
                            if (itemIdx === -1) continue;
                            const itemGroup = this.getItemGroup(catIdx, itemIdx);
                            itemGroup.patchValue({
                                status: savedItem.status,
                                remarks: savedItem.remarks || ''
                            });
                        }
                    }
                    this.recalcProgress();
                }
            },
            error: (err) => console.error('Error loading audit for edit:', err)
        });
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

    getCategoryAnsweredCount(catIndex: number): number {
        const items = this.getItemsArray(catIndex);
        let count = 0;
        for (let i = 0; i < items.length; i++) {
            const val = items.at(i).get('status')?.value;
            if (val && val !== 'null' && val !== 'undefined') count++;
        }
        return count;
    }

    getCategoryTotalCount(catIndex: number): number {
        return this.getItemsArray(catIndex).length;
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
                    status: [null],
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
                    this.recalcProgress();
                });

                itemsArray.push(itemGroup);
            });

            this.categoriesArray.push(catGroup);
        });
    }

    private recalcProgress() {
        let answered = 0;
        for (let i = 0; i < this.categoriesArray.length; i++) {
            const items = this.getItemsArray(i);
            for (let j = 0; j < items.length; j++) {
                const val = items.at(j).get('status')?.value;
                if (val && val !== 'null' && val !== 'undefined') answered++;
            }
        }
        this.answeredCount.set(answered);
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
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                } else {
                    if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
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

    private buildAuditData(workflowStatus: 'IN_PROGRESS' | 'COMPLETED'): Audit {
        const formVal = this.auditForm.getRawValue();
        return {
            id: this.editingAuditId ?? undefined,
            date: formVal.info.date,
            coffeeShop: '',
            coffeeId: formVal.info.coffeeShop,
            auditorName: formVal.info.auditor,
            score: 0,
            workflowStatus,
            shift: formVal.info.shift,
            staffPresent: formVal.info.staffPresent,
            actionsCorrectives: formVal.conclusion.actionsCorrectives,
            trainingNeeds: formVal.conclusion.trainingNeeds,
            purchases: formVal.conclusion.purchases,
            photoData: this.photoData || undefined,
            categories: this.auditCategories.map((cat, i) => ({
                ...cat,
                items: cat.items.map((item, j) => ({
                    ...item,
                    status: formVal.categories[i]?.items[j]?.status ?? null,
                    remarks: formVal.categories[i]?.items[j]?.remarks ?? '',
                    photoData: formVal.categories[i]?.items[j]?.photoData
                }))
            }))
        };
    }

    saveDraft() {
        if (!this.infoGroup.get('coffeeShop')?.value) {
            this.snackBar.open('Veuillez sélectionner un café avant de sauvegarder', 'OK', { duration: 3000 });
            return;
        }

        this.isSaving.set(true);
        const auditData = this.buildAuditData('IN_PROGRESS');

        const obs = this.editingAuditId
            ? this.auditService.updateAudit(this.editingAuditId, auditData)
            : this.auditService.createAudit(auditData);

        obs.subscribe({
            next: (res) => {
                this.editingAuditId = res.id;
                this.isSaving.set(false);
                this.snackBar.open('Brouillon sauvegardé', 'OK', { duration: 2000 });
            },
            error: (err) => {
                this.isSaving.set(false);
                console.error('Error saving draft:', err);
                this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
            }
        });
    }

    silentAutoSave() {
        const auditData = this.buildAuditData('IN_PROGRESS');
        const obs = this.editingAuditId
            ? this.auditService.updateAudit(this.editingAuditId, auditData)
            : this.auditService.createAudit(auditData);

        obs.subscribe({
            next: (res) => {
                this.editingAuditId = res.id;
                // Silently saved
            },
            error: (err) => console.error('AutoSave failed:', err)
        });
    }

    submitAudit() {
        if (!this.allQuestionsAnswered()) {
            this.snackBar.open(
                `Veuillez répondre à toutes les questions (${this.answeredCount()}/${this.totalQuestions()})`,
                'OK', { duration: 4000 }
            );
            return;
        }

        if (this.infoGroup.invalid) {
            this.infoGroup.markAllAsTouched();
            this.snackBar.open('Veuillez compléter les informations générales', 'OK', { duration: 3000 });
            return;
        }

        if (this.isCompressing) return;

        this.isSaving.set(true);
        const auditData = this.buildAuditData('COMPLETED');

        const obs = this.editingAuditId
            ? this.auditService.updateAudit(this.editingAuditId, auditData)
            : this.auditService.createAudit(auditData);

        obs.subscribe({
            next: () => {
                this.isSaving.set(false);
                this.snackBar.open('Audit validé avec succès', 'OK', { duration: 3000 });
                this.router.navigate(['/audits']);
            },
            error: (err) => {
                this.isSaving.set(false);
                console.error('Error submitting audit:', err);
                this.snackBar.open('Erreur lors de la validation', 'Fermer', { duration: 3000 });
            }
        });
    }
}

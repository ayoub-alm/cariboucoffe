/**
 * Category and Question Models - Audit configuration
 */

/** Audit category */
export interface Category {
    id: number;
    name: string;
    description?: string;
    total_score?: number;
}

/** Category creation payload */
export interface CategoryCreate {
    name: string;
    description?: string;
}

/** Category update payload */
export interface CategoryUpdate {
    name?: string;
    description?: string;
}

/** Audit question */
export interface Question {
    id: number;
    text: string;
    weight: number;
    category_id: number;
    category?: Category;
    correct_answer: 'oui' | 'non';
    na_score: number;
}

/** Question creation payload */
export interface QuestionCreate {
    text: string;
    weight: number;
    category_id: number;
    correct_answer: 'oui' | 'non';
    na_score: number;
}

/** Question update payload */
export interface QuestionUpdate {
    text?: string;
    weight?: number;
    category_id?: number;
    correct_answer?: 'oui' | 'non';
    na_score?: number;
}

/**
 * Helper functions for categories and questions
 */

/** Validate question weight */
export function isValidWeight(weight: number): boolean {
    return weight > 0 && weight <= 100 && Number.isInteger(weight);
}

/** Validate NA score */
export function isValidNaScore(naScore: number, weight: number): boolean {
    return naScore >= 0 && naScore <= weight && Number.isInteger(naScore);
}

/** Calculate total category score */
export function calculateTotalScore(questions: Question[]): number {
    return questions.reduce((sum, q) => sum + q.weight, 0);
}

/** Get weight badge color */
export function getWeightBadgeColor(weight: number): string {
    if (weight >= 10) return 'error';
    if (weight >= 5) return 'warning';
    return 'success';
}

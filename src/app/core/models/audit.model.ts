import { User } from './user.model';

/**
 * Backend Models - Direct mapping from API responses
 */

/** Coffee shop entity */
export interface Coffee {
  id: number;
  name: string;
  location: string;
  active: boolean;
}

/** Audit answer from backend */
export interface AuditAnswerDTO {
  question_id: number;
  value: number;
  choice?: 'oui' | 'non' | 'n/a';
  comment?: string;
  photo_url?: string;
  id?: number;
  question?: {
    id: number;
    text: string;
    weight: number;
    correct_answer?: string;
    na_score?: number;
    category_id: number;
    category: {
      id: number;
      name: string;
      description?: string;
    };
  };
}

/** Complete audit from backend */
export interface AuditDTO {
  id: number;
  created_at: string;
  score: number;
  status?: string;
  coffee: Coffee;
  auditor: User;
  answers: AuditAnswerDTO[];
  shift?: string;
  staff_present?: string;
  actions_correctives?: string;
  training_needs?: string;
  purchases?: string;
  photo_url?: string;
}

/** Audit creation payload */
export interface AuditCreateDTO {
  coffee_id: number;
  status?: AuditWorkflowStatus;
  shift?: string;
  staff_present?: string;
  actions_correctives?: string;
  training_needs?: string;
  purchases?: string;
  photo_data?: string[];
  answers: {
    question_id: number;
    value: number;
    choice: 'oui' | 'non' | 'n/a';
    comment?: string;
    photo_data?: string[];
  }[];
}

/**
 * Frontend UI Models - Optimized for display and interaction
 */

/** Audit response types */
export type AuditResponse = 'oui' | 'non' | 'n/a' | null;

/** Backend audit workflow status */
export type AuditWorkflowStatus = 'IN_PROGRESS' | 'COMPLETED';

/** Audit display status derived from score */
export type AuditStatus = 'Conforme' | 'Non-conforme' | 'Partiel';

/** Main audit UI model */
export interface AuditUI {
  id?: number;
  date: Date;
  coffeeShop: string;
  coffeeId?: number;
  auditorName: string;
  score: number;
  categories: AuditCategory[];
  status?: AuditStatus;
  workflowStatus?: AuditWorkflowStatus;
  shift?: string;
  staffPresent?: string;
  actionsCorrectives?: string;
  trainingNeeds?: string;
  purchases?: string;
  photoUrls?: string[];
  photosData?: string[];
}

/** Audit category grouping questions */
export interface AuditCategory {
  id?: string;
  name: string;
  icon?: string;
  items: AuditQuestion[];
  backendId?: number;
  description?: string;
}

/** Individual audit question */
export interface AuditQuestion {
  id?: string;
  label: string;
  status: AuditResponse;
  numericValue?: number;
  remarks?: string;
  photoUrls?: string[];
  photosData?: string[];
  backendId?: number;
  weight?: number;
  correct_answer?: string;
  na_score?: number;
}

/**
 * Helper functions for audit models
 */

/** Calculate audit status from score */
export function getAuditStatus(score: number): AuditStatus {
  if (score >= 90) return 'Conforme';
  if (score >= 70) return 'Partiel';
  return 'Non-conforme';
}

/** Get status color for UI */
export function getStatusColor(status: AuditStatus): string {
  switch (status) {
    case 'Conforme': return 'success';
    case 'Non-conforme': return 'error';
    case 'Partiel': return 'warning';
    default: return 'default';
  }
}

/** Calculate category score */
export function calculateCategoryScore(category: AuditCategory): number {
  if (!category.items || category.items.length === 0) return 0;

  let totalWeight = 0;
  let earnedPoints = 0;

  category.items.forEach(item => {
    if (item.status === 'n/a') return;

    const weight = item.weight || 1;
    totalWeight += weight;

    const correctAnswer = (item.correct_answer || 'oui').toLowerCase();
    if (item.status === correctAnswer) {
      earnedPoints += weight;
    }
  });

  return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 100;
}


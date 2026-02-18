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
  shift?: string;
  staff_present?: string;
  actions_correctives?: string;
  training_needs?: string;
  purchases?: string;
  photo_data?: string;
  answers: {
    question_id: number;
    value: number;
    choice: 'oui' | 'non' | 'n/a';
    comment?: string;
    photo_data?: string;
  }[];
}

/**
 * Frontend UI Models - Optimized for display and interaction
 */

/** Audit response types */
export type AuditResponse = 'oui' | 'non' | 'n/a' | null;

/** Audit status derived from score */
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
  shift?: string;
  staffPresent?: string;
  actionsCorrectives?: string;
  trainingNeeds?: string;
  purchases?: string;
  photoUrl?: string;
  photoData?: string;
}

/** Audit category grouping questions */
export interface AuditCategory {
  id?: string;
  name: string;
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
  photos?: string[];
  photoData?: string;
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

    if (item.status === 'oui') {
      earnedPoints += weight;
    }
  });

  return totalWeight > 0 ? Math.round((earnedPoints / totalWeight) * 100) : 100;
}

/** Template for new audits */
export const AUDIT_CATEGORIES_TEMPLATE: AuditCategory[] = [
  {
    id: 'hygiene',
    name: 'Hygiène & Sécurité',
    items: [
      { id: 'h1', label: 'La zone de préparation est-elle propre et désinfectée ?', status: null, numericValue: 0, backendId: 1 },
      { id: 'h2', label: 'Les plans de travail sont-ils nettoyés entre chaque usage ?', status: null, numericValue: 0, backendId: 2 },
      { id: 'h3', label: 'La technique et la fréquence du lavage de mains sont-elles respectées ?', status: null, numericValue: 0, backendId: 3 },
      { id: 'h4', label: 'Les produits alimentaires sont-ils stockés à la bonne température ?', status: null, numericValue: 0, backendId: 4 },
      { id: 'h5', label: 'Les frigos et congélateurs sont-ils propres, organisés avec thermomètre visible ?', status: null, numericValue: 0, backendId: 5 },
      { id: 'h6', label: 'Absence de produits périmés en stock ou en zone de préparation ?', status: null, numericValue: 0, backendId: 6 },
      { id: 'h7', label: 'Tous les produits sont-ils bien emballés et stockés ?', status: null, numericValue: 0, backendId: 7 },
      { id: 'h8', label: 'Les poubelles sont-elles fermées, propres et vidées ?', status: null, numericValue: 0, backendId: 8 },
      { id: 'h9', label: 'Le principe du FIFO (First In, First Out) est-il bien appliqué ?', status: null, numericValue: 0, backendId: 9 }
    ]
  }
];

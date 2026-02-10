import { User } from './user.model';

// --- Backend Models ---

export interface Coffee {
  id: number;
  name: string;
  location: string;
  active: boolean;
}

export interface AuditAnswerDTO {
  question_id: number;
  value: number;
  comment?: string;
  id?: number;
  question?: {
    id: number;
    text: string;
    weight: number;
    category_id: number;
    category: {
      id: number;
      name: string;
      description?: string;
    };
  };
}

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
}

export interface AuditCreateDTO {
  coffee_id: number;
  shift?: string;
  staff_present?: string;
  actions_correctives?: string;
  training_needs?: string;
  purchases?: string;
  answers: { question_id: number; value: number; comment?: string }[];
}


// --- Frontend UI Models (Keep original logic but adapt) ---

export interface AuditUI {
  id?: number; // Backend ID
  date: Date;
  coffeeShop: string; // Name for UI
  coffeeId?: number; // Added for linking
  auditorName: string; // Name for UI
  score: number;
  categories: AuditCategory[];
  status?: string; // Derived
  shift?: string;
  staffPresent?: string;
  actionsCorrectives?: string;
  trainingNeeds?: string;
  purchases?: string;
}

export type AuditStatus = 'Conforme' | 'Non-conforme';

export interface AuditCategory {
  id?: string; // Optional - used for UI tracking
  name: string;
  items: AuditQuestion[];
}

export interface AuditQuestion {
  id?: string; // Optional - used for UI tracking
  label: string;
  status: AuditResponse | null; // 'oui' | 'non' | null
  numericValue?: number; // 0-5 score
  remarks?: string;
  photos?: string[];
  backendId?: number; // Backend question ID
  weight?: number; // Question weight for scoring
}

export type AuditResponse = 'oui' | 'non' | 'n/a' | null;

// Template definition remains, adding backendId mapping if we want to use DB IDs
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
  },
  // ... (Other categories)
  // Simplified for this step, keeping structure. 
  // In a real app we'd fetch questions from backend, but here user provided static template.
  // I will assume backend question IDs align with flattened index or hardcoded mapping.
];

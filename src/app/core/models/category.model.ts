export interface Category {
    id: number;
    name: string;
    description?: string;
}

export interface CategoryCreate {
    name: string;
    description?: string;
}

export interface Question {
    id: number;
    text: string;
    weight: number;
    category_id: number;
    category?: Category;
}

export interface QuestionCreate {
    text: string;
    weight: number;
    category_id: number;
}

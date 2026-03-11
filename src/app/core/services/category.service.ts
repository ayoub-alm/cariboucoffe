import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../constants';
import { Category, CategoryCreate, Question, QuestionCreate } from '../models/category.model';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private http = inject(HttpClient);

    // Categories
    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${API_URL}/categories`);
    }

    getCategory(id: number): Observable<Category> {
        return this.http.get<Category>(`${API_URL}/categories/${id}`);
    }

    createCategory(category: CategoryCreate): Observable<Category> {
        return this.http.post<Category>(`${API_URL}/categories`, category);
    }

    updateCategory(id: number, category: CategoryCreate): Observable<Category> {
        return this.http.put<Category>(`${API_URL}/categories/${id}`, category);
    }

    deleteCategory(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/categories/${id}`);
    }

    reorderCategories(items: { id: number; display_order: number }[]): Observable<any> {
        return this.http.patch(`${API_URL}/categories/reorder`, { items });
    }

    // Questions
    getQuestions(categoryId?: number): Observable<Question[]> {
        const url = categoryId
            ? `${API_URL}/questions?category_id=${categoryId}`
            : `${API_URL}/questions`;
        return this.http.get<Question[]>(url);
    }

    getQuestion(id: number): Observable<Question> {
        return this.http.get<Question>(`${API_URL}/questions/${id}`);
    }

    createQuestion(question: QuestionCreate): Observable<Question> {
        return this.http.post<Question>(`${API_URL}/questions`, question);
    }

    updateQuestion(id: number, question: QuestionCreate): Observable<Question> {
        return this.http.put<Question>(`${API_URL}/questions/${id}`, question);
    }

    deleteQuestion(id: number): Observable<any> {
        return this.http.delete(`${API_URL}/questions/${id}`);
    }

    reorderQuestions(items: { id: number; display_order: number }[]): Observable<any> {
        return this.http.patch(`${API_URL}/questions/reorder`, { items });
    }
}

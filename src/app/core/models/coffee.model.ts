export interface Coffee {
    id: number;
    ref?: string;
    name: string;
    location: string;
    active: boolean;
    opening_time?: string;
    closing_time?: string;
}

export interface CoffeeCreate {
    ref?: string;
    name: string;
    location: string;
    active: boolean;
    opening_time?: string;
    closing_time?: string;
}

export interface CoffeeUpdate {
    ref?: string;
    name?: string;
    location?: string;
    active?: boolean;
    opening_time?: string;
    closing_time?: string;
}

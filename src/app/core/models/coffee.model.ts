export interface Coffee {
    id: number;
    ref?: string;
    name: string;
    location: string;
    active: boolean;
}

export interface CoffeeCreate {
    ref?: string;
    name: string;
    location: string;
    active: boolean;
}

export interface CoffeeUpdate {
    ref?: string;
    name?: string;
    location?: string;
    active?: boolean;
}

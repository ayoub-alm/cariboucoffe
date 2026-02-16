export interface Coffee {
    id: number;
    name: string;
    location: string;
    active: boolean;
}

export interface CoffeeCreate {
    name: string;
    location: string;
    active: boolean;
}

export interface CoffeeUpdate {
    name?: string;
    location?: string;
    active?: boolean;
}

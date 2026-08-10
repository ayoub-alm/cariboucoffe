export interface CoffeeSchedule {
    id?: number;
    coffee_id?: number;
    day_of_week: number;
    is_closed: boolean;
    opening_time?: string;
    closing_time?: string;
}

export interface Coffee {
    id: number;
    ref?: string;
    name: string;
    location: string;
    active: boolean;
    opening_time?: string;
    closing_time?: string;
    schedules?: CoffeeSchedule[];
}

export interface CoffeeCreate {
    ref?: string;
    name: string;
    location: string;
    active: boolean;
    schedules?: CoffeeSchedule[];
}

export interface CoffeeUpdate {
    ref?: string;
    name?: string;
    location?: string;
    active?: boolean;
    schedules?: CoffeeSchedule[];
}

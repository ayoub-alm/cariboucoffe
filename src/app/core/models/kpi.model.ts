export interface KPIData {
    total_audits: number;
    average_score: number;
    top_performer: string | null;
    recent_trend: number[];
    compliance_rate: number;
    total_coffee_shops: number;
    audits_this_month: number;
    average_score_this_month: number;
}

export interface KPICard {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    trend?: number;
    subtitle?: string;
}

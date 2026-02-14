/**
 * KPI Models - Dashboard metrics and statistics
 */

/** KPI data from backend */
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

/** KPI card for UI display */
export interface KPICard {
    title: string;
    value: string | number;
    icon: string;
    color: 'primary' | 'accent' | 'warn' | 'success' | 'error';
    trend?: number;
    subtitle?: string;
    description?: string;
}

/** Chart data point */
export interface ChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

/** Trend direction */
export type TrendDirection = 'up' | 'down' | 'stable';

/**
 * Helper functions for KPIs
 */

/** Get trend direction from value */
export function getTrendDirection(trend: number): TrendDirection {
    if (trend > 2) return 'up';
    if (trend < -2) return 'down';
    return 'stable';
}

/** Get trend icon */
export function getTrendIcon(trend: number): string {
    const direction = getTrendDirection(trend);
    switch (direction) {
        case 'up':
            return 'trending_up';
        case 'down':
            return 'trending_down';
        case 'stable':
            return 'trending_flat';
    }
}

/** Get trend color */
export function getTrendColor(trend: number, higherIsBetter: boolean = true): string {
    const direction = getTrendDirection(trend);
    if (direction === 'stable') return 'default';

    const isPositive = direction === 'up';
    if (higherIsBetter) {
        return isPositive ? 'success' : 'error';
    } else {
        return isPositive ? 'error' : 'success';
    }
}

/** Format KPI value */
export function formatKPIValue(value: number, type: 'number' | 'percentage' | 'score'): string {
    switch (type) {
        case 'percentage':
            return `${Math.round(value)}%`;
        case 'score':
            return `${value.toFixed(1)}/100`;
        case 'number':
        default:
            return value.toLocaleString();
    }
}

/** Calculate compliance rate */
export function calculateComplianceRate(conformeCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((conformeCount / totalCount) * 100);
}

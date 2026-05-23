import { Injectable, inject } from '@angular/core';
import { AuditUI, AuditCategory } from '../models/audit.model';
import { DashboardFilters } from '../../shared/components/filter-bar/filter-bar.component';
import { ConfigService } from './config.service';

export interface DashboardKPIs {
  totalAudits: number;
  averageScore: number;
  complianceRate: number;
  auditsMonth: number;
  avgScoreMonth: number;
  topPerformer: string;
  worstPerformer: string;
  scoresPerCategory: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class DashboardDataService {
  private configService = inject(ConfigService);

  processDashboardData(allAudits: AuditUI[], filters: DashboardFilters): { filteredAudits: AuditUI[], kpis: DashboardKPIs } {
    let filteredAudits = [...allAudits];

    // Filter by date
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      filteredAudits = filteredAudits.filter(a => new Date(a.date) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      filteredAudits = filteredAudits.filter(a => new Date(a.date) <= end);
    }

    // Filter by Coffee Shop
    if (filters.coffeeShop) {
      filteredAudits = filteredAudits.filter(a => a.coffeeShop === filters.coffeeShop);
    }

    // Filter by Auditor
    if (filters.auditorName) {
      filteredAudits = filteredAudits.filter(a => a.auditorName === filters.auditorName);
    }

    // Filter by Category
    // If a category is selected, we recalculate the score of each audit to ONLY reflect that category
    if (filters.categoryName) {
      filteredAudits = filteredAudits.map(audit => {
        const cat = audit.categories.find(c => c.name === filters.categoryName);
        if (!cat) return { ...audit, score: -1 }; // Exclude audits without this category

        let totalWeight = 0;
        let earned = 0;
        cat.items.forEach(item => {
          if (item.status === 'oui' || item.status === 'non') {
            const w = item.weight || 1;
            totalWeight += w;
            if (item.status === 'oui') earned += w;
          }
        });

        const newScore = totalWeight > 0 ? (earned / totalWeight) * 100 : 100;
        return { ...audit, score: newScore };
      }).filter(a => a.score !== -1);
    }

    // Now calculate KPIs based on filteredAudits
    const totalAudits = filteredAudits.length;
    let averageScore = 0;
    let complianceRate = 0;
    let auditsMonth = 0;
    let avgScoreMonth = 0;
    let topPerformer = 'N/A';
    let worstPerformer = 'N/A';
    const scoresPerCategory: { [key: string]: number } = {};

    if (totalAudits > 0) {
      // average score
      const sumScores = filteredAudits.reduce((acc, a) => acc + a.score, 0);
      averageScore = sumScores / totalAudits;

      // compliance rate (score >= conforme_min)
      const conformeMin = this.configService.thresholds()?.conforme_min ?? 90;
      const compliantCount = filteredAudits.filter(a => a.score >= conformeMin).length;
      complianceRate = (compliantCount / totalAudits) * 100;

      // this month
      const now = new Date();
      const thisMonthAudits = filteredAudits.filter(a => {
         const d = new Date(a.date);
         return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      auditsMonth = thisMonthAudits.length;
      if (auditsMonth > 0) {
        avgScoreMonth = thisMonthAudits.reduce((acc, a) => acc + a.score, 0) / auditsMonth;
      }

      // top & worst performer
      const coffeeScores = new Map<string, { total: number, count: number }>();
      filteredAudits.forEach(a => {
        if (!coffeeScores.has(a.coffeeShop)) {
          coffeeScores.set(a.coffeeShop, { total: 0, count: 0 });
        }
        coffeeScores.get(a.coffeeShop)!.total += a.score;
        coffeeScores.get(a.coffeeShop)!.count += 1;
      });

      let maxAvg = -1;
      let minAvg = 999;
      coffeeScores.forEach((stats, shopName) => {
        const avg = stats.total / stats.count;
        if (avg > maxAvg) { maxAvg = avg; topPerformer = shopName; }
        if (avg < minAvg) { minAvg = avg; worstPerformer = shopName; }
      });

      // Scores per category (only if a specific category is NOT completely filtered to 1)
      if (!filters.categoryName) {
        const catStats = new Map<string, { weight: number, earned: number }>();
        filteredAudits.forEach(audit => {
           audit.categories.forEach(cat => {
              if (!catStats.has(cat.name)) catStats.set(cat.name, { weight: 0, earned: 0 });
              
              cat.items.forEach(item => {
                 if (item.status === 'oui' || item.status === 'non') {
                    const w = item.weight || 1;
                    catStats.get(cat.name)!.weight += w;
                    if (item.status === 'oui') catStats.get(cat.name)!.earned += w;
                 }
              });
           });
        });

        catStats.forEach((stats, catName) => {
           scoresPerCategory[catName] = stats.weight > 0 ? (stats.earned / stats.weight) * 100 : 0;
        });
      } else {
         // If a specific category is selected, that is the only category
         scoresPerCategory[filters.categoryName] = averageScore;
      }
    }

    return {
      filteredAudits,
      kpis: {
        totalAudits,
        averageScore,
        complianceRate,
        auditsMonth,
        avgScoreMonth,
        topPerformer,
        worstPerformer,
        scoresPerCategory
      }
    };
  }
}

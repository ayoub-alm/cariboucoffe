import { Signal } from '@angular/core';

export interface Audit {
  id: string;
  date: Date;
  coffeeShop: string;
  auditor: string;
  shift?: 'AM' | 'PM';
  staffPresent?: string;
  score: number;
  status: AuditStatus;
  categories: AuditCategory[];
  // Summary fields
  marketingCompliant?: boolean; // Step 9 "Tous les outils marketing sont-ils actualisés ?"
  actionsCorrectives?: string;
  trainingNeeds?: string;
  purchases?: string;
  globalRemarks?: string;
}

export type AuditStatus = 'Conforme' | 'Non-conforme';

export interface AuditCategory {
  id: string;
  name: string;
  items: AuditQuestion[];
}

export interface AuditQuestion {
  id: string;
  label: string;
  category?: string;
  status: AuditResponse;
  remarks?: string;
  photos?: string[];
}

export type AuditResponse = 'oui' | 'non' | 'n/a' | null;

export const AUDIT_CATEGORIES_TEMPLATE: AuditCategory[] = [
  {
    id: 'hygiene',
    name: 'Hygiène & Sécurité',
    items: [
      { id: 'h1', label: 'La zone de préparation est-elle propre et désinfectée ?', status: null },
      { id: 'h2', label: 'Les plans de travail sont-ils nettoyés entre chaque usage ?', status: null },
      { id: 'h3', label: 'La technique et la fréquence du lavage de mains sont-elles respectées ?', status: null },
      { id: 'h4', label: 'Les produits alimentaires sont-ils stockés à la bonne température ?', status: null },
      { id: 'h5', label: 'Les frigos et congélateurs sont-ils propres, organisés avec thermomètre visible ?', status: null },
      { id: 'h6', label: 'Absence de produits périmés en stock ou en zone de préparation ?', status: null },
      { id: 'h7', label: 'Tous les produits sont-ils bien emballés et stockés ?', status: null },
      { id: 'h8', label: 'Les poubelles sont-elles fermées, propres et vidées ?', status: null },
      { id: 'h9', label: 'Le principe du FIFO (First In, First Out) est-il bien appliqué ?', status: null }
    ]
  },
  {
    id: 'staff',
    name: 'Personnel & Connaissance',
    items: [
      { id: 's1', label: 'Les uniformes sont-ils complets, propres et conformes à la charte ?', status: null },
      { id: 's2', label: 'Le badge prénom est-il visible pour tout le personnel ?', status: null },
      { id: 's3', label: 'Le staff maîtrise-t-il les recettes, les allergènes et les options ?', status: null },
      { id: 's4', label: 'Le personnel sait-il répondre aux questions sur les promotions en cours ?', status: null },
      { id: 's5', label: 'La réactivité, le sourire et la posture (debout active) sont-ils au rendez-vous ?', status: null },
      { id: 's6', label: 'Le staff connaît-il les procédures de sécurité et d\'hygiène ?', status: null }
    ]
  },
  {
    id: 'quality',
    name: 'Qualité des produits',
    items: [
      { id: 'q1', label: 'Les boissons sont-elles conformes aux standards visuels ?', status: null },
      { id: 'q2', label: 'La température des boissons (chaudes et froides) est-elle conforme ?', status: null },
      { id: 'q3', label: 'Le goût des boissons respecte-t-il la recette originale ?', status: null },
      { id: 'q4', label: 'La présentation des viennoiseries et snacks est-elle conforme ?', status: null },
      { id: 'q5', label: 'La traçabilité des produits ouverts est-elle à jour ?', status: null }
    ]
  },
  {
    id: 'maintenance',
    name: 'Maintenance & Matériel',
    items: [
      { id: 'mt1', label: 'Taux de TDS et PH conformes ?', status: null },
      { id: 'mt2', label: 'Les machines à café sont-elles nettoyées et fonctionnelles ?', status: null },
      { id: 'mt3', label: 'Le petit matériel (Blender, fours, frigos) est-il propre et sans fuite ?', status: null },
      { id: 'mt4', label: 'Absence d\'ampoules grillées, prises cassées ou câbles apparents ?', status: null },
      { id: 'mt5', label: 'L\'aération, la climatisation ou le chauffage sont-ils fonctionnels ?', status: null }
    ]
  },
  {
    id: 'zone_client',
    name: 'Zone client & Ambiance',
    items: [
      { id: 'zc1', label: 'Les sols sont-ils propres (absence de déchets ou liquides) ?', status: null },
      { id: 'zc2', label: 'Les tables et chaises sont-elles propres et bien positionnées ?', status: null },
      { id: 'zc3', label: 'La musique de fond est-elle conforme à la playlist et au volume souhaité ?', status: null },
      { id: 'zc4', label: 'L\'odeur générale est-elle agréable ?', status: null },
      { id: 'zc5', label: 'Le présentoir est-il propre et bien garni ?', status: null },
      { id: 'zc6', label: 'Les toilettes sont-elles propres et fournies (avec check-list signée) ?', status: null }
    ]
  },
  {
    id: 'gestion',
    name: 'Gestion / Système',
    items: [
      { id: 'g1', label: 'Le fond de caisse est-il correct ?', status: null },
      { id: 'g2', label: 'Les tickets de support pour la maintenance ont-ils été créés ?', status: null },
      { id: 'g3', label: 'La checklist quotidienne est-elle mise à jour et complétée ?', status: null },
      { id: 'g4', label: 'La stratégie d\'upselling et la gestion des déchets sont-elles appliquées ?', status: null },
      { id: 'g5', label: 'Le système POS (Clyo) est-il à jour au niveau des prix et promos ?', status: null },
      { id: 'g6', label: 'Les procédures d\'ouverture et de fermeture sont-elles respectées ?', status: null },
      { id: 'g7', label: 'Les rapports de vente et de stock sont-ils bien tenus ?', status: null }
    ]
  },
  {
    id: 'stock',
    name: 'Stock / Réception',
    items: [
      { id: 'st1', label: 'La réserve est-elle propre, rangée et sans carton au sol ?', status: null },
      { id: 'st2', label: 'Les produits sont-ils rangés sur étagères sans coller aux murs ?', status: null },
      { id: 'st3', label: 'La livraison est-elle vérifiée à réception (quantité, qualité, température) ?', status: null },
      { id: 'st4', label: 'Les produits d\'entretien sont-ils strictement séparés des produits alimentaires ?', status: null }
    ]
  },
  {
    id: 'marketing',
    name: 'Marketing & Conclusion',
    items: [
      { id: 'mk1', label: 'Tous les outils marketing sont-ils actualisés ?', status: null }
    ]
  }
];

export type TarotSpreadType = 'single' | 'three';

export interface TarotSpreadDefinition {
  type: TarotSpreadType;
  labelVi: string;
  positions: readonly string[];
}

export const TAROT_SPREADS: Record<TarotSpreadType, TarotSpreadDefinition> = {
  single: {
    type: 'single',
    labelVi: 'Trải 1 lá (Hiện tại)',
    positions: ['present'],
  },
  three: {
    type: 'three',
    labelVi: 'Trải 3 lá (Quá khứ - Hiện tại - Tương lai)',
    positions: ['past', 'present', 'future'],
  },
} as const;

export const POSITION_LABELS_VI: Record<string, string> = {
  present: 'Hiện tại / Tổng quan',
  past: 'Quá khứ / Nguyên nhân',
  future: 'Tương lai / Hướng đi',
};

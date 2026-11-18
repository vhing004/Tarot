export type Topic = 'love' | 'career' | 'money' | 'health' | 'general';

export interface TarotCard {
  id: number;
  name: string;
  nameVi: string;
  image: string;
  keywords: string[];
  upright: string;
  reversed: string;
}

export interface DrawnCard {
  card: TarotCard;
  reversed: boolean;
  position: string; // vd 'present' | 'past' | 'future'
}

export interface Hexagram {
  id: number;
  name: string;
  nameVi: string;
  judgement: string;
  lines: [string, string, string, string, string, string]; // lời hào 1..6 (dưới lên)
}

export interface CoinLine {
  coins: [2 | 3, 2 | 3, 2 | 3];
  sum: 6 | 7 | 8 | 9;
  yang: boolean;
  moving: boolean;
}

export interface TarotResult {
  spread: 'single' | 'three';
  cards: DrawnCard[];
}

export interface DivinationResult {
  lines: CoinLine[]; // 6 phần tử, từ hào 1 (dưới) đến hào 6 (trên)
  primaryKey: string; // vd '111000', ký tự đầu = hào 1
  changedKey: string | null;
  movingLines: number[]; // số thứ tự hào động (1..6)
}

export interface Reading {
  id: string;
  mode: 'tarot' | 'divination';
  question: string;
  topic: Topic;
  createdAt: number;
  result: TarotResult | DivinationResult;
  interpretation: string;
}

export interface ReadingRepository {
  save(reading: Reading): Promise<void>;
  list(limit?: number): Promise<Reading[]>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export type QualityLevel = 'low' | 'medium' | 'high';

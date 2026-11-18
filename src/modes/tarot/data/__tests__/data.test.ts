import { describe, expect, it } from 'vitest';
import cardsJson from '@/modes/tarot/data/cards.json';
import sourcesMd from '@/modes/tarot/data/SOURCES.md?raw';
import type { TarotCard } from '@/shared/types';

describe('Tarot Data Verification (Gate G5)', () => {
  it('cards.json và SOURCES.md phải được nạp thành công', () => {
    expect(cardsJson).toBeDefined();
    expect(typeof sourcesMd).toBe('string');
    expect(sourcesMd.length).toBeGreaterThan(0);
    expect(sourcesMd).toContain('Public Domain');
  });

  it('cards.json phải chứa đúng 78 lá bài với ID duy nhất từ 0 đến 77', () => {
    const cards = cardsJson as TarotCard[];

    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBe(78);

    const ids = new Set<number>();
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as TarotCard;
      expect(typeof card.id).toBe('number');
      expect(card.id).toBeGreaterThanOrEqual(0);
      expect(card.id).toBeLessThanOrEqual(77);
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);

      expect(typeof card.name).toBe('string');
      expect(card.name.trim().length).toBeGreaterThan(0);

      expect(typeof card.nameVi).toBe('string');
      expect(card.nameVi.trim().length).toBeGreaterThan(0);

      expect(typeof card.image).toBe('string');
      expect(card.image.startsWith('/textures/tarot/')).toBe(true);
      expect(card.image.endsWith('.jpg')).toBe(true);

      expect(Array.isArray(card.keywords)).toBe(true);
      expect(card.keywords.length).toBeGreaterThan(0);

      expect(typeof card.upright).toBe('string');
      expect(card.upright.trim().length).toBeGreaterThan(0);

      expect(typeof card.reversed).toBe('string');
      expect(card.reversed.trim().length).toBeGreaterThan(0);

      expect(Array.isArray(card.symbolism)).toBe(true);
      expect(card.symbolism.length).toBeGreaterThan(0);

      expect(Array.isArray(card.reflectionPrompts)).toBe(true);
      expect(card.reflectionPrompts.length).toBeGreaterThan(0);
    }

    expect(ids.size).toBe(78);
  });

  it('cards.json phải phân chia đúng 22 lá Ẩn Chính và 56 lá Ẩn Phụ theo 4 bộ chất', () => {
    const cards = cardsJson as TarotCard[];
    const majorCards = cards.filter((c) => c.suit === 'major');
    const wands = cards.filter((c) => c.suit === 'wands');
    const cups = cards.filter((c) => c.suit === 'cups');
    const swords = cards.filter((c) => c.suit === 'swords');
    const pentacles = cards.filter((c) => c.suit === 'pentacles');

    expect(majorCards.length).toBe(22);
    expect(wands.length).toBe(14);
    expect(cups.length).toBe(14);
    expect(swords.length).toBe(14);
    expect(pentacles.length).toBe(14);
  });
});

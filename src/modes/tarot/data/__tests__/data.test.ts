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

  it('cards.json phải chứa đúng 22 lá Ẩn Chính với ID duy nhất từ 0 đến 21', () => {
    const cards = cardsJson as TarotCard[];

    expect(Array.isArray(cards)).toBe(true);
    expect(cards.length).toBe(22);

    const ids = new Set<number>();
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as TarotCard;
      expect(typeof card.id).toBe('number');
      expect(card.id).toBeGreaterThanOrEqual(0);
      expect(card.id).toBeLessThanOrEqual(21);
      expect(ids.has(card.id)).toBe(false);
      ids.add(card.id);

      expect(typeof card.name).toBe('string');
      expect(card.name.trim().length).toBeGreaterThan(0);

      expect(typeof card.nameVi).toBe('string');
      expect(card.nameVi.trim().length).toBeGreaterThan(0);

      expect(typeof card.image).toBe('string');
      expect(card.image.endsWith('.webp')).toBe(true);

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

    expect(ids.size).toBe(22);
  });

  it('mọi lá bài phải có đường dẫn ảnh đúng quy ước /textures/tarot/ và có đuôi .webp', () => {
    const cards = cardsJson as TarotCard[];
    for (const card of cards) {
      expect(card.image).toMatch(/^\/textures\/tarot\/\d{2}-[\w-]+\.webp$/);
    }
  });
});

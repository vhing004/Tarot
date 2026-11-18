import { describe, expect, it } from 'vitest';
import { type KeyValueStorage, LocalRepository } from '@/services/repository';
import type { Reading } from '@/shared/types';

function createMockStorage(): KeyValueStorage {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const mockReading: Reading = {
  id: 'test-1',
  mode: 'tarot',
  question: 'Công việc sắp tới thế nào?',
  topic: 'career',
  createdAt: 1700000000000,
  result: {
    spread: 'single',
    cards: [
      {
        card: {
          id: 0,
          name: 'The Fool',
          nameVi: 'Kẻ Khờ',
          image: '/cards/0.webp',
          keywords: ['khởi đầu'],
          upright: 'Bắt đầu mới',
          reversed: 'Thiếu suy nghĩ',
        },
        reversed: false,
        position: 'present',
      },
    ],
  },
  interpretation: 'Một khởi đầu mới đầy hứa hẹn.',
};

describe('LocalRepository (R06)', () => {
  it('lưu và đọc lại danh sách lượt bói', async () => {
    const storage = createMockStorage();
    const repo = new LocalRepository(storage);

    await repo.save(mockReading);
    const list = await repo.list();

    expect(list.length).toBe(1);
    expect(list[0]?.id).toBe('test-1');
    expect(list[0]?.question).toBe('Công việc sắp tới thế nào?');
  });

  it('xóa bản ghi theo ID', async () => {
    const storage = createMockStorage();
    const repo = new LocalRepository(storage);

    await repo.save(mockReading);
    await repo.save({ ...mockReading, id: 'test-2' });

    expect((await repo.list()).length).toBe(2);

    await repo.remove('test-1');
    const list = await repo.list();
    expect(list.length).toBe(1);
    expect(list[0]?.id).toBe('test-2');
  });

  it('xóa toàn bộ dữ liệu (clear)', async () => {
    const storage = createMockStorage();
    const repo = new LocalRepository(storage);

    await repo.save(mockReading);
    await repo.clear();

    const list = await repo.list();
    expect(list.length).toBe(0);
  });

  it('xử lý an toàn khi dữ liệu JSON trong storage bị hỏng', async () => {
    const storage = createMockStorage();
    storage.setItem('fh.readings.v1', '{ invalid json syntax !!!');

    const repo = new LocalRepository(storage);
    const list = await repo.list();

    expect(list).toEqual([]);
  });

  it('lọc bỏ các bản ghi không đúng schema nhờ type guard', async () => {
    const storage = createMockStorage();
    const corruptedPayload = {
      schemaVersion: 1,
      records: [
        { bad: 'data' },
        mockReading,
        { id: 123, question: 'wrong type' },
      ],
    };
    storage.setItem('fh.readings.v1', JSON.stringify(corruptedPayload));

    const repo = new LocalRepository(storage);
    const list = await repo.list();

    expect(list.length).toBe(1);
    expect(list[0]?.id).toBe('test-1');
  });
});

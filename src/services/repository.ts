import {
  CURRENT_SCHEMA_VERSION,
  MAX_HISTORY_RECORDS,
  STORAGE_KEY_READINGS,
} from '@/shared/constants';
import type { Reading, ReadingRepository } from '@/shared/types';

interface StoredPayload {
  schemaVersion: number;
  records: Reading[];
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Type guard kiểm tra đối tượng Reading hợp lệ (R06 §3)
 */
function isReading(item: unknown): item is Reading {
  if (typeof item !== 'object' || item === null) return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r.id === 'string' &&
    (r.mode === 'tarot' || r.mode === 'divination') &&
    typeof r.question === 'string' &&
    typeof r.topic === 'string' &&
    typeof r.createdAt === 'number' &&
    typeof r.result === 'object' &&
    r.result !== null &&
    typeof r.interpretation === 'string'
  );
}

/**
 * LocalRepository quản lý lịch sử bói toán trong localStorage hoặc storage giả lập.
 */
export class LocalRepository implements ReadingRepository {
  private readonly storage: KeyValueStorage;
  private readonly storageKey: string;

  constructor(
    storage?: KeyValueStorage,
    storageKey: string = STORAGE_KEY_READINGS,
  ) {
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      // Memory fallback khi chạy trong môi trường không có localStorage
      const memoryStore = new Map<string, string>();
      this.storage = {
        getItem: (k: string) => memoryStore.get(k) ?? null,
        setItem: (k: string, v: string) => memoryStore.set(k, v),
        removeItem: (k: string) => {
          memoryStore.delete(k);
        },
      };
    }
    this.storageKey = storageKey;
  }

  async save(reading: Reading): Promise<void> {
    const list = await this.list();
    // Đưa bản ghi mới lên đầu danh sách
    const updated = [reading, ...list.filter((r) => r.id !== reading.id)].slice(
      0,
      MAX_HISTORY_RECORDS,
    );
    const payload: StoredPayload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      records: updated,
    };

    try {
      this.storage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (err) {
      console.error('LocalRepository: lỗi khi lưu vào storage', err);
      throw new Error('error_storage_full');
    }
  }

  async list(limit: number = MAX_HISTORY_RECORDS): Promise<Reading[]> {
    try {
      const raw = this.storage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null) return [];

      const payload = parsed as Record<string, unknown>;
      const records = payload.records;
      if (!Array.isArray(records)) return [];

      // Lọc các bản ghi hợp lệ qua type guard
      const validRecords: Reading[] = [];
      for (const rec of records) {
        if (isReading(rec)) {
          validRecords.push(rec);
        }
      }

      return validRecords.slice(0, limit);
    } catch (err) {
      console.error('LocalRepository: dữ liệu lưu trữ bị hỏng, trả về danh sách rỗng', err);
      return [];
    }
  }

  async remove(id: string): Promise<void> {
    const list = await this.list();
    const updated = list.filter((r) => r.id !== id);
    const payload: StoredPayload = {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      records: updated,
    };
    try {
      this.storage.setItem(this.storageKey, JSON.stringify(payload));
    } catch (err) {
      console.error('LocalRepository: lỗi khi xóa bản ghi', err);
    }
  }

  async clear(): Promise<void> {
    try {
      this.storage.removeItem(this.storageKey);
    } catch (err) {
      console.error('LocalRepository: lỗi khi xóa toàn bộ dữ liệu', err);
    }
  }
}

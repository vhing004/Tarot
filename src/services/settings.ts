import { STORAGE_KEY_SETTINGS } from '@/shared/constants';
import type { QualityLevel } from '@/shared/types';
import type { KeyValueStorage } from '@/services/repository';

export interface SettingsData {
  volume: number; // 0..1
  muted: boolean;
  quality: QualityLevel;
  reducedMotion: boolean;
}

const DEFAULT_SETTINGS: SettingsData = {
  volume: 0.7,
  muted: false,
  quality: 'high',
  reducedMotion: false,
};

function isSettingsData(val: unknown): val is SettingsData {
  if (typeof val !== 'object' || val === null) return false;
  const s = val as Record<string, unknown>;
  const validQuality = s.quality === 'low' || s.quality === 'medium' || s.quality === 'high';
  return (
    typeof s.volume === 'number' &&
    typeof s.muted === 'boolean' &&
    validQuality &&
    typeof s.reducedMotion === 'boolean'
  );
}

export class SettingsService {
  private storage: KeyValueStorage;
  private current: SettingsData;

  constructor(storage?: KeyValueStorage) {
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      const mem = new Map<string, string>();
      this.storage = {
        getItem: (k) => mem.get(k) ?? null,
        setItem: (k, v) => mem.set(k, v),
        removeItem: (k) => mem.delete(k),
      };
    }

    this.current = this.load();
  }

  get settings(): SettingsData {
    return { ...this.current };
  }

  load(): SettingsData {
    try {
      const raw = this.storage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (isSettingsData(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('SettingsService: không thể đọc cài đặt, dùng giá trị mặc định', err);
    }

    // Nhận diện prefers-reduced-motion nếu ở browser
    let prefersReduced = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    return {
      ...DEFAULT_SETTINGS,
      reducedMotion: prefersReduced,
    };
  }

  save(data: Partial<SettingsData>): SettingsData {
    this.current = {
      ...this.current,
      ...data,
    };

    try {
      this.storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.current));
    } catch (err) {
      console.error('SettingsService: lỗi khi lưu cài đặt', err);
    }

    return { ...this.current };
  }
}

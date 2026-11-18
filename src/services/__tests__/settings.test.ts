import { describe, expect, it } from 'vitest';
import { SettingsService } from '@/services/settings';
import type { KeyValueStorage } from '@/services/repository';

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

describe('SettingsService (R06 §3)', () => {
  it('tải cấu hình mặc định khi storage rỗng', () => {
    const storage = createMockStorage();
    const service = new SettingsService(storage);

    const s = service.settings;
    expect(s.volume).toBe(0.7);
    expect(s.muted).toBe(false);
    expect(s.quality).toBe('high');
  });

  it('lưu và đọc lại cài đặt cấu hình an toàn', () => {
    const storage = createMockStorage();
    const service = new SettingsService(storage);

    service.save({ volume: 0.3, muted: true, quality: 'medium' });

    const updated = service.settings;
    expect(updated.volume).toBe(0.3);
    expect(updated.muted).toBe(true);
    expect(updated.quality).toBe('medium');

    // Khởi tạo instance mới cùng storage
    const newService = new SettingsService(storage);
    expect(newService.settings.volume).toBe(0.3);
    expect(newService.settings.muted).toBe(true);
  });

  it('xử lý an toàn khi dữ liệu cài đặt trong storage bị hỏng', () => {
    const storage = createMockStorage();
    storage.setItem('fh.settings.v1', '{ invalid json syntax !!!');

    const service = new SettingsService(storage);
    expect(service.settings.volume).toBe(0.7);
  });
});

import {
  CanvasTexture,
  LoadingManager,
  Texture,
  TextureLoader,
} from 'three';

export class AssetLoader {
  public readonly manager: LoadingManager;
  private textureLoader: TextureLoader;
  private textureCache = new Map<string, Texture>();
  public readonly sharedResources = new Set<unknown>();

  constructor(
    onProgress?: (url: string, loaded: number, total: number) => void,
    onLoaded?: () => void,
    onError?: (url: string) => void,
  ) {
    this.manager = new LoadingManager();
    if (onProgress) this.manager.onProgress = onProgress;
    if (onLoaded) this.manager.onLoad = onLoaded;
    if (onError) this.manager.onError = onError;

    this.textureLoader = new TextureLoader(this.manager);
  }

  async loadTexture(url: string): Promise<Texture> {
    const cached = this.textureCache.get(url);
    if (cached) return cached;

    return new Promise((resolve) => {
      this.textureLoader.load(
        url,
        (texture) => {
          this.textureCache.set(url, texture);
          this.sharedResources.add(texture);
          resolve(texture);
        },
        undefined,
        (err) => {
          console.warn(`AssetLoader: không thể tải texture ${url}, sử dụng fallback`, err);
          const fallback = this.createFallbackTexture();
          this.textureCache.set(url, fallback);
          this.sharedResources.add(fallback);
          resolve(fallback);
        },
      );
    });
  }

  /**
   * Tạo texture placeholder 2x2 để game tiếp tục chạy mượt mà khi mất asset (R02 §3)
   */
  private createFallbackTexture(): Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#2d1b4e';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#d4af37';
      ctx.strokeRect(2, 2, 60, 60);
    }
    const texture = new CanvasTexture(canvas);
    return texture;
  }

  dispose(): void {
    for (const texture of this.textureCache.values()) {
      texture.dispose();
    }
    this.textureCache.clear();
    this.sharedResources.clear();
  }
}

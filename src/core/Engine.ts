import {
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import type { Quality } from '@/core/Quality';

interface Animatable {
  eventCallback(type: string, callback?: (...args: unknown[]) => void): unknown;
}

export type UpdaterFn = (dt: number) => void;

/** Metrics chi tiết cho dev hook G4 (chỉ bật ở DEV mode) */
export interface EngineMetrics {
  fpsInstant: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
}

export class Engine {
  public readonly scene: Scene;
  public readonly camera: PerspectiveCamera;
  public readonly renderer: WebGLRenderer;
  public readonly container: HTMLElement;

  private updaters = new Set<UpdaterFn>();
  private needsRender = true;
  private activeTweens = 0;
  private running = false;
  private lastTime = 0;
  private rafId = 0;
  private isDisposed = false;

  /** Tham chiếu Quality để recordFrame và cập nhật pixelRatio tự động */
  private quality: Quality | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new Scene();
    this.scene.background = new Color(0x0a0614); // Tím đêm huyền bí

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.camera = new PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 4, 7);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const maxRatio = isMobile ? 1.5 : 2;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
    this.renderer.setSize(width, height);
    this.renderer.domElement.style.touchAction = 'none'; // R03 §6

    container.appendChild(this.renderer.domElement);

    // Dev hook cho G3 lifecycle + G4 metrics (R07 §3)
    if (import.meta.env.DEV) {
      // allow:R02-any dev hook window.__fh
      (window as unknown as {
        __fh: {
          info: unknown;
          getMetrics: () => EngineMetrics;
        }
      }).__fh = {
        info: this.renderer.info,
        getMetrics: () => this.getMetrics(),
      };
    }

    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

    this.requestRender();
  }

  /**
   * Kết nối Quality manager để Engine tự động:
   * - gọi recordFrame mỗi tick
   * - cập nhật pixelRatio khi mức chất lượng thay đổi
   */
  attachQuality(quality: Quality): void {
    this.quality = quality;
    quality.addChangeListener((level) => {
      const maxRatio = quality.recommendedMaxPixelRatio();
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      // Trên mobile không vượt baseline cứng 1.5
      const cap = isMobile ? Math.min(1.5, maxRatio) : maxRatio;
      this.applyPixelRatio(cap);
      if (import.meta.env.DEV) {
        console.info(`[Quality] hạ xuống ${level}, pixelRatio → ${cap}`);
      }
    });
  }

  /**
   * Cập nhật pixel ratio tại runtime (dùng bởi Quality hoặc Settings thủ công).
   */
  applyPixelRatio(maxRatio: number): void {
    const ratio = Math.min(window.devicePixelRatio, maxRatio);
    this.renderer.setPixelRatio(ratio);
    this.requestRender();
  }

  requestRender(): void {
    this.needsRender = true;
    if (!this.running && !this.isDisposed && document.visibilityState !== 'hidden') {
      this.start();
    }
  }

  registerUpdater(updater: UpdaterFn): () => void {
    this.updaters.add(updater);
    this.requestRender();
    return () => {
      this.updaters.delete(updater);
    };
  }

  /**
   * Theo dõi một animation GSAP để duy trì render-on-demand loop khi animation đang chạy (R03 §3)
   */
  trackTween(anim: Animatable): void {
    this.activeTweens++;
    this.requestRender();

    const onEnd = () => {
      this.activeTweens = Math.max(0, this.activeTweens - 1);
      this.requestRender();
    };

    anim.eventCallback('onComplete', onEnd);
    anim.eventCallback('onInterrupt', onEnd);
  }

  /**
   * Trả về metrics chi tiết cho dev/benchmark.
   * Dùng trong console: `window.__fh.getMetrics()`
   */
  getMetrics(): EngineMetrics {
    const info = this.renderer.info;
    const dtMs = this.lastTime > 0 ? performance.now() - this.lastTime : 16.7;
    return {
      fpsInstant: dtMs > 0 ? 1000 / dtMs : 0,
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
    };
  }

  private start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (currentTime: number): void => {
    if (!this.running || this.isDisposed) return;

    const dtMs = currentTime - this.lastTime;
    const dt = Math.min(dtMs / 1000, 0.05);
    this.lastTime = currentTime;

    // Ghi frame vào Quality monitor (adaptive FPS tracking)
    if (this.quality) {
      this.quality.recordFrame(dtMs);
    }

    // Cập nhật các updaters
    for (const updater of this.updaters) {
      updater(dt);
    }

    if (this.needsRender || this.activeTweens > 0) {
      this.renderer.render(this.scene, this.camera);
      this.needsRender = false;
    }

    if (this.activeTweens > 0 || this.needsRender) {
      this.rafId = requestAnimationFrame(this.tick);
    } else {
      this.running = false;
    }
  };

  private onResize = (): void => {
    if (this.isDisposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.requestRender();
  };

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.running = false;
      cancelAnimationFrame(this.rafId);
    } else {
      this.requestRender();
    }
  };

  dispose(): void {
    this.isDisposed = true;
    this.running = false;
    cancelAnimationFrame(this.rafId);

    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    this.updaters.clear();
    this.quality = null;
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

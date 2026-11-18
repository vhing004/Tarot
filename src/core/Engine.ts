import {
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';

interface Animatable {
  eventCallback(type: string, callback?: (...args: unknown[]) => void): unknown;
}

export type UpdaterFn = (dt: number) => void;

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

    // Dev hook cho G3 lifecycle (R07 §3)
    if (import.meta.env.DEV) {
      // allow:R02-any dev hook window.__fh
      (window as unknown as { __fh: { info: unknown } }).__fh = {
        info: this.renderer.info,
      };
    }

    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);

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

  private start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private tick = (currentTime: number): void => {
    if (!this.running || this.isDisposed) return;

    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.05);
    this.lastTime = currentTime;

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
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}

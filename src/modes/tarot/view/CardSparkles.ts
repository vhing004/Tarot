import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Points,
  PointsMaterial,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';

/**
 * Hiệu ứng chùm hạt ánh sáng ma thuật tóe sáng (Magic Sparkle Burst)
 * khi con trỏ rê hoặc chạm lướt qua lá bài Tarot trên bàn.
 * Tối ưu hiệu năng: dùng chung 1 Points group duy nhất, 36 hạt nhẹ (R03).
 */
export class CardSparkles extends Group {
  private engine: Engine;
  private points: Points;
  private geometry: BufferGeometry;
  private material: PointsMaterial;
  private texture: CanvasTexture;

  private particleCount = 36;
  private currentPositions: Float32Array;
  private velocities: Float32Array;
  private activeTween: gsap.core.Tween | null = null;

  constructor(engine: Engine) {
    super();
    this.engine = engine;

    this.currentPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);

    // Khởi tạo các vector vận tốc tỏa ra xung quanh ngẫu nhiên
    for (let i = 0; i < this.particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.7;
      const speed = 0.25 + Math.random() * 0.45;

      this.velocities[i * 3] = Math.cos(phi) * Math.cos(theta) * speed;
      this.velocities[i * 3 + 1] = Math.sin(phi) * speed + 0.15; // Hơi bay lên trên
      this.velocities[i * 3 + 2] = Math.cos(phi) * Math.sin(theta) * speed;
    }

    this.geometry = new BufferGeometry();
    this.geometry.setAttribute('position', new Float32BufferAttribute(this.currentPositions, 3));

    this.texture = this.createSparkleTexture();
    this.material = new PointsMaterial({
      size: 0.16,
      map: this.texture,
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      opacity: 0,
    });

    this.points = new Points(this.geometry, this.material);
    this.add(this.points);
    this.visible = false;
  }

  /**
   * Tạo texture hạt ánh sáng ngôi sao 4 cánh lấp lánh bằng Canvas API
   */
  private createSparkleTexture(): CanvasTexture {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const cx = size / 2;
    const cy = size / 2;

    // Quầng sáng tỏa tròn ở tâm
    const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, size / 2);
    radial.addColorStop(0, 'rgba(255, 255, 255, 1)');
    radial.addColorStop(0.2, 'rgba(255, 235, 140, 0.95)');
    radial.addColorStop(0.5, 'rgba(215, 110, 255, 0.4)');
    radial.addColorStop(1, 'rgba(150, 50, 220, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, size, size);

    // Tia sáng hình chữ thập (ngôi sao 4 cánh)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, 4);
    ctx.lineTo(cx, size - 4);
    ctx.moveTo(4, cy);
    ctx.lineTo(size - 4, cy);
    ctx.stroke();

    return new CanvasTexture(canvas);
  }

  /**
   * Kích hoạt chùm hạt tóe sáng bùng nổ tại vị trí lá bài vừa được hover
   */
  triggerBurst(x: number, y: number, z: number): void {
    if (this.activeTween) {
      this.activeTween.kill();
    }

    this.position.set(x, y, z);
    this.visible = true;
    this.material.opacity = 1.0;

    // Reset vị trí hạt về tâm
    for (let i = 0; i < this.particleCount; i++) {
      this.currentPositions[i * 3] = (Math.random() - 0.5) * 0.15;
      this.currentPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      this.currentPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    this.geometry.attributes.position!.needsUpdate = true;

    const animState = { progress: 0 };

    this.activeTween = gsap.to(animState, {
      progress: 1,
      duration: 0.38,
      ease: 'power2.out',
      onUpdate: () => {
        const p = animState.progress;
        // Bùng tỏa các hạt ra xa
        for (let i = 0; i < this.particleCount; i++) {
          const vx = this.velocities[i * 3]!;
          const vy = this.velocities[i * 3 + 1]!;
          const vz = this.velocities[i * 3 + 2]!;

          this.currentPositions[i * 3] = vx * p * 0.85;
          this.currentPositions[i * 3 + 1] = vy * p * 0.85;
          this.currentPositions[i * 3 + 2] = vz * p * 0.85;
        }
        this.geometry.attributes.position!.needsUpdate = true;
        // Mờ dần theo thời gian
        this.material.opacity = Math.max(0, 1.0 - p);
        this.engine.requestRender();
      },
      onComplete: () => {
        this.visible = false;
        this.activeTween = null;
        this.engine.requestRender();
      },
    });
  }

  disposeSparkles(): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    this.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
    this.clear();
  }
}

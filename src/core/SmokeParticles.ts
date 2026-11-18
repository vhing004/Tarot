import {
  BufferAttribute,
  BufferGeometry,
  Points,
  PointsMaterial,
} from 'three';
import type { QualityLevel } from '@/shared/types';

export class SmokeParticles extends Points {
  private particleCount: number;
  private positionsArray: Float32Array;
  private speedsArray: Float32Array;
  private initialX: number;
  private initialY: number;
  private initialZ: number;
  private time = 0;

  /** Khi paused = true, update() không làm gì (tiết kiệm CPU/GPU khi đọc kết quả hoặc reducedMotion) */
  private paused = false;

  constructor(
    originX: number,
    originY: number,
    originZ: number,
    quality: QualityLevel = 'high',
  ) {
    let count = 90;
    if (quality === 'low') count = 25;
    else if (quality === 'medium') count = 50;

    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // allow:R04-rng thẩm mỹ khởi tạo hạt
      positions[i * 3] = originX + (Math.random() - 0.5) * 0.12;
      positions[i * 3 + 1] = originY + Math.random() * 1.5;
      positions[i * 3 + 2] = originZ + (Math.random() - 0.5) * 0.12;
      speeds[i] = 0.25 + Math.random() * 0.35;
    }

    geo.setAttribute('position', new BufferAttribute(positions, 3));

    const mat = new PointsMaterial({
      color: 0xbaa4d8,
      size: 0.08,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });

    super(geo, mat);

    this.particleCount = count;
    this.positionsArray = positions;
    this.speedsArray = speeds;
    this.initialX = originX;
    this.initialY = originY;
    this.initialZ = originZ;
  }

  /**
   * Tạm dừng hoạt ảnh hạt khói.
   * Gọi khi hiển thị ReadingPanel (người dùng đọc kết quả) hoặc bật reducedMotion.
   * Tiết kiệm CPU/GPU và đạt 0-frame render khi đứng yên (R03 §2).
   */
  pause(): void {
    this.paused = true;
  }

  /** Tiếp tục hoạt ảnh sau khi pause() */
  resume(): void {
    this.paused = false;
  }

  get isPaused(): boolean {
    return this.paused;
  }

  update(dt: number): void {
    // Không cập nhật khi tạm dừng → loop render có thể dừng hẳn (R03 §2)
    if (this.paused) return;

    this.time += dt;
    const positions = this.geometry.attributes.position;
    if (!positions) return;

    for (let i = 0; i < this.particleCount; i++) {
      const idx = i * 3;
      const speed = this.speedsArray[i] ?? 0.3;

      // Hạt khói bay dần lên trên
      const currentY = this.positionsArray[idx + 1] ?? 0;
      let newY = currentY + speed * dt;

      // Uốn lượn tự nhiên theo sóng sin/cos mà không new Vector3 (R03 §7 - tái sử dụng biến)
      const sway = Math.sin(this.time * 2 + i) * 0.003;
      const swayZ = Math.cos(this.time * 1.5 + i) * 0.003;

      this.positionsArray[idx] = (this.positionsArray[idx] ?? 0) + sway;
      this.positionsArray[idx + 2] = (this.positionsArray[idx + 2] ?? 0) + swayZ;

      // Hồi sinh hạt khi bay lên cao
      if (newY > this.initialY + 1.8) {
        newY = this.initialY;
        // allow:R04-rng thẩm mỹ hồi sinh vị trí hạt
        this.positionsArray[idx] = this.initialX + (Math.random() - 0.5) * 0.08;
        this.positionsArray[idx + 2] = this.initialZ + (Math.random() - 0.5) * 0.08;
      }

      this.positionsArray[idx + 1] = newY;
    }

    positions.needsUpdate = true;
  }

  disposeParticles(): void {
    this.geometry.dispose();
    if (Array.isArray(this.material)) {
      this.material.forEach((m) => m.dispose());
    } else {
      this.material.dispose();
    }
  }
}

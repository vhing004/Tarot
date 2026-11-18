import {
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';

// Dùng chung 1 geometry cho 3 đồng xu dẹt (R03 §5)
const sharedCoinGeometry = new CylinderGeometry(0.35, 0.35, 0.04, 32);

// Dùng chung material đồng xu vàng đồng cổ
const sharedCoinMaterial = new MeshStandardMaterial({
  color: 0xc89d3d,
  metalness: 0.8,
  roughness: 0.3,
});

export class Coin3D extends Mesh {
  public readonly index: number;
  private activeTween: gsap.core.Animation | null = null;
  private defaultX: number;
  private defaultZ: number;

  constructor(index: number, posX: number, posZ: number) {
    super(sharedCoinGeometry, sharedCoinMaterial);
    this.index = index;
    this.defaultX = posX;
    this.defaultZ = posZ;

    this.position.set(posX, 0.08, posZ);
    this.castShadow = true;
    this.receiveShadow = true;
  }

  /**
   * Diễn hoạt tung đồng xu (R04 §6):
   * - Nhấc xu lên không trung
   * - Xoay trên không trung đúng số vòng nguyên + góc dừng theo faceUp (3 điểm ngửa = 0, 2 điểm sấp = π)
   * - Rơi xuống đĩa với độ nảy tự nhiên
   */
  toss(
    engine: Engine,
    faceUp: boolean,
    delay: number = 0,
    onComplete?: () => void,
  ): void {
    if (this.activeTween) {
      this.activeTween.kill();
    }

    // Góc dừng chính xác: ngửa = 0 (mặt trên), sấp = π (mặt dưới)
    const targetRotX = faceUp ? Math.PI * 4 : Math.PI * 5;
    const targetRotZ = (this.index - 1) * 0.2; // Độ nghiêng nhẹ tự nhiên

    const tl = gsap.timeline({
      delay,
      onComplete: () => {
        this.activeTween = null;
        if (onComplete) onComplete();
      },
    });

    // 1. Bay lên cao và xoay
    tl.to(this.position, {
      y: 1.5 + Math.random() * 0.2, // allow:R04-rng thẩm mỹ bay bổng
      x: this.defaultX + (Math.random() - 0.5) * 0.2, // allow:R04-rng thẩm mỹ
      duration: 0.45,
      ease: 'power2.out',
    })
      .to(
        this.rotation,
        {
          x: targetRotX,
          z: targetRotZ,
          duration: 0.85,
          ease: 'power1.inOut',
        },
        0,
      )
      // 2. Rơi xuống đĩa và nảy nhẹ
      .to(this.position, {
        y: 0.08,
        x: this.defaultX,
        duration: 0.4,
        ease: 'bounce.out',
      });

    this.activeTween = tl;
    engine.trackTween(tl);
  }

  /**
   * Đặt ngay tức thì mặt xu (cho tính năng bỏ qua animation)
   */
  snap(faceUp: boolean): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    this.position.set(this.defaultX, 0.08, this.defaultZ);
    this.rotation.set(faceUp ? 0 : Math.PI, 0, 0);
  }

  disposeCoin(): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
  }
}

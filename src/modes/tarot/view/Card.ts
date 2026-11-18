import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  type Texture,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';
import type { TarotCard } from '@/shared/types';

// Dùng chung 1 geometry mỏng duy nhất cho toàn bộ các lá bài (R03 §5)
const CARD_WIDTH = 1.0;
const CARD_HEIGHT = 1.72;
const CARD_THICKNESS = 0.012;
const sharedCardGeometry = new BoxGeometry(CARD_WIDTH, CARD_HEIGHT, CARD_THICKNESS);

// Viền cạnh lá bài: vàng kim sáng để nổi bật trên bàn tối (tương phản màu sắc)
const sharedEdgeMaterial = new MeshStandardMaterial({
  color: 0xd4af37,      // vàng kim
  emissive: 0xb8860b,   // phát sáng vàng nhẹ để thấy được trong ánh nến
  emissiveIntensity: 0.4,
  metalness: 0.7,
  roughness: 0.3,
});

export class Card3D extends Mesh {
  public readonly cardData: TarotCard;
  public readonly index: number;
  public isReversed = false;
  public isRevealed = false;

  private frontMaterial: MeshStandardMaterial;
  private activeTween: gsap.core.Animation | null = null;

  constructor(cardData: TarotCard, index: number, sharedBackMaterial: MeshStandardMaterial) {
    // Mặt 4 là mặt trước (+Z), Mặt 5 là mặt sau (-Z)
    const frontMat = new MeshStandardMaterial({
      color: 0x221832,
      roughness: 0.4,
      metalness: 0.1,
    });

    super(sharedCardGeometry, [
      sharedEdgeMaterial,
      sharedEdgeMaterial,
      sharedEdgeMaterial,
      sharedEdgeMaterial,
      frontMat,
      sharedBackMaterial,
    ]);

    this.cardData = cardData;
    this.index = index;
    this.frontMaterial = frontMat;

    this.castShadow = true;
    this.receiveShadow = true;
  }

  setFrontTexture(texture: Texture): void {
    this.frontMaterial.map = texture;
    this.frontMaterial.color.setHex(0xffffff);
    this.frontMaterial.needsUpdate = true;
  }

  /**
   * Diễn hoạt lật lá bài 3D (R04 §6):
   * - Nhấc nhẹ lá bài lên
   * - Xoay quanh trục Y 180° để lật mặt trước lên
   * - Nếu reversed thì xoay thêm trục Z 180°
   */
  flip(engine: Engine, toReversed: boolean, onComplete?: () => void): void {
    this.isReversed = toReversed;
    this.isRevealed = true;

    if (this.activeTween) {
      this.activeTween.kill();
    }

    const startY = this.position.y;
    const targetYRot = Math.PI; // Lật mặt trước lên trên (+Y)
    const targetZRot = toReversed ? Math.PI : 0; // Đảo ngược nếu là reversed

    const tl = gsap.timeline({
      onComplete: () => {
        this.activeTween = null;
        if (onComplete) onComplete();
      },
    });

    tl.to(this.position, {
      y: startY + 0.6,
      duration: 0.35,
      ease: 'power2.out',
    })
      .to(
        this.rotation,
        {
          y: targetYRot,
          z: targetZRot,
          duration: 0.65,
          ease: 'power2.inOut',
        },
        '-=0.2',
      )
      .to(this.position, {
        y: startY,
        duration: 0.35,
        ease: 'power2.in',
      });

    this.activeTween = tl;
    engine.trackTween(tl);
  }

  /**
   * Đặt ngay tức thì về trạng thái lật xong (cho tính năng bỏ qua animation - R04 §6)
   */
  snapToRevealed(toReversed: boolean): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    this.isReversed = toReversed;
    this.isRevealed = true;
    this.rotation.y = Math.PI;
    this.rotation.z = toReversed ? Math.PI : 0;
  }

  disposeCard(): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    // Front material do Card sở hữu nên được dispose, backMaterial và edgeMaterial là dùng chung
    this.frontMaterial.dispose();
  }
}

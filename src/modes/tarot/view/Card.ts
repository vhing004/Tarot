import {
  AdditiveBlending,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
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
  color: 0xd4af37,
  emissive: 0xb8860b,
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
  private glowRimMesh: Mesh;
  private glowMaterial: MeshBasicMaterial;
  private activeTween: gsap.core.Animation | null = null;
  private glowTween: gsap.core.Tween | null = null;

  constructor(cardData: TarotCard, index: number, sharedBackMaterial: MeshStandardMaterial) {
    // Mặt trước: trắng để texture ảnh bài hiển thị đúng màu khi setFrontTexture
    const frontMat = new MeshStandardMaterial({
      color: 0xffffff,
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

    // Khung viền hào quang phát sáng ma thuật ôm quanh 4 mép cạnh lá bài
    const rimGeo = new BoxGeometry(CARD_WIDTH + 0.05, CARD_HEIGHT + 0.05, CARD_THICKNESS + 0.012);
    this.glowMaterial = new MeshBasicMaterial({
      color: 0xffeb55, // Vàng kim ánh hào quang ma thuật rực rỡ
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    this.glowRimMesh = new Mesh(rimGeo, this.glowMaterial);
    this.glowRimMesh.visible = false;
    this.add(this.glowRimMesh);
  }

  setFrontTexture(texture: Texture): void {
    this.frontMaterial.map = texture;
    this.frontMaterial.color.setHex(0xffffff);
    this.frontMaterial.emissive.setHex(0x282420);
    this.frontMaterial.emissiveIntensity = 0.35;
    this.frontMaterial.roughness = 0.3;
    this.frontMaterial.needsUpdate = true;
  }

  /**
   * Bật/tắt hiệu ứng sáng viền hào quang vàng kim khi hover
   */
  setHoverGlow(hovered: boolean, engine?: Engine): void {
    if (this.glowTween) {
      this.glowTween.kill();
    }

    if (hovered) {
      this.glowRimMesh.visible = true;
      this.glowTween = gsap.to(this.glowMaterial, {
        opacity: 0.95,
        duration: 0.22,
        ease: 'power2.out',
        onUpdate: () => {
          engine?.requestRender();
        },
      });
      gsap.to(this.glowRimMesh.scale, {
        x: 1.03,
        y: 1.03,
        z: 1.03,
        duration: 0.22,
        ease: 'power2.out',
        onUpdate: () => {
          engine?.requestRender();
        },
      });
    } else {
      this.glowTween = gsap.to(this.glowMaterial, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.inOut',
        onUpdate: () => {
          engine?.requestRender();
        },
        onComplete: () => {
          if (this.glowMaterial.opacity <= 0.01) {
            this.glowRimMesh.visible = false;
          }
          engine?.requestRender();
        },
      });
      gsap.to(this.glowRimMesh.scale, {
        x: 1.0,
        y: 1.0,
        z: 1.0,
        duration: 0.25,
        ease: 'power2.inOut',
        onUpdate: () => {
          engine?.requestRender();
        },
      });
    }
  }

  /**
   * Diễn hoạt lật lá bài 3D (R04 §6):
   * - Nhấc bổng lá bài lên khỏi mặt bàn
   * - Lật từ mặt sau (x = Math.PI/2) sang mặt trước (x = -Math.PI/2)
   * - Nếu reversed thì xoay z = Math.PI (ngược chiều), nếu upright thì z = 0 (xuôi chiều)
   */
  flip(engine: Engine, toReversed: boolean, onComplete?: () => void): void {
    this.isReversed = toReversed;
    this.isRevealed = true;

    if (this.activeTween) {
      this.activeTween.kill();
    }

    const startY = this.position.y;
    const targetXRot = -Math.PI / 2;
    const targetZRot = toReversed ? Math.PI : 0;

    const tl = gsap.timeline({
      onComplete: () => {
        this.activeTween = null;
        if (onComplete) onComplete();
      },
    });

    tl.to(this.position, {
      y: startY + 0.55,
      duration: 0.35,
      ease: 'power2.out',
    })
      .to(
        this.rotation,
        {
          x: targetXRot,
          y: 0,
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
   * Đặt ngay tức thì về trạng thái lật xong
   */
  snapToRevealed(toReversed: boolean): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    this.isReversed = toReversed;
    this.isRevealed = true;
    this.rotation.set(-Math.PI / 2, 0, toReversed ? Math.PI : 0);
  }

  disposeCard(): void {
    if (this.activeTween) {
      this.activeTween.kill();
      this.activeTween = null;
    }
    if (this.glowTween) {
      this.glowTween.kill();
      this.glowTween = null;
    }
    this.glowRimMesh.geometry.dispose();
    this.glowMaterial.dispose();
    this.frontMaterial.dispose();
  }
}

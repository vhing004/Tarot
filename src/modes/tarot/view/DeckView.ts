import {
  Group,
  MeshStandardMaterial,
  Raycaster,
  Vector2,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';
import type { TarotCard } from '@/shared/types';
import { Card3D } from '@/modes/tarot/view/Card';

export class DeckView extends Group {
  private engine: Engine;
  private cards: Card3D[] = [];
  private raycaster = new Raycaster();
  private pointer = new Vector2();
  private isInteractive = false;
  private onCardClickCallback: ((card: Card3D) => void) | null = null;
  private sharedBackMat: MeshStandardMaterial;

  constructor(engine: Engine, deckData: readonly TarotCard[], backMaterial: MeshStandardMaterial) {
    super();
    this.engine = engine;
    this.sharedBackMat = backMaterial;

    // Khởi tạo 22 lá bài 3D
    for (let i = 0; i < deckData.length; i++) {
      const cardData = deckData[i]!;
      const card = new Card3D(cardData, i, this.sharedBackMat);
      this.cards.push(card);
      this.add(card);
    }

    this.stackCardsInstant();
  }

  get allCards(): Card3D[] {
    return this.cards;
  }

  /**
   * Gom toàn bộ bài thành một chồng ngay lập tức
   */
  stackCardsInstant(): void {
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      card.position.set(0, 0.01 + i * 0.008, 0);
      card.rotation.set(-Math.PI / 2, 0, 0); // Đặt nằm úp trên mặt bàn
      card.isRevealed = false;
    }
    this.engine.requestRender();
  }

  /**
   * Animation xáo bài 3D (R04 §1):
   * Tách bài làm 2 nửa trái phải, xới lên và gom lại.
   */
  playShuffleAnimation(onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const half = Math.floor(this.cards.length / 2);

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      const isLeft = i < half;
      const offsetX = isLeft ? -1.2 : 1.2;
      const delay = (i % half) * 0.02;

      // Nhấc bài sang 2 bên
      tl.to(
        card.position,
        {
          x: offsetX,
          y: 0.3 + (i % half) * 0.01,
          duration: 0.4,
          ease: 'power2.out',
        },
        delay,
      );

      // Đan xen bài trở lại tâm
      tl.to(
        card.position,
        {
          x: 0,
          y: 0.01 + i * 0.008,
          duration: 0.4,
          ease: 'power2.inOut',
        },
        0.5 + (half - (i % half)) * 0.025,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Xòe bài hình quạt trên bàn để người chơi chọn
   */
  playSpreadAnimation(onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const total = this.cards.length;
    const radius = 2.4;
    const arcAngle = Math.PI * 0.75; // ~135 độ
    const startAngle = -arcAngle / 2;

    for (let i = 0; i < total; i++) {
      const card = this.cards[i]!;
      const ratio = i / (total - 1);
      const angle = startAngle + ratio * arcAngle;

      const targetX = Math.sin(angle) * radius;
      const targetZ = -Math.cos(angle) * (radius * 0.6) + 0.3;
      const targetY = 0.02 + i * 0.003;

      tl.to(
        card.position,
        {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 0.7,
          ease: 'power3.out',
        },
        i * 0.02,
      );

      tl.to(
        card.rotation,
        {
          x: -Math.PI / 2,
          y: 0,
          z: -angle * 0.9,
          duration: 0.7,
          ease: 'power3.out',
        },
        i * 0.02,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Di chuyển các lá bài được chọn ra khu vực đọc kết quả
   */
  positionPickedCards(pickedCards: Card3D[], onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const count = pickedCards.length;
    const spacing = 1.35;
    const startX = -((count - 1) * spacing) / 2;

    // Giấu những lá bài không được chọn
    for (const card of this.cards) {
      if (!pickedCards.includes(card)) {
        tl.to(
          card.position,
          {
            y: -0.5,
            duration: 0.5,
            ease: 'power2.in',
          },
          0,
        );
      }
    }

    // Đưa các lá được chọn vào vị trí trung tâm
    for (let i = 0; i < count; i++) {
      const card = pickedCards[i]!;
      const targetX = startX + i * spacing;

      tl.to(
        card.position,
        {
          x: targetX,
          y: 0.05,
          z: 0.4,
          duration: 0.8,
          ease: 'power2.out',
        },
        0.2 + i * 0.15,
      );

      tl.to(
        card.rotation,
        {
          x: -Math.PI / 2,
          y: 0,
          z: 0,
          duration: 0.8,
          ease: 'power2.out',
        },
        0.2 + i * 0.15,
      );
    }

    this.engine.trackTween(tl);
  }

  enableInteraction(onClick: (card: Card3D) => void): void {
    this.isInteractive = true;
    this.onCardClickCallback = onClick;
    window.addEventListener('pointerup', this.onPointerUp);
  }

  disableInteraction(): void {
    this.isInteractive = false;
    this.onCardClickCallback = null;
    window.removeEventListener('pointerup', this.onPointerUp);
  }

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.isInteractive || !this.onCardClickCallback) return;

    // Tính toán tọa độ pointer chuẩn hóa (-1 đến 1)
    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.engine.camera);
    const intersects = this.raycaster.intersectObjects(this.cards, false);

    if (intersects.length > 0) {
      const topHit = intersects[0]!.object as Card3D;
      this.onCardClickCallback(topHit);
    }
  };

  disposeDeck(): void {
    this.disableInteraction();
    for (const card of this.cards) {
      card.disposeCard();
    }
    this.cards = [];
    this.clear();
  }
}

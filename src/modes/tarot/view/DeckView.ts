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

interface CardSpreadTransform {
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
}

export class DeckView extends Group {
  private engine: Engine;
  private cards: Card3D[] = [];
  private raycaster = new Raycaster();
  private pointer = new Vector2();
  private isInteractive = false;
  private onCardClickCallback: ((card: Card3D) => void) | null = null;
  private sharedBackMat: MeshStandardMaterial;

  // Lưu lại vị trí & góc xoay gốc khi xòe quạt để phục vụ hover nhô bài
  private spreadTransforms = new Map<Card3D, CardSpreadTransform>();
  private hoveredCard: Card3D | null = null;
  private pickedCardsSet = new Set<Card3D>();

  constructor(engine: Engine, deckData: readonly TarotCard[], backMaterial: MeshStandardMaterial) {
    super();
    this.engine = engine;
    this.sharedBackMat = backMaterial;

    // Khởi tạo các lá bài 3D từ dữ liệu bộ bài
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
    this.spreadTransforms.clear();
    this.pickedCardsSet.clear();
    this.hoveredCard = null;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      // Độ lệch vi mô giữa các lá tạo độ tương phản mép viền vàng chân thực
      const microJitterX = ((i % 5) - 2) * 0.004;
      const microJitterZ = ((i % 3) - 1) * 0.005;
      const microJitterRot = ((i % 4) - 1.5) * 0.015;

      card.position.set(microJitterX, 0.01 + i * 0.013, microJitterZ);
      card.rotation.set(Math.PI / 2, 0, Math.PI + microJitterRot); // Úp mặt sau đỏ vàng (+Y) lên trên
      card.isRevealed = false;
    }
    this.engine.requestRender();
  }

  /**
   * Animation xáo bài 3D (R04 §1):
   * Tách bài làm 2 nửa trái phải, uốn cong và đan xen từng lá.
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
      const offsetX = isLeft ? -1.35 : 1.35;
      const delay = (i % half) * 0.025;
      const arcTiltZ = isLeft ? -0.2 : 0.2;

      // 1. Nhấc bài sang 2 bên và uốn cong góc nghiêng
      tl.to(
        card.position,
        {
          x: offsetX,
          y: 0.35 + (i % half) * 0.015,
          duration: 0.45,
          ease: 'power2.out',
        },
        delay,
      );

      tl.to(
        card.rotation,
        {
          x: Math.PI / 2,
          y: 0,
          z: Math.PI + arcTiltZ,
          duration: 0.45,
          ease: 'power2.out',
        },
        delay,
      );

      // 2. Đan xen bài trở lại tâm (xen kẽ từng lá rơi xuống)
      const microJitterRot = ((i % 4) - 1.5) * 0.015;
      tl.to(
        card.position,
        {
          x: ((i % 5) - 2) * 0.004,
          y: 0.01 + i * 0.013,
          z: ((i % 3) - 1) * 0.005,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        0.55 + (half - (i % half)) * 0.025,
      );

      tl.to(
        card.rotation,
        {
          x: Math.PI / 2,
          y: 0,
          z: Math.PI + microJitterRot,
          duration: 0.45,
          ease: 'power2.inOut',
        },
        0.55 + (half - (i % half)) * 0.025,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Xòe bài hình cánh cung dải quạt mượt mà trên bàn để người chơi rút bài.
   * Góc trải bài được tính toán tương thích cho cả 22 lá lẫn 78 lá.
   */
  playSpreadAnimation(onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    this.spreadTransforms.clear();
    const total = this.cards.length;
    // Bán kính và góc xòe quạt tối ưu cho tầm nhìn camera
    const isFullDeck = total > 30;
    const radius = isFullDeck ? 2.65 : 2.45;
    const arcAngle = isFullDeck ? Math.PI * 0.88 : Math.PI * 0.75;
    const startAngle = -arcAngle / 2;

    for (let i = 0; i < total; i++) {
      const card = this.cards[i]!;
      const ratio = i / (total - 1);
      const angle = startAngle + ratio * arcAngle;

      const targetX = Math.sin(angle) * radius;
      const targetZ = -Math.cos(angle) * (radius * 0.58) + 0.35;
      const targetY = 0.015 + i * 0.004; // Tăng dần nhẹ tránh z-fighting
      const rotZ = Math.PI - angle * 0.88;

      // Lưu lại tọa độ để phục vụ tương tác hover
      this.spreadTransforms.set(card, {
        x: targetX,
        y: targetY,
        z: targetZ,
        rotX: Math.PI / 2,
        rotY: 0,
        rotZ,
      });

      tl.to(
        card.position,
        {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 0.75,
          ease: 'power3.out',
        },
        i * (isFullDeck ? 0.008 : 0.02),
      );

      tl.to(
        card.rotation,
        {
          x: Math.PI / 2,
          y: 0,
          z: rotZ,
          duration: 0.75,
          ease: 'power3.out',
        },
        i * (isFullDeck ? 0.008 : 0.02),
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Diễn hoạt rút một lá bài được chọn bay lên lơ lửng rồi đáp xuống slot chỉ định
   */
  animateCardDraw(
    card: Card3D,
    slotIndex: number,
    totalSlots: number,
    onComplete?: () => void,
  ): void {
    this.pickedCardsSet.add(card);
    if (this.hoveredCard === card) {
      this.hoveredCard = null;
    }

    const spacing = 1.35;
    const startX = -((totalSlots - 1) * spacing) / 2;
    const targetX = startX + slotIndex * spacing;
    const targetY = 0.05 + slotIndex * 0.005;
    const targetZ = 0.45;

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    // 1. Nhấc bổng lá bài lên cao lơ lửng trên không trung
    tl.to(card.position, {
      y: 0.75,
      duration: 0.35,
      ease: 'power2.out',
    });

    // 2. Trôi lượn uyển chuyển về phía trước mặt người chơi vào ô chỉ định
    tl.to(
      card.position,
      {
        x: targetX,
        y: targetY,
        z: targetZ,
        duration: 0.65,
        ease: 'power2.inOut',
      },
      '-=0.1',
    );

    tl.to(
      card.rotation,
      {
        x: Math.PI / 2,
        y: 0,
        z: Math.PI,
        duration: 0.65,
        ease: 'power2.inOut',
      },
      '-=0.65',
    );

    this.engine.trackTween(tl);
  }

  /**
   * Ẩn các lá bài không được chọn (lặn êm ái xuống dưới mặt bàn)
   */
  dismissUnpickedCards(onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    let count = 0;
    for (const card of this.cards) {
      if (!this.pickedCardsSet.has(card)) {
        tl.to(
          card.position,
          {
            y: -0.6,
            duration: 0.5,
            ease: 'power2.in',
          },
          count * 0.005,
        );
        count++;
      }
    }

    this.engine.trackTween(tl);
  }

  /**
   * Đưa danh sách các lá bài đã chọn vào vị trí kết quả (dùng cho trường hợp bỏ qua animation)
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

    for (const card of this.cards) {
      if (!pickedCards.includes(card)) {
        tl.to(
          card.position,
          {
            y: -0.6,
            duration: 0.4,
            ease: 'power2.in',
          },
          0,
        );
      }
    }

    for (let i = 0; i < count; i++) {
      const card = pickedCards[i]!;
      const targetX = startX + i * spacing;

      tl.to(
        card.position,
        {
          x: targetX,
          y: 0.05,
          z: 0.45,
          duration: 0.6,
          ease: 'power2.out',
        },
        0.1 + i * 0.1,
      );

      tl.to(
        card.rotation,
        {
          x: Math.PI / 2,
          y: 0,
          z: Math.PI,
          duration: 0.6,
          ease: 'power2.out',
        },
        0.1 + i * 0.1,
      );
    }

    this.engine.trackTween(tl);
  }

  enableInteraction(onClick: (card: Card3D) => void): void {
    this.isInteractive = true;
    this.onCardClickCallback = onClick;
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
  }

  disableInteraction(): void {
    this.isInteractive = false;
    this.onCardClickCallback = null;
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);

    if (this.hoveredCard) {
      this.resetCardHover(this.hoveredCard);
      this.hoveredCard = null;
    }
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isInteractive) return;

    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.engine.camera);

    // Chỉ raycast những lá bài chưa được rút
    const unpickedCards = this.cards.filter((c) => !this.pickedCardsSet.has(c));
    const intersects = this.raycaster.intersectObjects(unpickedCards, false);

    if (intersects.length > 0) {
      const topCard = intersects[0]!.object as Card3D;
      if (this.hoveredCard !== topCard) {
        if (this.hoveredCard) {
          this.resetCardHover(this.hoveredCard);
        }
        this.hoveredCard = topCard;
        this.highlightCardHover(topCard);
      }
    } else if (this.hoveredCard) {
      this.resetCardHover(this.hoveredCard);
      this.hoveredCard = null;
    }
  };

  private highlightCardHover(card: Card3D): void {
    const t = this.spreadTransforms.get(card);
    if (!t) return;

    gsap.to(card.position, {
      y: t.y + 0.1,
      z: t.z + 0.08,
      duration: 0.2,
      ease: 'power2.out',
      overwrite: 'auto',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });
  }

  private resetCardHover(card: Card3D): void {
    const t = this.spreadTransforms.get(card);
    if (!t) return;

    gsap.to(card.position, {
      y: t.y,
      z: t.z,
      duration: 0.25,
      ease: 'power2.inOut',
      overwrite: 'auto',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });
  }

  private onPointerUp = (event: PointerEvent): void => {
    if (!this.isInteractive || !this.onCardClickCallback) return;

    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.engine.camera);
    const unpickedCards = this.cards.filter((c) => !this.pickedCardsSet.has(c));
    const intersects = this.raycaster.intersectObjects(unpickedCards, false);

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
    this.spreadTransforms.clear();
    this.pickedCardsSet.clear();
    this.clear();
  }
}

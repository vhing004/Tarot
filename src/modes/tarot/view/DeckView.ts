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

  // Lưu lại vị trí & góc xoay gốc của từng lá trong 3 hàng để phục vụ hover
  private spreadTransforms = new Map<Card3D, CardSpreadTransform>();
  private cardHoverTweens = new Map<Card3D, gsap.core.Tween>();
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
    this.clearAllHoverTweens();
    this.spreadTransforms.clear();
    this.pickedCardsSet.clear();
    this.hoveredCard = null;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      const microJitterX = ((i % 5) - 2) * 0.004;
      const microJitterZ = ((i % 3) - 1) * 0.005;
      const microJitterRot = ((i % 4) - 1.5) * 0.015;

      card.position.set(microJitterX, 0.01 + i * 0.013, microJitterZ);
      card.rotation.set(Math.PI / 2, 0, Math.PI + microJitterRot);
      card.isRevealed = false;
    }
    this.engine.requestRender();
  }

  /**
   * Animation xáo bài 3D: Tách đôi, uốn cong và đan xen từng lá bài
   */
  playShuffleAnimation(onComplete?: () => void): void {
    this.clearAllHoverTweens();
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

      // 1. Nhấc bài sang 2 bên
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

      // 2. Đan xen bài trở lại tâm
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
   * Xòe bài chia làm 3 hàng, mỗi hàng 26 lá (tổng 78 lá bài)
   * Từng hàng uốn cong hình cánh cung thoai thoải từ xa đến gần người chơi
   */
  playSpreadAnimation(onComplete?: () => void): void {
    this.clearAllHoverTweens();
    this.spreadTransforms.clear();

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const total = this.cards.length;
    // Cấu hình 3 hàng
    const rowConfigs = [
      { rowZ: -0.55, radius: 3.1, arcAngle: Math.PI * 0.72, baseY: 0.015 }, // Hàng 0 (xa nhất / trên cùng)
      { rowZ: 0.15, radius: 2.75, arcAngle: Math.PI * 0.78, baseY: 0.045 },  // Hàng 1 (ở giữa)
      { rowZ: 0.85, radius: 2.4, arcAngle: Math.PI * 0.84, baseY: 0.075 },   // Hàng 2 (gần nhất / dưới cùng)
    ];

    // Tính số lá mỗi hàng (78 lá chia thành 26 - 26 - 26; 22 lá chia 7 - 7 - 8)
    const baseCount = Math.floor(total / 3);
    const remainder = total % 3;
    const rowCounts = [
      baseCount,
      baseCount,
      baseCount + remainder,
    ];

    let cardGlobalIndex = 0;

    for (let r = 0; r < 3; r++) {
      const cfg = rowConfigs[r]!;
      const count = rowCounts[r]!;
      const startAngle = -cfg.arcAngle / 2;
      const rowStartDelay = r * 0.35; // Trải từng hàng theo nhịp vuốt của phù thủy

      for (let c = 0; c < count; c++) {
        if (cardGlobalIndex >= total) break;
        const card = this.cards[cardGlobalIndex]!;
        const ratio = count > 1 ? c / (count - 1) : 0.5;
        const angle = startAngle + ratio * cfg.arcAngle;

        const targetX = Math.sin(angle) * cfg.radius;
        const targetZ = cfg.rowZ - Math.cos(angle) * (cfg.radius * 0.22);
        const targetY = cfg.baseY + c * 0.001; // Chênh cao nhẹ tránh z-fighting
        const rotZ = Math.PI - angle * 0.85;
        const rotX = Math.PI / 2;

        this.spreadTransforms.set(card, {
          x: targetX,
          y: targetY,
          z: targetZ,
          rotX,
          rotY: 0,
          rotZ,
        });

        const cardDelay = rowStartDelay + c * 0.012;

        tl.to(
          card.position,
          {
            x: targetX,
            y: targetY,
            z: targetZ,
            duration: 0.65,
            ease: 'power3.out',
          },
          cardDelay,
        );

        tl.to(
          card.rotation,
          {
            x: rotX,
            y: 0,
            z: rotZ,
            duration: 0.65,
            ease: 'power3.out',
          },
          cardDelay,
        );

        cardGlobalIndex++;
      }
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
    this.killCardHoverTween(card);
    if (this.hoveredCard === card) {
      this.hoveredCard = null;
    }

    const spacing = 1.35;
    const startX = -((totalSlots - 1) * spacing) / 2;
    const targetX = startX + slotIndex * spacing;
    const targetY = 0.06 + slotIndex * 0.005;
    const targetZ = 0.45;

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    // 1. Nhấc bổng vút lên không trung
    tl.to(card.position, {
      y: 0.85,
      duration: 0.35,
      ease: 'power2.out',
    });

    // 2. Lượn êm ái về vị trí slot chỉ định
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
    this.clearAllHoverTweens();
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
            duration: 0.45,
            ease: 'power2.in',
          },
          count * 0.004,
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
    this.clearAllHoverTweens();
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
          y: 0.06,
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
      this.animateCardLower(this.hoveredCard);
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
          this.animateCardLower(this.hoveredCard);
        }
        this.hoveredCard = topCard;
        this.animateCardLift(topCard);
      }
    } else if (this.hoveredCard) {
      this.animateCardLower(this.hoveredCard);
      this.hoveredCard = null;
    }
  };

  /**
   * Diễn hoạt lá bài bay bổng lên cao (+0.35) mượt mà khi hover
   */
  private animateCardLift(card: Card3D): void {
    const t = this.spreadTransforms.get(card);
    if (!t) return;

    this.killCardHoverTween(card);

    const tween = gsap.to(card.position, {
      y: t.y + 0.35, // Bay bổng lên cao vượt hẳn các hàng xung quanh
      z: t.z + 0.12, // Nhích nhẹ về phía người chơi
      duration: 0.28,
      ease: 'power2.out',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    gsap.to(card.rotation, {
      x: Math.PI / 2 - 0.18, // Nghiêng góc nhìn trực diện camera
      duration: 0.28,
      ease: 'power2.out',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    this.cardHoverTweens.set(card, tween);
  }

  /**
   * Diễn hoạt lá bài hạ cánh êm ái về lại vị trí hàng ban đầu
   */
  private animateCardLower(card: Card3D): void {
    const t = this.spreadTransforms.get(card);
    if (!t) return;

    this.killCardHoverTween(card);

    const tween = gsap.to(card.position, {
      x: t.x,
      y: t.y,
      z: t.z,
      duration: 0.28,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    gsap.to(card.rotation, {
      x: t.rotX,
      y: t.rotY,
      z: t.rotZ,
      duration: 0.28,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    this.cardHoverTweens.set(card, tween);
  }

  private killCardHoverTween(card: Card3D): void {
    const existing = this.cardHoverTweens.get(card);
    if (existing) {
      existing.kill();
      this.cardHoverTweens.delete(card);
    }
  }

  private clearAllHoverTweens(): void {
    for (const t of this.cardHoverTweens.values()) {
      t.kill();
    }
    this.cardHoverTweens.clear();
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
    this.clearAllHoverTweens();
    for (const card of this.cards) {
      card.disposeCard();
    }
    this.cards = [];
    this.spreadTransforms.clear();
    this.pickedCardsSet.clear();
    this.clear();
  }
}

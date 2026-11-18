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
import { CardSparkles } from '@/modes/tarot/view/CardSparkles';

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

  // Hiệu ứng hạt ánh sáng ma thuật tóe sáng khi hover
  private sparkles: CardSparkles;

  // Lưu lại vị trí & góc xoay gốc của từng lá trong 3 hàng để phục vụ hover
  private spreadTransforms = new Map<Card3D, CardSpreadTransform>();
  private cardHoverTweens = new Map<Card3D, gsap.core.Tween>();
  private hoveredCard: Card3D | null = null;
  private pickedCardsList: Card3D[] = [];

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

    // Khởi tạo hệ thống hạt tóe sáng ma thuật
    this.sparkles = new CardSparkles(engine);
    this.add(this.sparkles);

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
    this.pickedCardsList = [];
    this.hoveredCard = null;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]!;
      card.scale.set(1, 1, 1);
      card.setHoverGlow(false);

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
      card.scale.set(1, 1, 1);
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
   */
  playSpreadAnimation(onComplete?: () => void): void {
    this.clearAllHoverTweens();
    this.spreadTransforms.clear();
    this.pickedCardsList = [];

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const total = this.cards.length;
    const rowConfigs = [
      { rowZ: -0.55, radius: 3.1, arcAngle: Math.PI * 0.72, baseY: 0.015 }, // Hàng 0 (xa nhất / trên cùng)
      { rowZ: 0.15, radius: 2.75, arcAngle: Math.PI * 0.78, baseY: 0.045 },  // Hàng 1 (ở giữa)
      { rowZ: 0.85, radius: 2.4, arcAngle: Math.PI * 0.84, baseY: 0.075 },   // Hàng 2 (gần nhất / dưới cùng)
    ];

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
      const rowStartDelay = r * 0.35;

      for (let c = 0; c < count; c++) {
        if (cardGlobalIndex >= total) break;
        const card = this.cards[cardGlobalIndex]!;
        card.scale.set(1, 1, 1);
        card.setHoverGlow(false);

        const ratio = count > 1 ? c / (count - 1) : 0.5;
        const angle = startAngle + ratio * cfg.arcAngle;

        const targetX = Math.sin(angle) * cfg.radius;
        const targetZ = cfg.rowZ - Math.cos(angle) * (cfg.radius * 0.22);
        const targetY = cfg.baseY + c * 0.001;
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
   * Khi người chơi chọn bài:
   * Lá bài được chọn sẽ BAY BỔNG VÀ TIẾN GẦN VỀ PHÍA NGƯỜI CHỌN (cận cảnh trước mắt Z ~ 3.2, Y ~ 2.1),
   * xoay góc nghiêng trực diện vuông góc với camera (0, 4, 7), tách biệt hoàn toàn khỏi mặt bàn xòe bài.
   */
  animateCardDraw(
    card: Card3D,
    slotIndex: number,
    totalSlots: number,
    onComplete?: () => void,
  ): void {
    if (!this.pickedCardsList.includes(card)) {
      this.pickedCardsList.push(card);
    }
    this.killCardHoverTween(card);
    card.setHoverGlow(false, this.engine);
    if (this.hoveredCard === card) {
      this.hoveredCard = null;
    }

    // Tọa độ cận cảnh người chọn (ngay trước mắt)
    const spacing = 1.15;
    const startX = -((totalSlots - 1) * spacing) / 2;
    const playerSlotX = startX + slotIndex * spacing;
    const playerSlotY = 2.1; // Cận cảnh tầm mắt người chơi, vượt cao hẳn bàn bói
    const playerSlotZ = 3.2; // Bay gần hẳn về phía người chọn

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    // 1. Nhấc bổng vút lên không trung
    tl.to(card.position, {
      y: 2.2,
      duration: 0.28,
      ease: 'power2.out',
    });

    // 2. Trôi lướt nhanh về ngay trước mắt người chọn và xoay trực diện camera
    tl.to(
      card.position,
      {
        x: playerSlotX,
        y: playerSlotY,
        z: playerSlotZ,
        duration: 0.62,
        ease: 'power2.inOut',
      },
      '-=0.08',
    );

    tl.to(
      card.rotation,
      {
        x: Math.PI / 2 - 0.52, // Xoay nghiêng trực diện vào góc nhìn camera (0, 4, 7)
        y: 0,
        z: Math.PI,
        duration: 0.62,
        ease: 'power2.inOut',
      },
      '-=0.62',
    );

    this.engine.trackTween(tl);
  }

  /**
   * Sau khi đã chọn xong đủ các lá bài:
   * 1. Toàn bộ các lá bài thừa thu nhỏ (scale 0.5) và trượt về cạnh tay phù thủy (X ~ 1.6, Z ~ -1.3), dọn sạch mặt bàn
   * 2. Các lá bài đang ở gần người chọn đồng loạt BAY RA GIỮA BÀN (Z ~ 0.25, Y ~ 0.05),
   * sẵn sàng cho hoạt cảnh lật bài (Inspect)
   */
  dismissUnpickedCards(onComplete?: () => void): void {
    this.clearAllHoverTweens();
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    // Tọa độ cọc bài thu gọn bên cạnh tay phải phù thủy
    const witchHandX = 1.6;
    const witchHandZ = -1.3;
    const baseWitchY = 0.02;

    const pickedSet = new Set(this.pickedCardsList);
    let stackIndex = 0;

    // 1. Thu nhỏ và gom toàn bộ bài thừa về cạnh tay phù thủy
    for (const card of this.cards) {
      if (!pickedSet.has(card)) {
        const targetY = baseWitchY + stackIndex * 0.002;
        const microRot = ((stackIndex % 5) - 2) * 0.015;

        tl.to(
          card.position,
          {
            x: witchHandX,
            y: targetY,
            z: witchHandZ,
            duration: 0.65,
            ease: 'power3.inOut',
          },
          stackIndex * 0.004,
        );

        tl.to(
          card.scale,
          {
            x: 0.5,
            y: 0.5,
            z: 0.5,
            duration: 0.65,
            ease: 'power3.inOut',
          },
          stackIndex * 0.004,
        );

        tl.to(
          card.rotation,
          {
            x: Math.PI / 2,
            y: 0,
            z: Math.PI + microRot,
            duration: 0.65,
            ease: 'power3.inOut',
          },
          stackIndex * 0.004,
        );

        stackIndex++;
      }
    }

    // 2. Sau khi bài thừa dọn sạch, các lá bài đã chọn từ trước mắt người chơi BAY RA GIỮA BÀN BÓI
    const count = this.pickedCardsList.length;
    const spacing = 1.3;
    const startX = -((count - 1) * spacing) / 2;
    const landTimeStart = Math.min(0.5, stackIndex * 0.004 + 0.15);

    for (let i = 0; i < count; i++) {
      const card = this.pickedCardsList[i]!;
      const targetX = startX + i * spacing;
      const targetY = 0.05;
      const targetZ = 0.25; // Chính giữa mặt bàn bói

      tl.to(
        card.position,
        {
          x: targetX,
          y: targetY,
          z: targetZ,
          duration: 0.7,
          ease: 'power2.inOut',
        },
        landTimeStart + i * 0.08,
      );

      tl.to(
        card.rotation,
        {
          x: Math.PI / 2,
          y: 0,
          z: Math.PI,
          duration: 0.7,
          ease: 'power2.inOut',
        },
        landTimeStart + i * 0.08,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Đưa danh sách các lá bài đã chọn vào vị trí kết quả (dùng cho trường hợp bỏ qua animation)
   */
  positionPickedCards(pickedCards: Card3D[], onComplete?: () => void): void {
    this.clearAllHoverTweens();
    this.pickedCardsList = [...pickedCards];
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const witchHandX = 1.6;
    const witchHandZ = -1.3;
    let stackIdx = 0;

    for (const card of this.cards) {
      if (!pickedCards.includes(card)) {
        card.scale.set(0.5, 0.5, 0.5);
        tl.to(
          card.position,
          {
            x: witchHandX,
            y: 0.02 + stackIdx * 0.002,
            z: witchHandZ,
            duration: 0.45,
            ease: 'power2.inOut',
          },
          0,
        );
        stackIdx++;
      }
    }

    const count = pickedCards.length;
    const spacing = 1.3;
    const startX = -((count - 1) * spacing) / 2;

    for (let i = 0; i < count; i++) {
      const card = pickedCards[i]!;
      card.scale.set(1, 1, 1);
      const targetX = startX + i * spacing;

      tl.to(
        card.position,
        {
          x: targetX,
          y: 0.05,
          z: 0.25,
          duration: 0.5,
          ease: 'power2.out',
        },
        0.1 + i * 0.08,
      );

      tl.to(
        card.rotation,
        {
          x: Math.PI / 2,
          y: 0,
          z: Math.PI,
          duration: 0.5,
          ease: 'power2.out',
        },
        0.1 + i * 0.08,
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

    const pickedSet = new Set(this.pickedCardsList);
    const unpickedCards = this.cards.filter((c) => !pickedSet.has(c));
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
   * Diễn hoạt lá bài bay bổng lên cao (+0.35) mượt mà, sáng viền và tóe sáng ma thuật
   */
  private animateCardLift(card: Card3D): void {
    const t = this.spreadTransforms.get(card);
    if (!t) return;

    this.killCardHoverTween(card);

    // 1. Kích hoạt hiệu ứng sáng viền vàng kim
    card.setHoverGlow(true, this.engine);

    // 2. Kích hoạt chùm hạt ánh sáng ma thuật tóe sáng lấp lánh
    this.sparkles.triggerBurst(card.position.x, card.position.y + 0.25, card.position.z);

    // 3. Bay bổng lên cao vượt hẳn các hàng xung quanh
    const tween = gsap.to(card.position, {
      y: t.y + 0.35,
      z: t.z + 0.12,
      duration: 0.28,
      ease: 'power2.out',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    gsap.to(card.rotation, {
      x: Math.PI / 2 - 0.18,
      duration: 0.28,
      ease: 'power2.out',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    this.cardHoverTweens.set(card, tween);
  }

  /**
   * Diễn hoạt lá bài hạ cánh êm ái về lại vị trí hàng ban đầu và tắt sáng viền
   */
  private animateCardLower(card: Card3D): void {
    const t = this.spreadTransforms.get(card);
    if (!t) return;

    this.killCardHoverTween(card);

    // Tắt viền sáng hào quang
    card.setHoverGlow(false, this.engine);

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
    const pickedSet = new Set(this.pickedCardsList);
    const unpickedCards = this.cards.filter((c) => !pickedSet.has(c));
    const intersects = this.raycaster.intersectObjects(unpickedCards, false);

    if (intersects.length > 0) {
      const topHit = intersects[0]!.object as Card3D;
      this.onCardClickCallback(topHit);
    }
  };

  disposeDeck(): void {
    this.disableInteraction();
    this.clearAllHoverTweens();
    this.sparkles.disposeSparkles();
    for (const card of this.cards) {
      card.disposeCard();
    }
    this.cards = [];
    this.spreadTransforms.clear();
    this.pickedCardsList = [];
    this.clear();
  }
}

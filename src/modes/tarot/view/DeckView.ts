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

  // === Quản lý danh sách bài (R04 §1, Spec §6) ===
  // availableCards: lá bài chưa được chọn — cập nhật tức thì khi người dùng click
  private availableCards: Card3D[] = [];
  // selectedCards: lá bài đã được chọn theo đúng thứ tự [slot0, slot1, slot2]
  private selectedCards: Card3D[] = [];

  // Cờ khóa click khi lá bài đang di chuyển Bézier (Spec §6 chống spam)
  private isMoving = false;

  // Theo dõi thao tác vuốt lướt bộ bài trên màn hình cảm ứng điện thoại (Spec §4)
  private pointerDownX = 0;
  private pointerDownY = 0;
  private isPointerDown = false;
  private isSwipingDeck = false;
  private deckPanTween: gsap.core.Tween | null = null;

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
   * Danh sách lá bài đã được chọn theo thứ tự [slot0, slot1, slot2].
   * Dùng bởi TarotMode để gom bài thừa và lật bài.
   */
  get pickedCardsList(): Card3D[] {
    return this.selectedCards;
  }

  /**
   * Gom toàn bộ bài thành một chồng ngay lập tức
   */
  stackCardsInstant(): void {
    this.clearAllHoverTweens();
    this.spreadTransforms.clear();
    this.availableCards = [];
    this.selectedCards = [];
    this.isMoving = false;
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
   * Xòe bài chia làm 3 hàng đan xen, mỗi hàng ~26 lá (tổng 78 lá bài)
   */
  playSpreadAnimation(onComplete?: () => void): void {
    this.clearAllHoverTweens();
    this.spreadTransforms.clear();
    this.availableCards = [];
    this.selectedCards = [];
    this.isMoving = false;

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const total = this.cards.length;
    const rowConfigs = [
      { rowZ: -0.70, radius: 3.1, arcAngle: Math.PI * 0.72, baseY: 0.015 }, // Hàng 0 (xa nhất / gần phù thủy)
      { rowZ: 0.05, radius: 2.75, arcAngle: Math.PI * 0.78, baseY: 0.045 },  // Hàng 1 (giữa — lùi ra khỏi tâm bàn)
      { rowZ: 0.95, radius: 2.4, arcAngle: Math.PI * 0.84, baseY: 0.075 },   // Hàng 2 (gần người chơi nhất)
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

        // Mọi lá bài sau khi trải ra đều là available
        this.availableCards.push(card);

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
   * 1. Loại tức thì khỏi availableCards, thêm vào selectedCards (R04 §1, Spec §6).
   * 2. Cờ isMoving = true để khóa click trong lúc di chuyển.
   * 3. Lá bài vút lên cao (Y=2.1, Z=3.2) vuông góc tầm mắt camera — không đè bàn xòe.
   * 4. Gọi onSlotTargeted ngay sau khi click để bật hiệu ứng slot.
   * 5. Gọi onComplete sau khi hạ cánh thành công vào vị trí slot — mở lại isMoving.
   */
  animateCardDraw(
    card: Card3D,
    slotIndex: number,
    totalSlots: number,
    onSlotTargeted?: () => void,
    onComplete?: () => void,
  ): void {
    // Loại khỏi available ngay lập tức (đảm bảo không trùng lặp)
    const idx = this.availableCards.indexOf(card);
    if (idx >= 0) this.availableCards.splice(idx, 1);

    if (!this.selectedCards.includes(card)) {
      this.selectedCards.push(card);
    }

    // Nâng renderOrder để lá được chọn luôn hiển thị trên các lá khác
    card.renderOrder = 10 + this.selectedCards.length;
    card.traverse((child) => { child.renderOrder = card.renderOrder; });

    // Khóa click khi di chuyển
    this.isMoving = true;

    this.killCardHoverTween(card);
    card.setHoverGlow(false, this.engine);
    if (this.hoveredCard === card) {
      this.hoveredCard = null;
    }

    // Tọa độ vị trí cận cảnh người chọn thích ứng linh hoạt theo màn hình (desktop vs mobile)
    const camY = this.engine.camera.position.y;
    const camZ = this.engine.camera.position.z;
    const fitFactor = camZ / 7.0; // Hệ số thích ứng từ camera
    const isMobile = window.innerWidth < 640 || window.innerWidth < window.innerHeight;

    const spacing = isMobile ? Math.min(0.85, (window.innerWidth / 480) * 0.8) : 1.05;
    const startX = -((totalSlots - 1) * spacing) / 2;
    const playerSlotX = startX + slotIndex * spacing;
    const playerSlotY = 1.1 * fitFactor;  // Độ cao phía trước bàn bói, tương ứng NDC y ≈ -0.7
    const playerSlotZ = 4.2 * fitFactor;  // Bay gần hẳn về phía người chọn (ra ngoài mặt bàn xòe bài)

    // Góc nghiêng để mặt sau bài nhìn thẳng trực diện vào camera:
    const targetRx = Math.PI - Math.atan((camY - playerSlotY) / (camZ - playerSlotZ));
    const cardScale = isMobile ? Math.min(0.72, 0.58 * fitFactor) : 0.78;

    // Thông báo slot ngay khi bắt đầu di chuyển
    if (onSlotTargeted) onSlotTargeted();

    const tl = gsap.timeline({
      onUpdate: () => {
        this.engine.requestRender();
      },
      onComplete: () => {
        // Mở lại khóa khi lá bài đã đến vị trí cận cảnh
        this.isMoving = false;
        if (onComplete) onComplete();
      },
    });

    // 1. Nhấc bổng lá bài lên khỏi mặt bàn
    tl.to(card.position, {
      y: card.position.y + 0.45,
      duration: 0.25,
      ease: 'power2.out',
      onUpdate: () => { this.engine.requestRender(); },
    });

    // 2. Trôi lướt về ngay trước mắt người chọn, xoay trực diện camera và thu nhẹ kích thước
    tl.to(
      card.position,
      {
        x: playerSlotX,
        y: playerSlotY,
        z: playerSlotZ,
        duration: 0.65,
        ease: 'power2.inOut',
        onUpdate: () => { this.engine.requestRender(); },
      },
      '-=0.08',
    );

    tl.to(
      card.rotation,
      {
        x: targetRx,
        y: 0,
        z: Math.PI,
        duration: 0.65,
        ease: 'power2.inOut',
        onUpdate: () => { this.engine.requestRender(); },
      },
      '-=0.65',
    );

    tl.to(
      card.scale,
      {
        x: cardScale,
        y: cardScale,
        z: cardScale,
        duration: 0.65,
        ease: 'power2.inOut',
        onUpdate: () => { this.engine.requestRender(); },
      },
      '-=0.65',
    );

    this.engine.trackTween(tl);
  }

  /**
   * Sau khi người dùng nhấn nút "Xác nhận lựa chọn":
   * @param pickedCards - Danh sách 3 lá đã chọn (truyền từ TarotMode để đảm bảo đồng bộ).
   *                      Nếu không truyền thì dùng this.selectedCards nội bộ.
   * 1. Thu nhỏ toàn bộ bài thừa (scale 0.5) về cạnh tay phù thủy.
   * 2. Lướt 3 lá đã chọn từ cận cảnh (Y~2.1, Z~3.2) ra tâm bàn bói (Y~0.05, Z~0.25).
   * onUpdate đặt trên ticker tổng để render liên tục trong toàn bộ animation.
   */
  dismissUnpickedCards(pickedCards?: Card3D[], onComplete?: () => void): void {
    this.clearAllHoverTweens();

    // Đồng bộ selectedCards nếu caller truyền vào tường minh
    if (pickedCards && pickedCards.length > 0) {
      this.selectedCards = [...pickedCards];
    }

    const selectedSet = new Set(this.selectedCards);

    // Kích hoạt render liên tục trong suốt animation (render-on-demand — R03 §2)
    const renderTicker = gsap.ticker.add(() => {
      this.engine.requestRender();
    });

    const tl = gsap.timeline({
      onUpdate: () => {
        this.engine.requestRender();
      },
      onComplete: () => {
        gsap.ticker.remove(renderTicker);
        if (onComplete) onComplete();
      },
    });

    // Tọa độ cọc bài thu gọn bên cạnh tay phải phù thủy
    const witchHandX = 1.6;
    const witchHandZ = -1.3;
    const baseWitchY = 0.02;
    let stackIndex = 0;

    // 1. Thu nhỏ và gom toàn bộ bài thừa về cạnh tay phù thủy
    for (const card of this.cards) {
      if (!selectedSet.has(card)) {
        const targetY = baseWitchY + stackIndex * 0.002;
        const microRot = ((stackIndex % 5) - 2) * 0.015;
        const t = stackIndex * 0.003;

        tl.to(card.position, { x: witchHandX, y: targetY, z: witchHandZ, duration: 0.55, ease: 'power3.inOut' }, t);
        tl.to(card.scale, { x: 0.5, y: 0.5, z: 0.5, duration: 0.55, ease: 'power3.inOut' }, t);
        tl.to(card.rotation, { x: Math.PI / 2, y: 0, z: Math.PI + microRot, duration: 0.55, ease: 'power3.inOut' }, t);

        stackIndex++;
      }
    }

    // 2. Sau khi bài thừa dọn sạch, 3 lá bài đã chọn bay từ cận cảnh ra giữa bàn bói
    const count = this.selectedCards.length;
    const spacing = 1.3;
    const startX = -((count - 1) * spacing) / 2;
    // Bắt đầu di chuyển sớm hơn — không cần đợi 75 lá gom xong mới bắt đầu
    const landTimeStart = 0.3;

    for (let i = 0; i < count; i++) {
      const card = this.selectedCards[i]!;
      const targetX = startX + i * spacing;

      // Reset renderOrder khi hạ cánh để tránh artifact z-ordering sau này
      tl.call(() => {
        card.renderOrder = 0;
        card.traverse((child) => { child.renderOrder = 0; });
      }, undefined, landTimeStart + i * 0.1 + 0.74);

      tl.to(
        card.position,
        { x: targetX, y: 0.05, z: 0.25, duration: 0.75, ease: 'power2.inOut' },
        landTimeStart + i * 0.1,
      );

      tl.to(
        card.rotation,
        { x: Math.PI / 2, y: 0, z: Math.PI, duration: 0.75, ease: 'power2.inOut' },
        landTimeStart + i * 0.1,
      );

      tl.to(
        card.scale,
        { x: 1, y: 1, z: 1, duration: 0.75, ease: 'power2.inOut' },
        landTimeStart + i * 0.1,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Đưa danh sách các lá bài đã chọn vào vị trí kết quả (dùng cho trường hợp bỏ qua animation)
   */
  positionPickedCards(pickedCards: Card3D[], onComplete?: () => void): void {
    this.clearAllHoverTweens();
    this.selectedCards = [...pickedCards];
    // Cập nhật available = tất cả card trừ selectedCards
    const selectedSet = new Set(this.selectedCards);
    this.availableCards = this.cards.filter((c) => !selectedSet.has(c));

    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    const witchHandX = 1.6;
    const witchHandZ = -1.3;
    let stackIdx = 0;

    for (const card of this.cards) {
      if (!selectedSet.has(card)) {
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
    window.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
  }

  disableInteraction(): void {
    this.isInteractive = false;
    this.onCardClickCallback = null;
    this.isPointerDown = false;
    this.isSwipingDeck = false;
    window.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    window.removeEventListener('pointercancel', this.onPointerCancel);

    if (this.hoveredCard) {
      this.animateCardLower(this.hoveredCard);
      this.hoveredCard = null;
    }
  }

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.isInteractive || this.isMoving) return;
    this.isPointerDown = true;
    this.isSwipingDeck = false;
    this.pointerDownX = event.clientX;
    this.pointerDownY = event.clientY;

    if (this.deckPanTween) {
      this.deckPanTween.kill();
      this.deckPanTween = null;
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.isInteractive) return;

    // Nếu đang giữ chạm: kiểm tra cử chỉ vuốt/lướt bộ bài ngang
    if (this.isPointerDown) {
      const dx = event.clientX - this.pointerDownX;
      const dy = event.clientY - this.pointerDownY;
      const dist = Math.hypot(dx, dy);

      // Nếu di chuyển quá 8px -> kích hoạt chế độ lướt bộ bài
      if (dist > 8) {
        this.isSwipingDeck = true;
        if (this.hoveredCard) {
          this.animateCardLower(this.hoveredCard);
          this.hoveredCard = null;
        }

        // Xoay nhẹ cụm bài theo chiều ngang trong biên độ an toàn [-0.28, 0.28] rad (~16 độ)
        const panFactor = (dx / (window.innerWidth || 400)) * 0.45;
        this.rotation.y = Math.max(-0.28, Math.min(0.28, panFactor));
        this.engine.requestRender();
        return;
      }
    }

    // Trên thiết bị cảm ứng khi đang lướt bài thì bỏ qua hover
    if (event.pointerType === 'touch' && this.isSwipingDeck) return;

    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.engine.camera);

    // Chỉ hover bài nằm trong availableCards (chưa được chọn)
    const intersects = this.raycaster.intersectObjects(this.availableCards, false);

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
   * Diễn hoạt lá bài bay bổng lên cao mượt mà, sáng viền và tóe sáng ma thuật
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

  private onPointerUp = (event: PointerEvent): void => {
    const wasSwiping = this.isSwipingDeck;
    this.isPointerDown = false;
    this.isSwipingDeck = false;

    // Nếu vừa thực hiện thao tác vuốt lướt bộ bài: đàn hồi êm ái góc xoay về 0
    if (wasSwiping) {
      this.deckPanTween = gsap.to(this.rotation, {
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate: () => {
          this.engine.requestRender();
        },
      });
      return; // Không chọn bài khi đang vuốt lướt
    }

    // Khóa click khi đang di chuyển bài hoặc không còn tương tác
    if (!this.isInteractive || !this.onCardClickCallback || this.isMoving) return;

    const rect = this.engine.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.engine.camera);

    // Chỉ cho phép click vào bài nằm trong availableCards
    const intersects = this.raycaster.intersectObjects(this.availableCards, false);

    if (intersects.length > 0) {
      const topHit = intersects[0]!.object as Card3D;
      // Kiểm tra lần nữa chắc chắn không trùng (defence in depth)
      if (!this.selectedCards.includes(topHit)) {
        this.onCardClickCallback(topHit);
      }
    }
  };

  private onPointerCancel = (): void => {
    this.isPointerDown = false;
    this.isSwipingDeck = false;
    if (Math.abs(this.rotation.y) > 0.001) {
      this.deckPanTween = gsap.to(this.rotation, {
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
        onUpdate: () => {
          this.engine.requestRender();
        },
      });
    }
  };

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

  disposeDeck(): void {
    this.disableInteraction();
    this.clearAllHoverTweens();
    if (this.deckPanTween) {
      this.deckPanTween.kill();
      this.deckPanTween = null;
    }
    this.rotation.set(0, 0, 0);
    this.sparkles.disposeSparkles();
    for (const card of this.cards) {
      card.disposeCard();
    }
    this.cards = [];
    this.spreadTransforms.clear();
    this.availableCards = [];
    this.selectedCards = [];
    this.clear();
  }
}

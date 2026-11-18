import {
  AmbientLight,
  CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
} from 'three';
import { disposeObject } from '@/core/dispose';
import { StateMachine } from '@/core/StateMachine';
import { cryptoRandom } from '@/core/Random';
import { AssetLoader } from '@/core/AssetLoader';
import type { Mode, ModeContext } from '@/modes/Mode';
import type { DrawnCard, Reading, TarotCard, Topic } from '@/shared/types';
import cardsJson from '@/modes/tarot/data/cards.json';
import { drawCards } from '@/modes/tarot/logic/deck';
import { TAROT_SPREADS, type TarotSpreadType } from '@/modes/tarot/logic/spreads';
import { buildTarotInterpretation } from '@/modes/tarot/logic/interpret';
import { Card3D } from '@/modes/tarot/view/Card';
import { DeckView } from '@/modes/tarot/view/DeckView';
import { SmokeParticles } from '@/core/SmokeParticles';
import { QuestionForm, type QuestionFormData } from '@/ui/QuestionForm';
import { ReadingPanel } from '@/ui/ReadingPanel';
import { CardInspectOverlay } from '@/modes/tarot/ui/CardInspectOverlay';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';

type TarotFsmState =
  | 'INTRO'
  | 'QUESTION'
  | 'SHUFFLE'
  | 'SPREAD'
  | 'PICK'
  | 'INSPECT'
  | 'SAVE'
  | 'READING';

export class TarotMode implements Mode {
  readonly id = 'tarot';

  private ctx: ModeContext | null = null;
  private group = new Group();
  private fsm = new StateMachine<TarotFsmState>();
  private assetLoader = new AssetLoader();

  // Đồ họa 3D cảnh bàn bói
  private candleLight: PointLight | null = null;
  private candleMat: MeshStandardMaterial | null = null;
  private smokeParticles: SmokeParticles | null = null;
  private flickerTime = 0;
  private unregisterUpdater: (() => void) | null = null;

  // Deck và thẻ bài 3D
  private deckView: DeckView | null = null;
  private deckData: TarotCard[] = cardsJson as TarotCard[];
  private sharedBackMaterial: MeshStandardMaterial | null = null;

  // Dữ liệu lượt bói hiện tại
  private currentQuestion = '';
  private currentTopic: Topic = 'general';
  private currentSpread: TarotSpreadType = 'single';
  private targetPositions: readonly string[] = ['present'];
  private drawnCardsResult: DrawnCard[] = [];
  private pickedCards3D: Card3D[] = [];
  private currentInterpretation = '';
  private currentReadingRecord: Reading | null = null;

  // UI Components
  private questionForm: QuestionForm | null = null;
  private readingPanel: ReadingPanel | null = null;
  private inspectOverlay: CardInspectOverlay | null = null;
  private currentInspectIndex = 0;
  private statusBarEl: HTMLElement | null = null;
  private skipBtnEl: HTMLElement | null = null;

  async init(ctx: ModeContext): Promise<void> {
    this.ctx = ctx;

    // 0. Ánh sáng môi trường — đủ sáng để thấy lá bài, vẫn giữ không khí huyền bí
    const ambientLight = new AmbientLight(0x3a2060, 1.8); // tím xanh huyền bí, cường độ vừa đủ
    this.group.add(ambientLight);

    // 1. Dựng bàn bói tròn
    const tableGeo = new CylinderGeometry(3.2, 3.2, 0.2, 36);
    const tableMat = new MeshStandardMaterial({
      color: 0x0d0820,
      roughness: 0.9,
      metalness: 0.05,
    });
    const tableMesh = new Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, -0.1, 0);
    tableMesh.receiveShadow = true;
    this.group.add(tableMesh);

    // 2. Thân nến & ngọn lửa
    const candleGeo = new CylinderGeometry(0.08, 0.08, 0.45, 16);
    const candleBodyMat = new MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.5,
      metalness: 0.3,
    });
    const candleMesh = new Mesh(candleGeo, candleBodyMat);
    candleMesh.position.set(0, 0.225, -1.3);
    this.group.add(candleMesh);

    const flameGeo = new SphereGeometry(0.05, 12, 12);
    flameGeo.scale(1, 1.8, 1);
    this.candleMat = new MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff6600,
      emissiveIntensity: 1.5,
    });
    const flameMesh = new Mesh(flameGeo, this.candleMat);
    flameMesh.position.set(0, 0.5, -1.3);
    this.group.add(flameMesh);

    this.candleLight = new PointLight(0xffaa44, 2.2, 7, 1.5);
    this.candleLight.position.set(0, 0.55, -1.3);
    this.group.add(this.candleLight);

    // Khói trầm hương bốc lên từ ngọn nến, số hạt theo cấu hình Quality (R03 §5)
    const qualityLevel = ctx.quality.getLevel();
    this.smokeParticles = new SmokeParticles(0, 0.5, -1.3, qualityLevel);
    // Tạm dừng ngay nếu người dùng bật reducedMotion
    if (ctx.reducedMotion) this.smokeParticles.pause();
    this.group.add(this.smokeParticles);

    // 3. Tạo texture mặt sau bài bằng Canvas API (procedural — không cần file tĩnh)
    // Nền đỏ tươi/crimson sáng + viền vàng sáng để tương phản rõ ràng với bàn tím đen
    const backTex = this.createCardBackTexture();
    this.sharedBackMaterial = new MeshStandardMaterial({
      map: backTex,
      color: 0xffffff,       // TRẮNG: không nhân tối texture — màu canvas hiển thị đúng 100%
      emissive: 0xcc1122,    // đỏ sáng phát ra từ lá bài
      emissiveIntensity: 0.5,
      roughness: 0.6,
      metalness: 0.0,
    });

    // 4. Khởi tạo DeckView 22 lá bài 3D
    this.deckView = new DeckView(ctx.engine, this.deckData, this.sharedBackMaterial);
    this.group.add(this.deckView);

    // 5. Thiết lập máy trạng thái (FSM)
    this.setupStateMachine();
  }

  enter(): void {
    if (!this.ctx) return;
    this.ctx.engine.scene.add(this.group);
    this.unregisterUpdater = this.ctx.engine.registerUpdater((dt) => this.update(dt));

    // Bắt đầu từ trạng thái INTRO -> QUESTION
    this.fsm.go('INTRO');
    this.ctx.engine.requestRender();
  }

  private setupStateMachine(): void {
    this.fsm
      .addState('INTRO', {
        enter: () => {
          this.deckView?.stackCardsInstant();
          this.fsm.go('QUESTION');
        },
      })
      .addState('QUESTION', {
        enter: () => {
          this.hideStatusBar();
          this.hideSkipButton();
          this.deckView?.stackCardsInstant();

          const uiRoot = document.getElementById('app-ui');
          if (uiRoot && this.ctx) {
            this.questionForm = new QuestionForm({
              onSubmit: (data: QuestionFormData) => {
                this.currentQuestion = data.question;
                this.currentTopic = data.topic;
                this.currentSpread = data.spread;
                const def = TAROT_SPREADS[data.spread];
                this.targetPositions = def ? def.positions : ['present'];
                this.questionForm?.unmount();
                this.fsm.go('SHUFFLE');
              },
              onCancel: () => {
                this.ctx?.onExitToMenu();
              },
            });
            this.questionForm.mount(uiRoot);
          }
        },
        exit: () => {
          this.questionForm?.unmount();
          this.questionForm = null;
        },
      })
      .addState('SHUFFLE', {
        enter: () => {
          // CHỐT KẾT QUẢ BÓI TRƯỚC BẰNG CSPRNG (R04 §1)
          this.drawnCardsResult = drawCards(this.deckData, this.targetPositions, cryptoRandom);
          this.pickedCards3D = [];

          this.ctx?.audio.playShuffle();

          this.showStatusBar(this.ctx?.t('tarot_status_shuffle') ?? 'Đang xáo bài...');
          this.showSkipButton(() => {
            this.fsm.go('SPREAD');
          });

          this.deckView?.playShuffleAnimation(() => {
            this.fsm.go('SPREAD');
          });
        },
      })
      .addState('SPREAD', {
        enter: () => {
          this.showStatusBar(this.ctx?.t('tarot_status_spread') ?? 'Đang trải bài...');
          this.deckView?.playSpreadAnimation(() => {
            this.fsm.go('PICK');
          });
        },
      })
      .addState('PICK', {
        enter: () => {
          const count = this.targetPositions.length;
          const statusText = (this.ctx?.t('tarot_status_pick') ?? 'Chạm chọn {count} lá bài...').replace(
            '{count}',
            count.toString(),
          );
          this.showStatusBar(statusText);
          this.hideSkipButton();

          this.deckView?.enableInteraction((card: Card3D) => {
            this.handleCardPicked(card);
          });
        },
        exit: () => {
          this.deckView?.disableInteraction();
        },
      })
      .addState('INSPECT', {
        enter: () => {
          this.hideStatusBar();
          // Nút bỏ qua: snap tất cả lá về trạng thái lật rồi chuyển thẳng sang SAVE
          this.showSkipButton(() => {
            this.snapAllCardsToRevealed();
            this.fsm.go('SAVE');
          });
          this.currentInspectIndex = 0;
          void this.inspectStep();
        },
        exit: () => {
          this.hideSkipButton();
          this.inspectOverlay?.unmount();
          this.inspectOverlay = null;
        },
      })
      .addState('SAVE', {
        enter: () => {
          this.hideStatusBar();
          this.hideSkipButton();

          // Tạo tổng hợp lời giải
          this.currentInterpretation = buildTarotInterpretation(
            this.drawnCardsResult,
            this.currentTopic,
            this.currentQuestion,
          );

          // Tạo bản ghi Reading và lưu vào repository (R01 §8, R06 §3)
          const readingRecord: Reading = {
            id: `tarot_${Date.now()}_${cryptoRandom.nextInt(10000)}`,
            mode: 'tarot',
            question: this.currentQuestion,
            topic: this.currentTopic,
            createdAt: Date.now(),
            result: {
              spread: this.currentSpread,
              cards: this.drawnCardsResult,
            },
            interpretation: this.currentInterpretation,
          };
          this.currentReadingRecord = readingRecord;

          if (this.ctx) {
            this.ctx.repo.save(readingRecord).catch((err: unknown) => {
              console.error('Không thể lưu lượt bói Tarot:', err);
            });
          }

          this.fsm.go('READING');
        },
      })
      .addState('READING', {
        enter: () => {
          this.ctx?.audio.playChime();

          const uiRoot = document.getElementById('app-ui');
          if (uiRoot && this.ctx) {
            this.readingPanel = new ReadingPanel({
              onRetry: () => {
                this.readingPanel?.unmount();
                this.fsm.go('QUESTION');
              },
              onExit: () => {
                this.ctx?.onExitToMenu();
              },
              onSaveNotes: async (notes: string) => {
                if (this.currentReadingRecord && this.ctx) {
                  this.currentReadingRecord.notes = notes;
                  await this.ctx.repo.save(this.currentReadingRecord);
                }
              },
            });
            this.readingPanel.mount(
              uiRoot,
              this.drawnCardsResult,
              this.currentInterpretation,
              this.currentReadingRecord ?? undefined,
            );
          }
        },
        exit: () => {
          this.readingPanel?.unmount();
          this.readingPanel = null;
        },
      });
  }

  private handleCardPicked(card: Card3D): void {
    if (this.pickedCards3D.includes(card)) return;

    this.pickedCards3D.push(card);
    const needCount = this.targetPositions.length;

    // Nhấc nhẹ lá bài vừa chọn lên báo hiệu
    card.position.y += 0.15;
    this.ctx?.engine.requestRender();

    if (this.pickedCards3D.length >= needCount) {
      this.deckView?.disableInteraction();
      this.deckView?.positionPickedCards(this.pickedCards3D, () => {
        this.fsm.go('INSPECT');
      });
    }
  }

  private async inspectStep(): Promise<void> {
    if (!this.ctx) return;
    const total = this.pickedCards3D.length;
    if (this.currentInspectIndex >= total) {
      this.fsm.go('SAVE');
      return;
    }

    const card3D = this.pickedCards3D[this.currentInspectIndex];
    const drawnData = this.drawnCardsResult[this.currentInspectIndex];
    if (!card3D || !drawnData) {
      this.fsm.go('SAVE');
      return;
    }

    // 1. Tải texture mặt trước (lazy load - R03 §6)
    const texture = await this.assetLoader.loadTexture(drawnData.card.image);
    card3D.setFrontTexture(texture);

    // 2. Lật lá bài này
    this.ctx.audio.playCardFlip();
    await new Promise<void>((resolve) => {
      if (!this.ctx) {
        resolve();
        return;
      }
      card3D.flip(this.ctx.engine, drawnData.reversed, () => {
        resolve();
      });
    });

    // 3. Hiển thị CardInspectOverlay (docs/tarot_game_development_guide.md mục 9)
    const uiRoot = document.getElementById('app-ui');
    if (!uiRoot) return;

    const isLast = this.currentInspectIndex >= total - 1;
    const nextDrawn = !isLast ? this.drawnCardsResult[this.currentInspectIndex + 1] : undefined;
    const nextPosLabel = nextDrawn ? (POSITION_LABELS_VI[nextDrawn.position] ?? nextDrawn.position) : undefined;

    this.inspectOverlay?.unmount();
    this.inspectOverlay = new CardInspectOverlay({
      isLastCard: isLast,
      nextPositionLabel: nextPosLabel,
      onNext: () => {
        this.currentInspectIndex++;
        if (this.currentInspectIndex >= total) {
          this.fsm.go('SAVE');
        } else {
          void this.inspectStep();
        }
      },
    });

    this.inspectOverlay.mount(uiRoot, drawnData, this.currentInspectIndex, total);
  }

  private snapAllCardsToRevealed(): void {
    // Snap nhanh tất cả lá về trạng thái lật (dùng khi người dùng bỏ qua INSPECT)
    for (let i = 0; i < this.pickedCards3D.length; i++) {
      const card3D = this.pickedCards3D[i]!;
      const drawnData = this.drawnCardsResult[i];
      if (drawnData) {
        card3D.snapToRevealed(drawnData.reversed);
      }
    }
    this.ctx?.engine.requestRender();
  }

  private showStatusBar(text: string): void {
    if (!this.statusBarEl) {
      this.statusBarEl = document.createElement('div');
      this.statusBarEl.className = 'tarot-status-bar';
      const uiRoot = document.getElementById('app-ui');
      uiRoot?.appendChild(this.statusBarEl);
    }
    this.statusBarEl.textContent = text;
    this.statusBarEl.style.display = 'block';
  }

  private hideStatusBar(): void {
    if (this.statusBarEl) {
      this.statusBarEl.style.display = 'none';
    }
  }

  private showSkipButton(onSkip: () => void): void {
    if (!this.skipBtnEl) {
      this.skipBtnEl = document.createElement('button');
      this.skipBtnEl.className = 'tarot-skip-btn';
      this.skipBtnEl.textContent = this.ctx?.t('btn_skip_anim') ?? 'Bỏ qua chuyển động';
      const uiRoot = document.getElementById('app-ui');
      uiRoot?.appendChild(this.skipBtnEl);
    }
    this.skipBtnEl.onclick = onSkip;
    this.skipBtnEl.style.display = 'block';
  }

  private hideSkipButton(): void {
    if (this.skipBtnEl) {
      this.skipBtnEl.style.display = 'none';
    }
  }

  update(dt: number): void {
    // Nến chập chờn bằng dao động cường độ sáng (R03 §2)
    this.flickerTime += dt * 8;
    const wave = Math.sin(this.flickerTime) * 0.2 + Math.cos(this.flickerTime * 2.3) * 0.15;

    if (this.candleLight) {
      this.candleLight.intensity = Math.max(1.0, 2.2 + wave);
    }
    if (this.candleMat) {
      this.candleMat.emissiveIntensity = Math.max(0.8, 1.5 + wave);
    }

    this.smokeParticles?.update(dt);

    this.fsm.update(dt);
    this.ctx?.engine.requestRender();
  }

  exit(): void {
    if (this.unregisterUpdater) {
      this.unregisterUpdater();
      this.unregisterUpdater = null;
    }

    this.fsm.dispose();
    this.questionForm?.unmount();
    this.questionForm = null;
    this.readingPanel?.unmount();
    this.readingPanel = null;
    this.inspectOverlay?.unmount();
    this.inspectOverlay = null;
    this.hideStatusBar();
    this.hideSkipButton();

    if (this.statusBarEl) {
      this.statusBarEl.remove();
      this.statusBarEl = null;
    }
    if (this.skipBtnEl) {
      this.skipBtnEl.remove();
      this.skipBtnEl = null;
    }

    this.group.removeFromParent();
  }

  dispose(): void {
    this.exit();
    if (this.deckView) {
      this.deckView.disposeDeck();
      this.deckView = null;
    }
    if (this.sharedBackMaterial) {
      this.sharedBackMaterial.dispose();
      this.sharedBackMaterial = null;
    }
    this.assetLoader.dispose();
    if (this.smokeParticles) {
      this.smokeParticles.disposeParticles();
      this.smokeParticles = null;
    }
    disposeObject(this.group);
    this.candleLight = null;
    this.candleMat = null;
    this.ctx = null;
  }

  /**
   * Tạo texture mặt sau lá bài bằng Canvas API (procedural, không cần file tĩnh).
   * Màu nền xanh tím sâu + viền vàng + hoa văn hình học để tương phản mạnh với bàn tối (R03 §6).
   * Vùng view — được phép dùng Math.random cho hiệu ứng hạt trang trí (R04 §2).
   */
  private createCardBackTexture(): CanvasTexture {
    const W = 256;
    const H = 440;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // 1. Nền đỏ crimson/scarlet sáng — rõ ràng khác bàn tím đen 0x0a0618
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0,   '#c0152a');  // đỏ tươi sáng
    bg.addColorStop(0.5, '#8b0020');  // đỏ sâu giữa
    bg.addColorStop(1,   '#c0152a');  // đỏ tươi sáng
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // 2. Viền vàng ngoài cùng — dày, sáng
    ctx.strokeStyle = '#ffe44d';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);

    // 3. Viền trong — đường kép
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // 4. Hình thoi trung tâm — fill đỏ tươi để nổi bật
    const cx = W / 2;
    const cy = H / 2;
    ctx.save();
    // Fill thoi lớn màu đỏ tươi hơn nền
    ctx.beginPath();
    ctx.moveTo(cx, cy - 80);
    ctx.lineTo(cx + 55, cy);
    ctx.lineTo(cx, cy + 80);
    ctx.lineTo(cx - 55, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(220, 30, 50, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#ffe44d';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hình thoi nhỏ bên trong
    ctx.beginPath();
    ctx.moveTo(cx, cy - 50);
    ctx.lineTo(cx + 34, cy);
    ctx.lineTo(cx, cy + 50);
    ctx.lineTo(cx - 34, cy);
    ctx.closePath();
    ctx.strokeStyle = '#fff0a0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 5. Ngôi sao 8 cánh ở tâm
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = '#ffe44d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 24, Math.sin(angle) * 24);
      ctx.stroke();
    }
    // Vòng tròn tâm — vàng sáng nổi bật
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ff2244';
    ctx.fill();
    ctx.restore();

    // 6. Hoa văn góc — tròn vàng + nhân đỏ tươi
    const corners = [
      [22, 28],
      [W - 22, 28],
      [22, H - 28],
      [W - 22, H - 28],
    ] as const;
    for (const [x, y] of corners) {
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd700';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ff2244';
      ctx.fill();
      ctx.restore();
    }

    // 7. Chấm sáng ngẫu nhiên (tinh tú) — hiệu ứng thẩm mỹ, dùng Math.random được (R04 §2 view/)
    ctx.fillStyle = 'rgba(255, 248, 200, 0.85)';
    for (let i = 0; i < 40; i++) {
      const sx = 20 + Math.random() * (W - 40);
      const sy = 20 + Math.random() * (H - 40);
      const r = Math.random() * 1.5 + 0.4;
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    return new CanvasTexture(canvas);
  }
}

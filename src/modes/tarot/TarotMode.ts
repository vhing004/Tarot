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
import { TarotReader3D } from '@/modes/tarot/view/TarotReader3D';
import { SmokeParticles } from '@/core/SmokeParticles';
import { QuestionForm, type QuestionFormData } from '@/ui/QuestionForm';
import { ReadingPanel } from '@/ui/ReadingPanel';
import { CardInspectOverlay } from '@/modes/tarot/ui/CardInspectOverlay';
import { TarotSlotsOverlay } from '@/modes/tarot/ui/TarotSlotsOverlay';
import { POSITION_LABELS_VI } from '@/modes/tarot/logic/spreads';
import { resolveAssetUrl } from '@/shared/constants';

type TarotFsmState =
  | 'INTRO'
  | 'QUESTION'
  | 'SHUFFLE'
  | 'SPREAD'
  | 'SELECTING'   // Người dùng đang chọn từng lá bài
  | 'READY'       // Đã chọn đủ — hiển thị nút "Xác nhận lựa chọn"
  | 'INSPECT'     // Lần lượt lật và xem chi tiết từng lá
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

  // Nhân vật Thầy Bói 3D
  private tarotReader: TarotReader3D | null = null;

  // Deck và thẻ bài 3D
  private deckView: DeckView | null = null;
  private deckData: TarotCard[] = cardsJson as TarotCard[];
  private activeDeckData: TarotCard[] = [];
  private sharedBackMaterial: MeshStandardMaterial | null = null;

  // Dữ liệu lượt bói hiện tại
  private currentQuestion = '';
  private currentTopic: Topic = 'general';
  private currentSpread: TarotSpreadType = 'three';
  private currentDeckType: 'major' | 'full' = 'full';
  private targetPositions: readonly string[] = ['past', 'present', 'future'];
  private drawnCardsResult: DrawnCard[] = [];
  private pickedCards3D: Card3D[] = [];
  private currentInterpretation = '';
  private currentReadingRecord: Reading | null = null;

  // UI Components
  private questionForm: QuestionForm | null = null;
  private readingPanel: ReadingPanel | null = null;
  private inspectOverlay: CardInspectOverlay | null = null;
  private slotsOverlay: TarotSlotsOverlay | null = null;
  private currentInspectIndex = 0;
  private statusBarEl: HTMLElement | null = null;
  private skipBtnEl: HTMLElement | null = null;

  async init(ctx: ModeContext): Promise<void> {
    this.ctx = ctx;

    // 0. Ánh sáng môi trường — đủ sáng để thấy lá bài, vẫn giữ không khí huyền bí
    const ambientLight = new AmbientLight(0x3a2060, 1.8); // tím xanh huyền bí
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

    // Khói trầm hương bốc lên từ ngọn nến (R03 §5)
    const qualityLevel = ctx.quality.getLevel();
    this.smokeParticles = new SmokeParticles(0, 0.5, -1.3, qualityLevel);
    if (ctx.reducedMotion) this.smokeParticles.pause();
    this.group.add(this.smokeParticles);

    // 3. Nhân vật Thầy Bói Tarot 3D (ngồi đối diện người chơi)
    this.tarotReader = new TarotReader3D(ctx.engine);
    this.group.add(this.tarotReader);

    // 4. Tạo texture mặt sau bài bằng Canvas API (procedural — không cần file tĩnh)
    const backTex = this.createCardBackTexture();
    this.sharedBackMaterial = new MeshStandardMaterial({
      map: backTex,
      color: 0xffffff,
      emissive: 0xcc1122,
      emissiveIntensity: 0.5,
      roughness: 0.6,
      metalness: 0.0,
    });

    // 5. Khởi tạo DeckView với toàn bộ 78 lá bài
    this.activeDeckData = this.deckData; // Mặc định 78 lá
    this.deckView = new DeckView(ctx.engine, this.activeDeckData, this.sharedBackMaterial);
    this.group.add(this.deckView);

    // 6. Thiết lập máy trạng thái (FSM)
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
          this.tarotReader?.resetPoseInstant();
          this.fsm.go('QUESTION');
        },
      })
      .addState('QUESTION', {
        enter: () => {
          this.hideStatusBar();
          this.hideSkipButton();
          this.slotsOverlay?.unmount();
          this.slotsOverlay = null;
          this.deckView?.stackCardsInstant();
          this.tarotReader?.resetPoseInstant();

          const uiRoot = document.getElementById('app-ui');
          if (uiRoot && this.ctx) {
            this.questionForm = new QuestionForm({
              onSubmit: (data: QuestionFormData) => {
                this.currentQuestion = data.question;
                this.currentTopic = data.topic;
                this.currentSpread = data.spread;
                this.currentDeckType = data.deckType;

                if (data.deckType === 'full') {
                  this.activeDeckData = this.deckData;
                } else {
                  this.activeDeckData = this.deckData.filter((c) => c.suit === 'major');
                }

                // Cập nhật lại DeckView nếu số lá thay đổi
                if (this.deckView && this.ctx && this.sharedBackMaterial) {
                  if (this.deckView.allCards.length !== this.activeDeckData.length) {
                    this.deckView.disposeDeck();
                    this.deckView.removeFromParent();
                    this.deckView = new DeckView(this.ctx.engine, this.activeDeckData, this.sharedBackMaterial);
                    this.group.add(this.deckView);
                  }
                }

                const def = TAROT_SPREADS[data.spread];
                this.targetPositions = def ? def.positions : ['past', 'present', 'future'];
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
          // CHỐT KẾT QUẢ BÓI TRƯỚC BẰNG CSPRNG TỪ ACTIVE DECK (R04 §1)
          this.drawnCardsResult = drawCards(this.activeDeckData, this.targetPositions, cryptoRandom);
          this.pickedCards3D = [];

          this.ctx?.audio.playShuffle();

          this.showStatusBar(this.ctx?.t('tarot_status_shuffle') ?? 'Phù thủy đang xáo bài...');
          this.showSkipButton(() => {
            this.fsm.go('SPREAD');
          });

          // Phù thủy cử động tay xáo bài ma thuật đồng bộ với hiệu ứng tách đan bài 3D
          this.tarotReader?.playShuffleGesture(2.2);

          this.deckView?.playShuffleAnimation(() => {
            this.fsm.go('SPREAD');
          });
        },
      })
      .addState('SPREAD', {
        enter: () => {
          this.showStatusBar(this.ctx?.t('tarot_status_spread') ?? 'Phù thủy đang trải 3 hàng bài trên bàn bói...');
          this.showSkipButton(() => {
            this.fsm.go('SELECTING');
          });

          // Phù thủy lướt vuốt tay 3 nhịp trải rộng 3 hàng bài ra bàn
          this.tarotReader?.playSpreadGesture(1.6);

          this.deckView?.playSpreadAnimation(() => {
            this.fsm.go('SELECTING');
          });
        },
      })
      .addState('SELECTING', {
        enter: () => {
          this.hideSkipButton();
          this.updatePickStatusBar();

          // Khởi tạo và hiển thị khu vực 3 Slot nhận bài
          const uiRoot = document.getElementById('app-ui');
          if (uiRoot) {
            this.slotsOverlay = new TarotSlotsOverlay({
              onConfirm: () => {
                // Người dùng bấm "Xác nhận lựa chọn" -> chuyển sang READY để gom bài và lật
                this.fsm.go('READY');
              },
            });
            this.slotsOverlay.mount(uiRoot, this.currentSpread);
          }

          // Phù thủy thu tay về cử chỉ mời rút bài trang nghiêm
          this.tarotReader?.playInviteGesture();

          this.deckView?.enableInteraction((card: Card3D) => {
            this.handleCardPicked(card);
          });
        },
        exit: () => {
          this.deckView?.disableInteraction();
        },
      })
      .addState('READY', {
        // Đã chọn đủ 3 lá — người dùng bấm nút Xác nhận -> gom bài thừa và lật bài
        enter: () => {
          this.hideStatusBar();
          this.slotsOverlay?.hideConfirmButton();
          this.slotsOverlay?.hide();

          // Nút bỏ qua: snap tất cả về trạng thái cuối ngay lập tức
          this.showSkipButton(() => {
            this.slotsOverlay?.hide();
            this.deckView?.positionPickedCards(this.pickedCards3D);
            void this.snapAllCardsToRevealed().then(() => {
              this.fsm.go('SAVE');
            });
          });

          // Truyền pickedCards3D tường minh để DeckView đảm bảo đúng danh sách
          this.deckView?.dismissUnpickedCards(this.pickedCards3D, () => {
            this.fsm.go('INSPECT');
          });
        },
        exit: () => {
          this.hideSkipButton();
        },
      })
      .addState('INSPECT', {
        enter: () => {
          this.hideStatusBar();
          // Nút bỏ qua: tải texture và snap tất cả lá về trạng thái lật rồi chuyển thẳng sang SAVE
          this.showSkipButton(() => {
            void this.snapAllCardsToRevealed().then(() => {
              this.fsm.go('SAVE');
            });
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
              deckType: this.currentDeckType,
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

  /**
   * Cập nhật thanh trạng thái gợi ý chọn bài tiếp theo
   */
  private updatePickStatusBar(): void {
    const total = this.targetPositions.length;
    const current = this.pickedCards3D.length;

    if (current >= total) {
      this.showStatusBar(this.ctx?.t('tarot_status_pick_done') ?? 'Đã rút đủ các lá bài. Xác nhận lựa chọn để lật bài...');
      return;
    }

    const nextPosKey = this.targetPositions[current] ?? 'present';
    const nextPosLabel = POSITION_LABELS_VI[nextPosKey] ?? nextPosKey;

    if (total === 1) {
      const txt = (this.ctx?.t('tarot_status_pick') ?? 'Hãy lắng nghe trực giác và chạm chọn {count} lá bài trên bàn.').replace(
        '{count}',
        '1',
      );
      this.showStatusBar(txt);
    } else {
      const template =
        this.ctx?.t('tarot_status_pick_prompt') ??
        'Đã rút {current}/{total} lá. Hãy chọn lá bài cho vị trí: {position}.';
      const formatted = template
        .replace('{current}', current.toString())
        .replace('{total}', total.toString())
        .replace('{position}', nextPosLabel);
      this.showStatusBar(formatted);
    }
  }

  /**
   * Xử lý khi người dùng click chọn một lá bài.
   * Khóa click khi isMoving (DeckView quản lý). Chống spam và trùng lặp lá.
   */
  private handleCardPicked(card: Card3D): void {
    if (this.pickedCards3D.includes(card)) return;

    const slotIndex = this.pickedCards3D.length;
    const needCount = this.targetPositions.length;

    // Không cho phép chọn thêm khi đã đủ
    if (slotIndex >= needCount) return;

    this.pickedCards3D.push(card);

    // Âm thanh rút bài
    this.ctx?.audio.playChime();

    // Báo slot đang được nhắm đến ngay khi click
    const slots = this.slotsOverlay;
    const capturedSlotIndex = slotIndex;

    // Diễn hoạt lá bài bay lên và vào vị trí cận cảnh người chọn
    this.deckView?.animateCardDraw(
      card,
      slotIndex,
      needCount,
      () => {
        // Callback ngay khi bắt đầu di chuyển: bật hiệu ứng slot đang nhắm đến
        slots?.targetSlot(capturedSlotIndex);
      },
      () => {
        // Callback khi lá bài đến vị trí cận cảnh: xác nhận slot đã nhận bài
        slots?.fillSlot(capturedSlotIndex);
        this.ctx?.engine.requestRender();
        this.updatePickStatusBar();
      },
    );

    // Khi người chơi đã rút đủ số lá bài -> chuyển sang trạng thái READY
    if (this.pickedCards3D.length >= needCount) {
      this.deckView?.disableInteraction();
      this.updatePickStatusBar();
      // Chờ slotsOverlay hiển thị nút Xác nhận (nút xuất hiện khi fillSlot đủ 3 lần)
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
    const texture = await this.assetLoader.loadTexture(resolveAssetUrl(drawnData.card.image));
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

    this.inspectOverlay.mount(
      uiRoot,
      drawnData,
      this.currentInspectIndex,
      total,
      this.currentTopic,
      this.currentQuestion,
    );
  }

  private async snapAllCardsToRevealed(): Promise<void> {
    for (let i = 0; i < this.pickedCards3D.length; i++) {
      const card3D = this.pickedCards3D[i]!;
      const drawnData = this.drawnCardsResult[i];
      if (drawnData) {
        const texture = await this.assetLoader.loadTexture(resolveAssetUrl(drawnData.card.image));
        card3D.setFrontTexture(texture);
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
    this.slotsOverlay?.unmount();
    this.slotsOverlay = null;
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
    if (this.tarotReader) {
      this.tarotReader.disposeReader();
      this.tarotReader.removeFromParent();
      this.tarotReader = null;
    }
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
   * Màu nền đỏ tươi/crimson + viền vàng + hoa văn hình học tương phản mạnh với bàn tối (R03 §6).
   * Vùng view — được phép dùng Math.random cho hiệu ứng hạt sao trang trí (R04 §2).
   */
  private createCardBackTexture(): CanvasTexture {
    const W = 256;
    const H = 440;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // 1. Nền đỏ crimson/scarlet sáng
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#c81b30');
    bg.addColorStop(0.5, '#910022');
    bg.addColorStop(1, '#c81b30');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Viền mép ngoài cùng tối màu tạo độ tương phản tách biệt giữa các lá xếp đè nhau
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);

    // 2. Viền vàng ngoài cùng — dày, sáng
    ctx.strokeStyle = '#ffe44d';
    ctx.lineWidth = 7;
    ctx.strokeRect(6, 6, W - 12, H - 12);

    // 3. Viền trong — đường kép
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(18, 18, W - 36, H - 36);

    // 4. Hình thoi trung tâm — fill đỏ tươi để nổi bật
    const cx = W / 2;
    const cy = H / 2;
    ctx.save();
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

    // 7. Chấm sáng ngẫu nhiên (tinh tú) — hiệu ứng thẩm mỹ view/ (R04 §2)
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

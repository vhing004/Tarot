import {
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
import { QuestionForm, type QuestionFormData } from '@/ui/QuestionForm';
import { ReadingPanel } from '@/ui/ReadingPanel';

type TarotFsmState =
  | 'INTRO'
  | 'QUESTION'
  | 'SHUFFLE'
  | 'SPREAD'
  | 'PICK'
  | 'REVEAL'
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

  // UI Components
  private questionForm: QuestionForm | null = null;
  private readingPanel: ReadingPanel | null = null;
  private statusBarEl: HTMLElement | null = null;
  private skipBtnEl: HTMLElement | null = null;

  async init(ctx: ModeContext): Promise<void> {
    this.ctx = ctx;

    // 1. Dựng bàn bói tròn
    const tableGeo = new CylinderGeometry(3.2, 3.2, 0.2, 36);
    const tableMat = new MeshStandardMaterial({
      color: 0x181024,
      roughness: 0.85,
      metalness: 0.1,
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

    // 3. Tải texture mặt sau bài
    const backTexture = await this.assetLoader.loadTexture('/textures/tarot/back.webp');
    this.sharedBackMaterial = new MeshStandardMaterial({
      map: backTexture,
      roughness: 0.5,
      metalness: 0.1,
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
      .addState('REVEAL', {
        enter: () => {
          this.showStatusBar(this.ctx?.t('tarot_status_reveal') ?? 'Đang lật bài...');
          this.showSkipButton(() => {
            this.snapAllCardsToRevealed();
            this.fsm.go('SAVE');
          });

          void this.revealCardsSequentially();
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
            });
            this.readingPanel.mount(uiRoot, this.drawnCardsResult, this.currentInterpretation);
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
        this.fsm.go('REVEAL');
      });
    }
  }

  private async revealCardsSequentially(): Promise<void> {
    if (!this.ctx) return;

    for (let i = 0; i < this.pickedCards3D.length; i++) {
      const card3D = this.pickedCards3D[i]!;
      const drawnData = this.drawnCardsResult[i]!;

      // Nạp texture mặt trước theo yêu cầu (lazy load - R03 §6)
      const texture = await this.assetLoader.loadTexture(drawnData.card.image);
      card3D.setFrontTexture(texture);

      await new Promise<void>((resolve) => {
        if (!this.ctx) {
          resolve();
          return;
        }
        card3D.flip(this.ctx.engine, drawnData.reversed, () => {
          resolve();
        });
      });
    }

    if (this.fsm.current === 'REVEAL') {
      this.fsm.go('SAVE');
    }
  }

  private snapAllCardsToRevealed(): void {
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
    this.readingPanel?.unmount();
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
    disposeObject(this.group);
    this.candleLight = null;
    this.candleMat = null;
    this.ctx = null;
  }
}

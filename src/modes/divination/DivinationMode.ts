import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from 'three';
import { disposeObject } from '@/core/dispose';
import { StateMachine } from '@/core/StateMachine';
import { cryptoRandom } from '@/core/Random';
import type { Mode, ModeContext } from '@/modes/Mode';
import type { CoinLine, Reading, Topic } from '@/shared/types';
import { buildKeys, castHexagram } from '@/modes/divination/logic/hexagram';
import { lookupHexagram } from '@/modes/divination/logic/lookup';
import { buildDivinationInterpretation } from '@/modes/divination/logic/interpret';
import { Coin3D } from '@/modes/divination/view/Coin';
import { HexagramView } from '@/modes/divination/view/HexagramView';
import { SmokeParticles } from '@/core/SmokeParticles';
import { QuestionForm, type QuestionFormData } from '@/ui/QuestionForm';
import { ReadingPanel } from '@/ui/ReadingPanel';

type DivinationFsmState =
  | 'INTRO'
  | 'QUESTION'
  | 'CONCENTRATE'
  | 'THROW'
  | 'BUILD'
  | 'CHANGE'
  | 'SAVE'
  | 'READING';

export class DivinationMode implements Mode {
  readonly id = 'divination';

  private ctx: ModeContext | null = null;
  private group = new Group();
  private fsm = new StateMachine<DivinationFsmState>();

  // Đồ họa bàn bói & ánh sáng
  private candleLight: PointLight | null = null;
  private candleMat: MeshStandardMaterial | null = null;
  private smokeParticles: SmokeParticles | null = null;
  private flickerTime = 0;
  private unregisterUpdater: (() => void) | null = null;

  // View đồng xu & vạch hào
  private coins: Coin3D[] = [];
  private hexagramView: HexagramView | null = null;

  // Dữ liệu bói toán
  private currentQuestion = '';
  private currentTopic: Topic = 'general';
  private lines: CoinLine[] = [];
  private primaryKey = '';
  private changedKey: string | null = null;
  private movingLines: number[] = [];
  private currentThrowIndex = 0;
  private currentInterpretation = '';
  private currentReadingRecord: Reading | null = null;

  // UI elements
  private questionForm: QuestionForm | null = null;
  private readingPanel: ReadingPanel | null = null;
  private statusBarEl: HTMLElement | null = null;
  private actionBtnEl: HTMLElement | null = null;
  private skipBtnEl: HTMLElement | null = null;

  async init(ctx: ModeContext): Promise<void> {
    this.ctx = ctx;

    // 1. Chiếu bói bát giác
    const tableGeo = new CylinderGeometry(3.2, 3.2, 0.2, 8);
    const tableMat = new MeshStandardMaterial({
      color: 0x14121c,
      roughness: 0.85,
      metalness: 0.2,
    });
    const tableMesh = new Mesh(tableGeo, tableMat);
    tableMesh.position.set(0, -0.1, 0);
    tableMesh.receiveShadow = true;
    this.group.add(tableMesh);

    // 2. Đĩa đựng đồng xu bằng đồng cổ ở giữa bàn
    const plateGeo = new CylinderGeometry(1.2, 1.05, 0.08, 32);
    const plateMat = new MeshStandardMaterial({
      color: 0x5a482d,
      roughness: 0.45,
      metalness: 0.7,
    });
    const plateMesh = new Mesh(plateGeo, plateMat);
    plateMesh.position.set(0.6, 0.04, 0);
    plateMesh.receiveShadow = true;
    this.group.add(plateMesh);

    // 3. Khởi tạo 3 đồng xu 3D
    const coinPositions = [
      { x: 0.35, z: -0.2 },
      { x: 0.85, z: -0.2 },
      { x: 0.6, z: 0.25 },
    ];
    for (let i = 0; i < 3; i++) {
      const pos = coinPositions[i]!;
      const coin = new Coin3D(i, pos.x, pos.z);
      this.coins.push(coin);
      this.group.add(coin);
    }

    // 4. Bảng hào HexagramView
    this.hexagramView = new HexagramView();
    this.group.add(this.hexagramView);

    // 5. Nến thần bí
    const candleGeo = new CylinderGeometry(0.07, 0.07, 0.4, 16);
    const candleMat = new MeshStandardMaterial({
      color: 0x8b2500,
      roughness: 0.6,
    });
    const candleMesh = new Mesh(candleGeo, candleMat);
    candleMesh.position.set(1.8, 0.2, -1.2);
    this.group.add(candleMesh);

    this.candleMat = new MeshStandardMaterial({
      color: 0xffaa33,
      emissive: 0xff5500,
      emissiveIntensity: 1.6,
    });
    const flameGeo = new CylinderGeometry(0.01, 0.05, 0.1, 12);
    const flameMesh = new Mesh(flameGeo, this.candleMat);
    flameMesh.position.set(1.8, 0.45, -1.2);
    this.group.add(flameMesh);

    this.candleLight = new PointLight(0xff9933, 2.2, 7, 1.5);
    this.candleLight.position.set(1.8, 0.5, -1.2);
    this.group.add(this.candleLight);

    // Khói trầm hương bốc lên cạnh nến, số hạt theo cấu hình Quality (R03 §5)
    const qualityLevel = ctx.quality.getLevel();
    this.smokeParticles = new SmokeParticles(1.8, 0.45, -1.2, qualityLevel);
    // Tạm dừng ngay nếu người dùng bật reducedMotion
    if (ctx.reducedMotion) this.smokeParticles.pause();
    this.group.add(this.smokeParticles);

    // 6. Thiết lập StateMachine
    this.setupStateMachine();
  }

  enter(): void {
    if (!this.ctx) return;
    this.ctx.engine.scene.add(this.group);
    this.unregisterUpdater = this.ctx.engine.registerUpdater((dt) => this.update(dt));

    this.fsm.go('INTRO');
    this.ctx.engine.requestRender();
  }

  private setupStateMachine(): void {
    this.fsm
      .addState('INTRO', {
        enter: () => {
          this.hexagramView?.clearLines();
          this.fsm.go('QUESTION');
        },
      })
      .addState('QUESTION', {
        enter: () => {
          this.hideStatusBar();
          this.hideActionButton();
          this.hideSkipButton();
          this.hexagramView?.clearLines();

          const uiRoot = document.getElementById('app-ui');
          if (uiRoot && this.ctx) {
            this.questionForm = new QuestionForm({
              onSubmit: (data: QuestionFormData) => {
                this.currentQuestion = data.question;
                this.currentTopic = data.topic;
                this.questionForm?.unmount();
                this.fsm.go('CONCENTRATE');
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
      .addState('CONCENTRATE', {
        enter: () => {
          // CHỐT KẾT QUẢ TRƯỚC BẰNG CSPRNG (R04 §1, §4)
          this.lines = castHexagram(cryptoRandom);
          const keys = buildKeys(this.lines);
          this.primaryKey = keys.primaryKey;
          this.changedKey = keys.changedKey;
          this.movingLines = keys.movingLines;
          this.currentThrowIndex = 0;

          this.showStatusBar(this.ctx?.t('divination_status_concentrate') ?? 'Định tâm chiêm bái...');
          this.showActionButton(this.ctx?.t('divination_btn_start') ?? 'Bắt đầu gieo quẻ', () => {
            this.hideActionButton();
            this.fsm.go('THROW');
          });

          this.showSkipButton(() => {
            this.snapAllThrows();
            this.fsm.go('SAVE');
          });
        },
      })
      .addState('THROW', {
        enter: () => {
          this.hideActionButton();
          void this.performCurrentThrow();
        },
      })
      .addState('BUILD', {
        enter: () => {
          this.showStatusBar(this.ctx?.t('divination_status_build') ?? 'Đang dựng Quẻ Chủ...');
          setTimeout(() => {
            if (this.fsm.current !== 'BUILD') return;
            if (this.changedKey !== null) {
              this.fsm.go('CHANGE');
            } else {
              this.fsm.go('SAVE');
            }
          }, 1200);
        },
      })
      .addState('CHANGE', {
        enter: () => {
          this.showStatusBar(this.ctx?.t('divination_status_change') ?? 'Đang biến đổi hào động...');
          if (this.ctx && this.hexagramView) {
            this.hexagramView.transformMovingLines(this.ctx.engine, () => {
              setTimeout(() => {
                if (this.fsm.current === 'CHANGE') {
                  this.fsm.go('SAVE');
                }
              }, 800);
            });
          } else {
            this.fsm.go('SAVE');
          }
        },
      })
      .addState('SAVE', {
        enter: () => {
          this.hideStatusBar();
          this.hideActionButton();
          this.hideSkipButton();

          const primaryHex = lookupHexagram(this.primaryKey);
          const changedHex = this.changedKey ? lookupHexagram(this.changedKey) : null;

          this.currentInterpretation = buildDivinationInterpretation(
            {
              lines: this.lines,
              primaryKey: this.primaryKey,
              changedKey: this.changedKey,
              movingLines: this.movingLines,
            },
            primaryHex,
            changedHex,
            this.currentTopic,
            this.currentQuestion,
          );

          // Lưu lượt gieo quẻ vào LocalRepository (R01 §8, R06 §3)
          const readingRecord: Reading = {
            id: `divination_${Date.now()}_${cryptoRandom.nextInt(10000)}`,
            mode: 'divination',
            question: this.currentQuestion,
            topic: this.currentTopic,
            createdAt: Date.now(),
            result: {
              lines: this.lines,
              primaryKey: this.primaryKey,
              changedKey: this.changedKey,
              movingLines: this.movingLines,
            },
            interpretation: this.currentInterpretation,
          };
          this.currentReadingRecord = readingRecord;

          if (this.ctx) {
            this.ctx.repo.save(readingRecord).catch((err: unknown) => {
              console.error('Không thể lưu lượt gieo quẻ Kinh Dịch:', err);
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
            const primaryHex = lookupHexagram(this.primaryKey);
            const changedHex = this.changedKey ? lookupHexagram(this.changedKey) : null;

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

            this.readingPanel.mountDivination(
              uiRoot,
              primaryHex,
              changedHex,
              this.movingLines,
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

  private async performCurrentThrow(): Promise<void> {
    if (!this.ctx || this.currentThrowIndex >= 6) return;

    const line = this.lines[this.currentThrowIndex]!;
    const lineNum = this.currentThrowIndex + 1;

    const statusTemplate =
      this.ctx.t('divination_status_throw') ?? 'Lần gieo thứ {current}/6: Đang tung 3 đồng xu...';
    this.showStatusBar(statusTemplate.replace('{current}', lineNum.toString()));

    // Tung 3 đồng xu diễn hoạt theo đúng kết quả đã chốt (R04 §6)
    this.ctx.audio.playCoinDrop();

    const coinPromises = this.coins.map((coin, idx) => {
      const faceUp = line.coins[idx] === 3; // 3 là ngửa, 2 là sấp
      const delay = idx * 0.08;
      return new Promise<void>((resolve) => {
        coin.toss(this.ctx!.engine, faceUp, delay, () => {
          resolve();
        });
      });
    });

    await Promise.all(coinPromises);

    // Vẽ hào tương ứng từ DƯỚI LÊN (R04 §4)
    this.hexagramView?.addLine(this.currentThrowIndex, line, this.ctx.engine);
    this.currentThrowIndex++;

    if (this.currentThrowIndex < 6) {
      // Cho phép bấm tiếp hoặc tự động tiếp tục
      this.showActionButton(this.ctx.t('btn_throw_next') ?? 'Gieo hào tiếp theo', () => {
        this.hideActionButton();
        void this.performCurrentThrow();
      });
    } else {
      setTimeout(() => {
        if (this.fsm.current === 'THROW') {
          this.fsm.go('BUILD');
        }
      }, 800);
    }
  }

  private snapAllThrows(): void {
    if (!this.ctx || !this.hexagramView) return;

    this.hexagramView.clearLines();
    for (let i = 0; i < 6; i++) {
      const line = this.lines[i]!;
      this.hexagramView.addLine(i, line, this.ctx.engine);
    }

    // Đặt 3 xu theo lần gieo cuối
    const lastLine = this.lines[5]!;
    for (let j = 0; j < 3; j++) {
      this.coins[j]?.snap(lastLine.coins[j] === 3);
    }

    this.currentThrowIndex = 6;
    this.ctx.engine.requestRender();
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

  private showActionButton(text: string, onClick: () => void): void {
    if (!this.actionBtnEl) {
      this.actionBtnEl = document.createElement('button');
      this.actionBtnEl.className = 'btn btn-primary divination-action-btn';
      const uiRoot = document.getElementById('app-ui');
      uiRoot?.appendChild(this.actionBtnEl);
    }
    this.actionBtnEl.textContent = text;
    this.actionBtnEl.onclick = onClick;
    this.actionBtnEl.style.display = 'block';
  }

  private hideActionButton(): void {
    if (this.actionBtnEl) {
      this.actionBtnEl.style.display = 'none';
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
    this.flickerTime += dt * 7;
    const wave = Math.sin(this.flickerTime * 1.5) * 0.25;

    if (this.candleLight) {
      this.candleLight.intensity = Math.max(1.0, 2.2 + wave);
    }
    if (this.candleMat) {
      this.candleMat.emissiveIntensity = Math.max(0.8, 1.6 + wave);
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
    this.readingPanel?.unmount();
    this.hideStatusBar();
    this.hideActionButton();
    this.hideSkipButton();

    if (this.statusBarEl) {
      this.statusBarEl.remove();
      this.statusBarEl = null;
    }
    if (this.actionBtnEl) {
      this.actionBtnEl.remove();
      this.actionBtnEl = null;
    }
    if (this.skipBtnEl) {
      this.skipBtnEl.remove();
      this.skipBtnEl = null;
    }

    this.group.removeFromParent();
  }

  dispose(): void {
    this.exit();
    for (const coin of this.coins) {
      coin.disposeCoin();
    }
    this.coins = [];
    if (this.hexagramView) {
      this.hexagramView.disposeHexagramView();
      this.hexagramView = null;
    }
    if (this.smokeParticles) {
      this.smokeParticles.disposeParticles();
      this.smokeParticles = null;
    }
    disposeObject(this.group);
    this.candleLight = null;
    this.candleMat = null;
    this.ctx = null;
  }
}

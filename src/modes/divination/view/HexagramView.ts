import {
  BoxGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';
import type { CoinLine } from '@/shared/types';

// Kích thước chuẩn của vạch hào
const LINE_SPACING = 0.22;
const YANG_WIDTH = 1.4;
const YIN_PART_WIDTH = 0.58;
const LINE_HEIGHT = 0.06;
const LINE_DEPTH = 0.06;

// Geometries dùng chung
const yangGeometry = new BoxGeometry(YANG_WIDTH, LINE_HEIGHT, LINE_DEPTH);
const yinPartGeometry = new BoxGeometry(YIN_PART_WIDTH, LINE_HEIGHT, LINE_DEPTH);

// Materials chuẩn
const staticMaterial = new MeshStandardMaterial({
  color: 0xd4af37, // Vàng đồng
  metalness: 0.6,
  roughness: 0.3,
});

const movingMaterial = new MeshStandardMaterial({
  color: 0xff7722, // Cam đỏ nổi bật
  emissive: 0xff4400,
  emissiveIntensity: 1.2,
  metalness: 0.5,
  roughness: 0.2,
});

export class HexagramView extends Group {
  private lineGroups: Group[] = [];
  private currentLines: CoinLine[] = [];

  constructor() {
    super();
    // Đặt vị trí bảng hào ở cạnh đĩa bói (x = -1.6, z = 0)
    this.position.set(-1.6, 0.1, 0);
  }

  /**
   * Thêm một hào mới từ DƯỚI LÊN (R04 §4).
   * lineIndex: 0 (Hào 1) đến 5 (Hào 6).
   */
  addLine(lineIndex: number, line: CoinLine, engine: Engine): void {
    this.currentLines[lineIndex] = line;

    const lineGroup = new Group();
    const posY = lineIndex * LINE_SPACING; // Xếp chồng từ dưới lên
    lineGroup.position.set(0, posY, 0);

    const mat = line.moving ? movingMaterial : staticMaterial;

    if (line.yang) {
      // Hào Dương: 1 vạch liền dài
      const mesh = new Mesh(yangGeometry, mat);
      mesh.castShadow = true;
      lineGroup.add(mesh);
    } else {
      // Hào Âm: 2 vạch đứt có khe hở ở giữa
      const leftMesh = new Mesh(yinPartGeometry, mat);
      leftMesh.position.set(-0.41, 0, 0);
      leftMesh.castShadow = true;

      const rightMesh = new Mesh(yinPartGeometry, mat);
      rightMesh.position.set(0.41, 0, 0);
      rightMesh.castShadow = true;

      lineGroup.add(leftMesh);
      lineGroup.add(rightMesh);
    }

    // Hiệu ứng xuất hiện vạch hào
    lineGroup.scale.set(0, 0, 0);
    this.add(lineGroup);
    this.lineGroups[lineIndex] = lineGroup;

    const tween = gsap.to(lineGroup.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 0.4,
      ease: 'back.out(1.7)',
    });
    engine.trackTween(tween);
  }

  /**
   * Biến đổi các hào động thành hào tương ứng của quẻ biến (Bước CHANGE - R04 §4)
   */
  transformMovingLines(engine: Engine, onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    for (let i = 0; i < this.currentLines.length; i++) {
      const line = this.currentLines[i];
      const group = this.lineGroups[i];

      if (line && line.moving && group) {
        // Nhấp nháy hào động rồi biến đổi hình dạng
        tl.to(
          group.scale,
          {
            x: 1.25,
            y: 1.25,
            duration: 0.3,
            yoyo: true,
            repeat: 1,
            ease: 'power2.inOut',
          },
          0,
        );

        // Sau đó thay thế bằng hào mới
        tl.call(
          () => {
            group.clear();
            const newYang = !line.yang; // Đảo hào động (Dương -> Âm, Âm -> Dương)
            const mat = staticMaterial;

            if (newYang) {
              const mesh = new Mesh(yangGeometry, mat);
              group.add(mesh);
            } else {
              const leftMesh = new Mesh(yinPartGeometry, mat);
              leftMesh.position.set(-0.41, 0, 0);
              const rightMesh = new Mesh(yinPartGeometry, mat);
              rightMesh.position.set(0.41, 0, 0);
              group.add(leftMesh);
              group.add(rightMesh);
            }
          },
          undefined,
          0.6,
        );
      }
    }

    engine.trackTween(tl);
  }

  clearLines(): void {
    for (const group of this.lineGroups) {
      if (group) {
        group.clear();
        group.removeFromParent();
      }
    }
    this.lineGroups = [];
    this.currentLines = [];
    this.clear();
  }

  disposeHexagramView(): void {
    this.clearLines();
  }
}

import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';

/**
 * Nhân vật Thầy Bói / Người Đọc Bài Tarot 3D (Tarot Reader 3D)
 * Tạo hình procedural bằng Three.js PBR geometry siêu nhẹ (R03),
 * không tải thêm asset ngoài, không tốn thêm draw call lớn.
 */
export class TarotReader3D extends Group {
  private engine: Engine;

  // Các bộ phận cơ thể & áo choàng
  private bodyGroup = new Group();
  private leftArmGroup = new Group();
  private rightArmGroup = new Group();
  private leftHandGroup = new Group();
  private rightHandGroup = new Group();

  // Danh sách tài nguyên để giải phóng sạch sẽ (R01 §5, R03 §4)
  private geometries: CylinderGeometry[] = [];
  private sphereGeos: SphereGeometry[] = [];
  private torusGeos: TorusGeometry[] = [];
  private materials: MeshStandardMaterial[] = [];
  private activeTweens: gsap.core.Tween[] = [];

  constructor(engine: Engine) {
    super();
    this.engine = engine;

    this.buildCharacter();
    this.position.set(0, 0, -2.25); // Ngồi đối diện người chơi qua bàn tròn
    this.rotation.set(0, 0, 0); // Hướng nhìn về phía người chơi (+Z)
  }

  private buildCharacter(): void {
    // 1. Vật liệu áo choàng nhung tím đêm sâu thẳm
    const robeMat = new MeshStandardMaterial({
      color: 0x120924,
      roughness: 0.85,
      metalness: 0.05,
    });
    this.materials.push(robeMat);

    // Vật liệu viền chỉ vàng kim cổ phong
    const goldTrimMat = new MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0x332205,
      emissiveIntensity: 0.2,
    });
    this.materials.push(goldTrimMat);

    // Vật liệu khoảng tối hư vô khuôn mặt
    const voidMat = new MeshStandardMaterial({
      color: 0x030206,
      roughness: 0.95,
      metalness: 0.0,
    });
    this.materials.push(voidMat);

    // Vật liệu bàn tay găng lụa huyền thuật
    const handMat = new MeshStandardMaterial({
      color: 0x241838,
      roughness: 0.7,
      metalness: 0.1,
    });
    this.materials.push(handMat);

    // Vật liệu nhẫn ngọc phát quang bí ẩn
    const gemMat = new MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00aa88,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.materials.push(gemMat);

    // 2. Thân áo choàng rủ xuống bàn và ghế
    const bodyGeo = new CylinderGeometry(0.48, 0.95, 1.9, 16);
    this.geometries.push(bodyGeo);
    const bodyMesh = new Mesh(bodyGeo, robeMat);
    bodyMesh.position.set(0, 0.85, 0);
    bodyMesh.castShadow = true;
    this.bodyGroup.add(bodyMesh);

    // Viền vàng chạy dọc vạt áo
    const trimGeo = new CylinderGeometry(0.04, 0.05, 1.85, 8);
    this.geometries.push(trimGeo);
    const trimMesh = new Mesh(trimGeo, goldTrimMat);
    trimMesh.position.set(0, 0.85, 0.49);
    this.bodyGroup.add(trimMesh);

    // 3. Nón trùm đầu bí ẩn (Mystic Hood)
    const hoodGeo = new SphereGeometry(0.38, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.75);
    this.sphereGeos.push(hoodGeo);
    const hoodMesh = new Mesh(hoodGeo, robeMat);
    hoodMesh.position.set(0, 1.85, 0.05);
    hoodMesh.rotation.set(-0.15, 0, 0);
    this.bodyGroup.add(hoodMesh);

    // Vành nón trùm nhô ra phía trước
    const hoodBrimGeo = new TorusGeometry(0.37, 0.045, 8, 24, Math.PI);
    this.torusGeos.push(hoodBrimGeo);
    const hoodBrimMesh = new Mesh(hoodBrimGeo, goldTrimMat);
    hoodBrimMesh.position.set(0, 1.83, 0.3);
    hoodBrimMesh.rotation.set(Math.PI * 0.4, 0, 0);
    this.bodyGroup.add(hoodBrimMesh);

    // Khoảng tối khuôn mặt bên trong nón (Face of Mystery)
    const faceVoidGeo = new SphereGeometry(0.24, 14, 14);
    this.sphereGeos.push(faceVoidGeo);
    const faceVoidMesh = new Mesh(faceVoidGeo, voidMat);
    faceVoidMesh.position.set(0, 1.82, 0.16);
    this.bodyGroup.add(faceVoidMesh);

    // Cổ áo & Khăn choàng (Collar Cowl)
    const collarGeo = new TorusGeometry(0.38, 0.08, 8, 20);
    this.torusGeos.push(collarGeo);
    const collarMesh = new Mesh(collarGeo, robeMat);
    collarMesh.position.set(0, 1.62, 0.08);
    collarMesh.rotation.set(Math.PI / 2 + 0.1, 0, 0);
    this.bodyGroup.add(collarMesh);

    // 4. Cánh tay & Bàn tay Trái
    this.leftArmGroup.position.set(-0.46, 1.45, 0.1);
    const armGeoL = new CylinderGeometry(0.12, 0.18, 0.85, 12);
    this.geometries.push(armGeoL);
    const armMeshL = new Mesh(armGeoL, robeMat);
    armMeshL.position.set(0, -0.35, 0.2);
    armMeshL.rotation.set(0.65, 0, 0.3);
    this.leftArmGroup.add(armMeshL);

    // Cổ tay áo viền vàng Trái
    const cuffGeoL = new TorusGeometry(0.17, 0.03, 8, 16);
    this.torusGeos.push(cuffGeoL);
    const cuffMeshL = new Mesh(cuffGeoL, goldTrimMat);
    cuffMeshL.position.set(-0.1, -0.65, 0.45);
    cuffMeshL.rotation.set(0.65, 0, 0.3);
    this.leftArmGroup.add(cuffMeshL);

    // Bàn tay Trái
    this.leftHandGroup.position.set(-0.15, -0.72, 0.55);
    const handGeoL = new SphereGeometry(0.09, 10, 10);
    handGeoL.scale(0.8, 0.4, 1.3);
    this.sphereGeos.push(handGeoL);
    const handMeshL = new Mesh(handGeoL, handMat);
    this.leftHandGroup.add(handMeshL);

    // Nhẫn ngọc bàn tay Trái
    const ringGeoL = new TorusGeometry(0.045, 0.015, 6, 12);
    this.torusGeos.push(ringGeoL);
    const ringMeshL = new Mesh(ringGeoL, gemMat);
    ringMeshL.position.set(0.02, 0.03, 0.04);
    ringMeshL.rotation.set(0.3, 0.2, 0);
    this.leftHandGroup.add(ringMeshL);

    this.leftArmGroup.add(this.leftHandGroup);
    this.bodyGroup.add(this.leftArmGroup);

    // 5. Cánh tay & Bàn tay Phải
    this.rightArmGroup.position.set(0.46, 1.45, 0.1);
    const armGeoR = new CylinderGeometry(0.12, 0.18, 0.85, 12);
    this.geometries.push(armGeoR);
    const armMeshR = new Mesh(armGeoR, robeMat);
    armMeshR.position.set(0, -0.35, 0.2);
    armMeshR.rotation.set(0.65, 0, -0.3);
    this.rightArmGroup.add(armMeshR);

    // Cổ tay áo viền vàng Phải
    const cuffGeoR = new TorusGeometry(0.17, 0.03, 8, 16);
    this.torusGeos.push(cuffGeoR);
    const cuffMeshR = new Mesh(cuffGeoR, goldTrimMat);
    cuffMeshR.position.set(0.1, -0.65, 0.45);
    cuffMeshR.rotation.set(0.65, 0, -0.3);
    this.rightArmGroup.add(cuffMeshR);

    // Bàn tay Phải
    this.rightHandGroup.position.set(0.15, -0.72, 0.55);
    const handGeoR = new SphereGeometry(0.09, 10, 10);
    handGeoR.scale(0.8, 0.4, 1.3);
    this.sphereGeos.push(handGeoR);
    const handMeshR = new Mesh(handGeoR, handMat);
    this.rightHandGroup.add(handMeshR);

    // Nhẫn ngọc bàn tay Phải
    const ringGeoR = new TorusGeometry(0.045, 0.015, 6, 12);
    this.torusGeos.push(ringGeoR);
    const ringMeshR = new Mesh(ringGeoR, gemMat);
    ringMeshR.position.set(-0.02, 0.03, 0.04);
    ringMeshR.rotation.set(0.3, -0.2, 0);
    this.rightHandGroup.add(ringMeshR);

    this.rightArmGroup.add(this.rightHandGroup);
    this.bodyGroup.add(this.rightArmGroup);

    this.add(this.bodyGroup);

    // Khởi động nhịp thở nhẹ nhàng ban đầu
    this.startBreathing();
  }

  /**
   * Hoạt cảnh thở nhẹ trang nghiêm khi ngồi chờ
   */
  private startBreathing(): void {
    const tween = gsap.to(this.bodyGroup.position, {
      y: 0.025,
      duration: 2.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });
    this.activeTweens.push(tween);
  }

  /**
   * Hoạt cảnh xáo bài: Hai bàn tay vươn ra hai bên bộ bài ở trung tâm bàn,
   * cử động nâng, tách và đan bài nhịp nhàng cùng bộ bài 3D.
   */
  playShuffleGesture(duration = 2.2, onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    // 1. Vươn tay ra sát bộ bài ở trung tâm bàn (Z ~ 1.7 so với vị trí Reader)
    tl.to(
      this.leftArmGroup.position,
      {
        x: -0.32,
        y: 1.15,
        z: 0.95,
        duration: 0.45,
        ease: 'power2.out',
      },
      0,
    );
    tl.to(
      this.leftArmGroup.rotation,
      {
        x: 0.35,
        y: 0.25,
        z: 0.15,
        duration: 0.45,
        ease: 'power2.out',
      },
      0,
    );

    tl.to(
      this.rightArmGroup.position,
      {
        x: 0.32,
        y: 1.15,
        z: 0.95,
        duration: 0.45,
        ease: 'power2.out',
      },
      0,
    );
    tl.to(
      this.rightArmGroup.rotation,
      {
        x: 0.35,
        y: -0.25,
        z: -0.15,
        duration: 0.45,
        ease: 'power2.out',
      },
      0,
    );

    // 2. Nhịp nhấc bài và đan bài qua lại
    const shuffleSteps = 4;
    const stepDuration = (duration - 0.7) / (shuffleSteps * 2);

    for (let i = 0; i < shuffleSteps; i++) {
      const timeStart = 0.45 + i * stepDuration * 2;
      // Tách rộng sang hai bên và nhấc lên nhẹ
      tl.to(
        this.leftArmGroup.position,
        {
          x: -0.55,
          y: 1.28,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart,
      );
      tl.to(
        this.rightArmGroup.position,
        {
          x: 0.55,
          y: 1.28,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart,
      );

      // Thu về tâm đan bài
      tl.to(
        this.leftArmGroup.position,
        {
          x: -0.28,
          y: 1.15,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart + stepDuration,
      );
      tl.to(
        this.rightArmGroup.position,
        {
          x: 0.28,
          y: 1.15,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart + stepDuration,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Hoạt cảnh xòe bài: Hai bàn tay lướt vuốt từ tâm sang hai bên mép bàn,
   * mở rộng các lá bài thành dải quạt hình cánh cung tuyệt đẹp.
   */
  playSpreadGesture(duration = 1.2, onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    // Bàn tay lướt sang hai phía mép bàn theo hình cánh cung
    tl.to(
      this.leftArmGroup.position,
      {
        x: -0.85,
        y: 1.12,
        z: 1.1,
        duration,
        ease: 'power2.out',
      },
      0,
    );
    tl.to(
      this.leftArmGroup.rotation,
      {
        x: 0.2,
        y: 0.5,
        z: 0.25,
        duration,
        ease: 'power2.out',
      },
      0,
    );

    tl.to(
      this.rightArmGroup.position,
      {
        x: 0.85,
        y: 1.12,
        z: 1.1,
        duration,
        ease: 'power2.out',
      },
      0,
    );
    tl.to(
      this.rightArmGroup.rotation,
      {
        x: 0.2,
        y: -0.5,
        z: -0.25,
        duration,
        ease: 'power2.out',
      },
      0,
    );

    this.engine.trackTween(tl);
  }

  /**
   * Hoạt cảnh mời rút bài: Thu nhẹ tay về tư thế đón nhận trang nghiêm,
   * lòng bàn tay hướng nhẹ về phía các lá bài và người chơi.
   */
  playInviteGesture(onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    tl.to(
      this.leftArmGroup.position,
      {
        x: -0.42,
        y: 1.25,
        z: 0.6,
        duration: 0.9,
        ease: 'power2.inOut',
      },
      0,
    );
    tl.to(
      this.leftArmGroup.rotation,
      {
        x: 0.45,
        y: 0.15,
        z: 0.1,
        duration: 0.9,
        ease: 'power2.inOut',
      },
      0,
    );

    tl.to(
      this.rightArmGroup.position,
      {
        x: 0.42,
        y: 1.25,
        z: 0.6,
        duration: 0.9,
        ease: 'power2.inOut',
      },
      0,
    );
    tl.to(
      this.rightArmGroup.rotation,
      {
        x: 0.45,
        y: -0.15,
        z: -0.1,
        duration: 0.9,
        ease: 'power2.inOut',
      },
      0,
    );

    this.engine.trackTween(tl);
  }

  /**
   * Đặt lại tư thế tay về trạng thái nghỉ ban đầu
   */
  resetPoseInstant(): void {
    this.leftArmGroup.position.set(-0.46, 1.45, 0.1);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.position.set(0.46, 1.45, 0.1);
    this.rightArmGroup.rotation.set(0, 0, 0);
    this.engine.requestRender();
  }

  /**
   * Giải phóng triệt để tài nguyên (R01 §5, R03 §4)
   */
  disposeReader(): void {
    for (const t of this.activeTweens) {
      t.kill();
    }
    this.activeTweens = [];

    for (const geo of this.geometries) {
      geo.dispose();
    }
    this.geometries = [];

    for (const sGeo of this.sphereGeos) {
      sGeo.dispose();
    }
    this.sphereGeos = [];

    for (const tGeo of this.torusGeos) {
      tGeo.dispose();
    }
    this.torusGeos = [];

    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials = [];

    this.clear();
  }
}

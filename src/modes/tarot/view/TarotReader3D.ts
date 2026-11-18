import {
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';
import gsap from 'gsap';
import type { Engine } from '@/core/Engine';

/**
 * Nhân vật Nữ Phù Thủy Tarot 3D (Tarot Witch 3D)
 * Tạo hình procedural bằng Three.js PBR geometry siêu nhẹ (R03):
 * - Mũ phù thủy chóp nhọn kinh điển với khóa cài mặt trăng lưỡi liềm
 * - Mái tóc bạch kim buông dài qua vai
 * - Khuôn mặt huyền bí với đôi mắt ma thuật phát sáng tím
 * - Áo choàng nhung đen thẫm, cổ áo dựng cao kiêu hãnh, dây chuyền pha lê
 * - Ống tay áo loe rộng (bell sleeves) và đôi bàn tay ma thuật
 */
export class TarotReader3D extends Group {
  private engine: Engine;

  // Các nhóm bộ phận cơ thể & phục trang
  private bodyGroup = new Group();
  private headGroup = new Group();
  private leftArmGroup = new Group();
  private rightArmGroup = new Group();
  private leftHandGroup = new Group();
  private rightHandGroup = new Group();
  private crystalPendant: Mesh | null = null;

  // Danh sách tài nguyên để giải phóng sạch sẽ (R01 §5, R03 §4)
  private geometries: (CylinderGeometry | SphereGeometry | TorusGeometry | ConeGeometry | OctahedronGeometry)[] = [];
  private materials: MeshStandardMaterial[] = [];
  private activeTweens: gsap.core.Tween[] = [];

  constructor(engine: Engine) {
    super();
    this.engine = engine;

    this.buildWitchCharacter();
    this.position.set(0, 0, -2.25); // Ngồi đối diện người chơi qua bàn tròn
    this.rotation.set(0, 0, 0); // Hướng nhìn về phía người chơi (+Z)
  }

  private buildWitchCharacter(): void {
    // 1. Vật liệu trang phục & ma thuật
    // Áo choàng nhung tím đen sâu thẳm
    const robeMat = new MeshStandardMaterial({
      color: 0x140a24,
      roughness: 0.85,
      metalness: 0.1,
    });
    this.materials.push(robeMat);

    // Corset & đai nón da tím sẫm
    const corsetMat = new MeshStandardMaterial({
      color: 0x2e113d,
      roughness: 0.5,
      metalness: 0.2,
    });
    this.materials.push(corsetMat);

    // Vàng kim cổ điển trang trí (khóa nón trăng lưỡi liềm, nhẫn)
    const goldMat = new MeshStandardMaterial({
      color: 0xe0b840,
      roughness: 0.35,
      metalness: 0.7,
      emissive: 0x332205,
      emissiveIntensity: 0.2,
    });
    this.materials.push(goldMat);

    // Mái tóc bạch kim huyền bí
    const hairMat = new MeshStandardMaterial({
      color: 0xded8ee,
      roughness: 0.6,
      metalness: 0.1,
    });
    this.materials.push(hairMat);

    // Làn da thanh tú của phù thủy
    const skinMat = new MeshStandardMaterial({
      color: 0xf5dfd2,
      roughness: 0.65,
      metalness: 0.05,
    });
    this.materials.push(skinMat);

    // Đôi mắt ma thuật phát sáng tím
    const eyeMat = new MeshStandardMaterial({
      color: 0xba68c8,
      emissive: 0xaa00ff,
      emissiveIntensity: 1.6,
      roughness: 0.2,
      metalness: 0.8,
    });
    this.materials.push(eyeMat);

    // Viên pha lê ma thuật trước ngực
    const crystalMat = new MeshStandardMaterial({
      color: 0xdf78ef,
      emissive: 0xba55d3,
      emissiveIntensity: 1.8,
      roughness: 0.15,
      metalness: 0.9,
    });
    this.materials.push(crystalMat);

    // 2. Thân váy áo choàng phù thủy
    const dressGeo = new CylinderGeometry(0.38, 0.95, 1.85, 18);
    this.geometries.push(dressGeo);
    const dressMesh = new Mesh(dressGeo, robeMat);
    dressMesh.position.set(0, 0.85, 0);
    dressMesh.castShadow = true;
    this.bodyGroup.add(dressMesh);

    // Corset nịt eo thanh mảnh
    const corsetGeo = new CylinderGeometry(0.36, 0.42, 0.55, 18);
    this.geometries.push(corsetGeo);
    const corsetMesh = new Mesh(corsetGeo, corsetMat);
    corsetMesh.position.set(0, 1.15, 0.02);
    this.bodyGroup.add(corsetMesh);

    // Cổ áo phù thủy dựng cao kiêu hãnh (High Witch Collar)
    const collarGeo = new CylinderGeometry(0.44, 0.35, 0.45, 16, 1, true, Math.PI * 0.75, Math.PI * 1.5);
    this.geometries.push(collarGeo);
    const collarMesh = new Mesh(collarGeo, robeMat);
    collarMesh.position.set(0, 1.68, -0.06);
    collarMesh.rotation.set(-0.25, 0, 0);
    this.bodyGroup.add(collarMesh);

    // Dây chuyền & Viên pha lê ma thuật trước ngực
    const pendantGeo = new OctahedronGeometry(0.085);
    this.geometries.push(pendantGeo);
    this.crystalPendant = new Mesh(pendantGeo, crystalMat);
    this.crystalPendant.position.set(0, 1.42, 0.35);
    this.bodyGroup.add(this.crystalPendant);

    // 3. Đầu, Gương mặt thanh tú & Đôi mắt phát sáng
    this.headGroup.position.set(0, 1.76, 0.08);

    const faceGeo = new SphereGeometry(0.2, 16, 16);
    faceGeo.scale(0.85, 1.0, 0.95);
    this.geometries.push(faceGeo);
    const faceMesh = new Mesh(faceGeo, skinMat);
    this.headGroup.add(faceMesh);

    // Đôi mắt phát quang huyền bí
    const eyeGeo = new SphereGeometry(0.025, 8, 8);
    this.geometries.push(eyeGeo);
    const leftEye = new Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.065, 0.02, 0.17);
    this.headGroup.add(leftEye);

    const rightEye = new Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.065, 0.02, 0.17);
    this.headGroup.add(rightEye);

    // Mái tóc dài bạch kim buông xõa hai bên vai
    const hairLeftGeo = new CylinderGeometry(0.075, 0.04, 0.85, 10);
    this.geometries.push(hairLeftGeo);
    const hairLeftMesh = new Mesh(hairLeftGeo, hairMat);
    hairLeftMesh.position.set(-0.19, -0.25, 0.1);
    hairLeftMesh.rotation.set(0.15, 0, -0.15);
    this.headGroup.add(hairLeftMesh);

    const hairRightGeo = new CylinderGeometry(0.075, 0.04, 0.85, 10);
    this.geometries.push(hairRightGeo);
    const hairRightMesh = new Mesh(hairRightGeo, hairMat);
    hairRightMesh.position.set(0.19, -0.25, 0.1);
    hairRightMesh.rotation.set(0.15, 0, 0.15);
    this.headGroup.add(hairRightMesh);

    const hairBackGeo = new CylinderGeometry(0.19, 0.25, 0.9, 12);
    this.geometries.push(hairBackGeo);
    const hairBackMesh = new Mesh(hairBackGeo, hairMat);
    hairBackMesh.position.set(0, -0.32, -0.12);
    this.headGroup.add(hairBackMesh);

    // 4. Mũ phù thủy chóp nhọn kinh điển (Classic Pointed Witch Hat)
    // Vành nón rộng uốn cong
    const brimGeo = new CylinderGeometry(0.72, 0.72, 0.025, 32);
    this.geometries.push(brimGeo);
    const brimMesh = new Mesh(brimGeo, robeMat);
    brimMesh.position.set(0, 0.16, 0.02);
    brimMesh.rotation.set(-0.12, 0, 0);
    this.headGroup.add(brimMesh);

    // Đai thắt quanh chân nón
    const hatBeltGeo = new TorusGeometry(0.29, 0.035, 8, 24);
    this.geometries.push(hatBeltGeo);
    const hatBeltMesh = new Mesh(hatBeltGeo, corsetMat);
    hatBeltMesh.position.set(0, 0.19, 0.02);
    hatBeltMesh.rotation.set(Math.PI / 2 - 0.12, 0, 0);
    this.headGroup.add(hatBeltMesh);

    // Khóa cài hình trăng lưỡi liềm vàng kim (Crescent Moon Buckle)
    const moonGeo = new TorusGeometry(0.075, 0.02, 8, 20, Math.PI * 1.4);
    this.geometries.push(moonGeo);
    const moonMesh = new Mesh(moonGeo, goldMat);
    moonMesh.position.set(0, 0.22, 0.31);
    moonMesh.rotation.set(0.15, 0, Math.PI * 0.3);
    this.headGroup.add(moonMesh);

    // Chóp nón phù thủy uốn cong nhọn về phía sau (2 khúc cone nối tiếp)
    const coneBaseGeo = new ConeGeometry(0.28, 0.55, 20);
    this.geometries.push(coneBaseGeo);
    const coneBaseMesh = new Mesh(coneBaseGeo, robeMat);
    coneBaseMesh.position.set(0, 0.44, -0.02);
    coneBaseMesh.rotation.set(-0.25, 0, 0);
    this.headGroup.add(coneBaseMesh);

    const coneTipGeo = new ConeGeometry(0.16, 0.48, 16);
    this.geometries.push(coneTipGeo);
    const coneTipMesh = new Mesh(coneTipGeo, robeMat);
    coneTipMesh.position.set(0, 0.8, -0.16);
    coneTipMesh.rotation.set(-0.55, 0, 0);
    this.headGroup.add(coneTipMesh);

    this.bodyGroup.add(this.headGroup);

    // 5. Cánh tay & Ống tay áo loe phù thủy (Bell Sleeves)
    // Cánh tay Trái
    this.leftArmGroup.position.set(-0.44, 1.48, 0.08);
    const armGeoL = new CylinderGeometry(0.09, 0.12, 0.7, 10);
    this.geometries.push(armGeoL);
    const armMeshL = new Mesh(armGeoL, robeMat);
    armMeshL.position.set(0, -0.28, 0.15);
    armMeshL.rotation.set(0.65, 0, 0.3);
    this.leftArmGroup.add(armMeshL);

    // Ống tay áo loe rộng Trái (Bell Sleeve)
    const bellGeoL = new CylinderGeometry(0.22, 0.11, 0.42, 14);
    this.geometries.push(bellGeoL);
    const bellMeshL = new Mesh(bellGeoL, robeMat);
    bellMeshL.position.set(-0.08, -0.56, 0.38);
    bellMeshL.rotation.set(0.65, 0, 0.3);
    this.leftArmGroup.add(bellMeshL);

    // Bàn tay Trái thon thả
    this.leftHandGroup.position.set(-0.12, -0.66, 0.48);
    const handGeoL = new SphereGeometry(0.075, 10, 10);
    handGeoL.scale(0.75, 0.4, 1.35);
    this.geometries.push(handGeoL);
    const handMeshL = new Mesh(handGeoL, skinMat);
    this.leftHandGroup.add(handMeshL);

    // Nhẫn vàng phù thủy tay Trái
    const ringGeoL = new TorusGeometry(0.038, 0.012, 6, 12);
    this.geometries.push(ringGeoL);
    const ringMeshL = new Mesh(ringGeoL, goldMat);
    ringMeshL.position.set(0.02, 0.02, 0.03);
    this.leftHandGroup.add(ringMeshL);

    this.leftArmGroup.add(this.leftHandGroup);
    this.bodyGroup.add(this.leftArmGroup);

    // Cánh tay Phải
    this.rightArmGroup.position.set(0.44, 1.48, 0.08);
    const armGeoR = new CylinderGeometry(0.09, 0.12, 0.7, 10);
    this.geometries.push(armGeoR);
    const armMeshR = new Mesh(armGeoR, robeMat);
    armMeshR.position.set(0, -0.28, 0.15);
    armMeshR.rotation.set(0.65, 0, -0.3);
    this.rightArmGroup.add(armMeshR);

    // Ống tay áo loe rộng Phải (Bell Sleeve)
    const bellGeoR = new CylinderGeometry(0.22, 0.11, 0.42, 14);
    this.geometries.push(bellGeoR);
    const bellMeshR = new Mesh(bellGeoR, robeMat);
    bellMeshR.position.set(0.08, -0.56, 0.38);
    bellMeshR.rotation.set(0.65, 0, -0.3);
    this.rightArmGroup.add(bellMeshR);

    // Bàn tay Phải thon thả
    this.rightHandGroup.position.set(0.12, -0.66, 0.48);
    const handGeoR = new SphereGeometry(0.075, 10, 10);
    handGeoR.scale(0.75, 0.4, 1.35);
    this.geometries.push(handGeoR);
    const handMeshR = new Mesh(handGeoR, skinMat);
    this.rightHandGroup.add(handMeshR);

    // Nhẫn vàng phù thủy tay Phải
    const ringGeoR = new TorusGeometry(0.038, 0.012, 6, 12);
    this.geometries.push(ringGeoR);
    const ringMeshR = new Mesh(ringGeoR, goldMat);
    ringMeshR.position.set(-0.02, 0.02, 0.03);
    this.rightHandGroup.add(ringMeshR);

    this.rightArmGroup.add(this.rightHandGroup);
    this.bodyGroup.add(this.rightArmGroup);

    this.add(this.bodyGroup);

    // Khởi động nhịp thở ma thuật
    this.startBreathing();
  }

  /**
   * Hoạt cảnh thở nhẹ trang nghiêm & viên pha lê nhấp nháy ánh quang
   */
  private startBreathing(): void {
    const tweenBody = gsap.to(this.bodyGroup.position, {
      y: 0.022,
      duration: 3.2,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      onUpdate: () => {
        this.engine.requestRender();
      },
    });
    this.activeTweens.push(tweenBody);

    if (this.crystalPendant) {
      const tweenCrystal = gsap.to(this.crystalPendant.rotation, {
        y: Math.PI * 2,
        duration: 8.0,
        repeat: -1,
        ease: 'none',
        onUpdate: () => {
          this.engine.requestRender();
        },
      });
      this.activeTweens.push(tweenCrystal);
    }
  }

  /**
   * Hoạt cảnh xáo bài: Phù thủy vươn 2 bàn tay ma thuật ra nâng và đan xen bài nhịp nhàng.
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

    // Vươn 2 tay ra vị trí bộ bài trung tâm
    tl.to(
      this.leftArmGroup.position,
      {
        x: -0.32,
        y: 1.18,
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
        y: 1.18,
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

    // Nhịp tách và đan bài ma thuật
    const shuffleSteps = 4;
    const stepDuration = (duration - 0.7) / (shuffleSteps * 2);

    for (let i = 0; i < shuffleSteps; i++) {
      const timeStart = 0.45 + i * stepDuration * 2;
      tl.to(
        this.leftArmGroup.position,
        {
          x: -0.52,
          y: 1.3,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart,
      );
      tl.to(
        this.rightArmGroup.position,
        {
          x: 0.52,
          y: 1.3,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart,
      );

      tl.to(
        this.leftArmGroup.position,
        {
          x: -0.28,
          y: 1.18,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart + stepDuration,
      );
      tl.to(
        this.rightArmGroup.position,
        {
          x: 0.28,
          y: 1.18,
          duration: stepDuration,
          ease: 'power1.inOut',
        },
        timeStart + stepDuration,
      );
    }

    this.engine.trackTween(tl);
  }

  /**
   * Hoạt cảnh xòe 3 hàng bài: Phù thủy vuốt tay qua 3 nhịp trải rộng 3 hàng bài uốn lượn
   */
  playSpreadGesture(duration = 1.6, onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    // Nhịp 1: Trải hàng trên (xa)
    tl.to(
      this.leftArmGroup.position,
      { x: -0.75, y: 1.25, z: 0.9, duration: duration * 0.35, ease: 'power2.out' },
      0,
    );
    tl.to(
      this.rightArmGroup.position,
      { x: 0.75, y: 1.25, z: 0.9, duration: duration * 0.35, ease: 'power2.out' },
      0,
    );

    // Nhịp 2: Trải hàng giữa
    tl.to(
      this.leftArmGroup.position,
      { x: -0.88, y: 1.18, z: 1.1, duration: duration * 0.35, ease: 'power1.inOut' },
      duration * 0.35,
    );
    tl.to(
      this.rightArmGroup.position,
      { x: 0.88, y: 1.18, z: 1.1, duration: duration * 0.35, ease: 'power1.inOut' },
      duration * 0.35,
    );

    // Nhịp 3: Trải hàng dưới (gần người chơi)
    tl.to(
      this.leftArmGroup.position,
      { x: -0.95, y: 1.12, z: 1.25, duration: duration * 0.3, ease: 'power2.out' },
      duration * 0.7,
    );
    tl.to(
      this.rightArmGroup.position,
      { x: 0.95, y: 1.12, z: 1.25, duration: duration * 0.3, ease: 'power2.out' },
      duration * 0.7,
    );

    this.engine.trackTween(tl);
  }

  /**
   * Hoạt cảnh mời rút bài: Thu tay về tư thế đón nhận trang nghiêm
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
    this.leftArmGroup.position.set(-0.44, 1.48, 0.08);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.position.set(0.44, 1.48, 0.08);
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

    for (const mat of this.materials) {
      mat.dispose();
    }
    this.materials = [];

    this.crystalPendant = null;
    this.clear();
  }
}

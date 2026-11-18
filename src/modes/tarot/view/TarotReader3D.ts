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
 * Nhân vật Nữ Phù Thủy Tarot 3D Chân Thực (Realistic Tarot Witch 3D)
 * - Đường nét khuôn mặt thanh tú, cằm V-line, sống mũi thanh mảnh, đôi mắt phát quang tím
 * - Mái tóc bạch kim bồng bềnh nhiều tầng rủ qua vai và trước ngực
 * - Mũ phù thủy chóp nhọn kinh điển có khóa cài trăng lưỡi liềm vàng kim
 * - Áo choàng nhung đen tím, corset thon thả, cổ áo cao Gothic và dây chuyền pha lê
 * - Đôi tay áo loe rộng và bàn tay ma thuật cử động xáo bài chân thực (nghiêng người, uốn đan cọc bài)
 */
export class TarotReader3D extends Group {
  private engine: Engine;

  // Các nhóm bộ phận cơ thể & phục trang
  private bodyGroup = new Group();
  private torsoGroup = new Group();
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

    this.buildRealisticWitch();
    this.position.set(0, 0, -2.25); // Ngồi đối diện người chơi qua bàn tròn
    this.rotation.set(0, 0, 0); // Hướng nhìn về phía người chơi (+Z)
  }

  private buildRealisticWitch(): void {
    // 1. Vật liệu PBR cao cấp
    const robeMat = new MeshStandardMaterial({
      color: 0x130a22,
      roughness: 0.82,
      metalness: 0.12,
    });
    this.materials.push(robeMat);

    const corsetMat = new MeshStandardMaterial({
      color: 0x2a0f38,
      roughness: 0.45,
      metalness: 0.25,
    });
    this.materials.push(corsetMat);

    const goldMat = new MeshStandardMaterial({
      color: 0xdeb43f,
      roughness: 0.3,
      metalness: 0.75,
      emissive: 0x3d2b06,
      emissiveIntensity: 0.25,
    });
    this.materials.push(goldMat);

    const hairMat = new MeshStandardMaterial({
      color: 0xe5e0f5,
      roughness: 0.55,
      metalness: 0.1,
    });
    this.materials.push(hairMat);

    const skinMat = new MeshStandardMaterial({
      color: 0xf5dfd4,
      roughness: 0.6,
      metalness: 0.05,
    });
    this.materials.push(skinMat);

    const lipMat = new MeshStandardMaterial({
      color: 0x9c335a,
      roughness: 0.4,
      metalness: 0.1,
    });
    this.materials.push(lipMat);

    const eyeMat = new MeshStandardMaterial({
      color: 0xc471ed,
      emissive: 0xa832d4,
      emissiveIntensity: 2.2,
      roughness: 0.15,
      metalness: 0.9,
    });
    this.materials.push(eyeMat);

    const crystalMat = new MeshStandardMaterial({
      color: 0xdf78ef,
      emissive: 0xb535e0,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.95,
    });
    this.materials.push(crystalMat);

    // 2. Thân người & Trang phục
    // Váy áo choàng rủ xuống ghế
    const skirtGeo = new CylinderGeometry(0.36, 0.95, 1.85, 20);
    this.geometries.push(skirtGeo);
    const skirtMesh = new Mesh(skirtGeo, robeMat);
    skirtMesh.position.set(0, 0.85, 0);
    skirtMesh.castShadow = true;
    this.bodyGroup.add(skirtMesh);

    // Corset nịt eo thon thả có viền vàng
    const corsetGeo = new CylinderGeometry(0.34, 0.4, 0.58, 20);
    this.geometries.push(corsetGeo);
    const corsetMesh = new Mesh(corsetGeo, corsetMat);
    corsetMesh.position.set(0, 1.18, 0.02);
    this.torsoGroup.add(corsetMesh);

    // Dây viền vàng chạy dọc thân corset
    const trimGeo = new CylinderGeometry(0.02, 0.02, 0.56, 8);
    this.geometries.push(trimGeo);
    const trimMesh = new Mesh(trimGeo, goldMat);
    trimMesh.position.set(0, 1.18, 0.36);
    this.torsoGroup.add(trimMesh);

    // Cổ áo Gothic dựng cao kiêu hãnh (High Witch Collar)
    const collarGeo = new CylinderGeometry(0.44, 0.34, 0.48, 18, 1, true, Math.PI * 0.75, Math.PI * 1.5);
    this.geometries.push(collarGeo);
    const collarMesh = new Mesh(collarGeo, robeMat);
    collarMesh.position.set(0, 1.68, -0.06);
    collarMesh.rotation.set(-0.25, 0, 0);
    this.torsoGroup.add(collarMesh);

    // Dây chuyền pha lê ma thuật bát diện
    const pendantGeo = new OctahedronGeometry(0.088);
    this.geometries.push(pendantGeo);
    this.crystalPendant = new Mesh(pendantGeo, crystalMat);
    this.crystalPendant.position.set(0, 1.42, 0.36);
    this.torsoGroup.add(this.crystalPendant);

    // 3. Khuôn mặt thanh tú, cằm V-line & đôi mắt phát quang
    this.headGroup.position.set(0, 1.76, 0.08);

    // Đầu & gò má
    const faceGeo = new SphereGeometry(0.19, 18, 18);
    faceGeo.scale(0.85, 1.05, 0.95);
    this.geometries.push(faceGeo);
    const faceMesh = new Mesh(faceGeo, skinMat);
    this.headGroup.add(faceMesh);

    // Cằm V-line thon gọn thanh thoát
    const chinGeo = new ConeGeometry(0.08, 0.12, 12);
    this.geometries.push(chinGeo);
    const chinMesh = new Mesh(chinGeo, skinMat);
    chinMesh.position.set(0, -0.16, 0.08);
    chinMesh.rotation.set(Math.PI, 0, 0);
    this.headGroup.add(chinMesh);

    // Sống mũi thanh mảnh
    const noseGeo = new ConeGeometry(0.025, 0.07, 8);
    this.geometries.push(noseGeo);
    const noseMesh = new Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.02, 0.19);
    noseMesh.rotation.set(0.35, 0, 0);
    this.headGroup.add(noseMesh);

    // Môi thoa son nhẹ quyến rũ
    const lipsGeo = new SphereGeometry(0.035, 10, 8);
    lipsGeo.scale(1.2, 0.45, 0.6);
    this.geometries.push(lipsGeo);
    const lipsMesh = new Mesh(lipsGeo, lipMat);
    lipsMesh.position.set(0, -0.09, 0.16);
    this.headGroup.add(lipsMesh);

    // Đôi mắt ma thuật phát sáng tím
    const eyeGeo = new SphereGeometry(0.026, 10, 10);
    this.geometries.push(eyeGeo);
    const leftEye = new Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.065, 0.03, 0.165);
    this.headGroup.add(leftEye);

    const rightEye = new Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.065, 0.03, 0.165);
    this.headGroup.add(rightEye);

    // Lông mày mảnh cong nhẹ
    const browGeo = new CylinderGeometry(0.008, 0.008, 0.06, 6);
    this.geometries.push(browGeo);
    const leftBrow = new Mesh(browGeo, hairMat);
    leftBrow.position.set(-0.065, 0.065, 0.165);
    leftBrow.rotation.set(0, 0, 0.2);
    this.headGroup.add(leftBrow);

    const rightBrow = new Mesh(browGeo, hairMat);
    rightBrow.position.set(0.065, 0.065, 0.165);
    rightBrow.rotation.set(0, 0, -0.2);
    this.headGroup.add(rightBrow);

    // Mái tóc bạch kim bồng bềnh nhiều tầng
    // Tóc mái trước trán
    const bangsGeo = new SphereGeometry(0.12, 10, 10);
    bangsGeo.scale(1.4, 0.35, 0.7);
    this.geometries.push(bangsGeo);
    const bangsMesh = new Mesh(bangsGeo, hairMat);
    bangsMesh.position.set(0, 0.12, 0.14);
    this.headGroup.add(bangsMesh);

    // 2 lọn tóc dài buông xõa trước hai bên ngực
    const hairL1 = new CylinderGeometry(0.065, 0.03, 0.85, 10);
    this.geometries.push(hairL1);
    const hairMeshL1 = new Mesh(hairL1, hairMat);
    hairMeshL1.position.set(-0.19, -0.25, 0.12);
    hairMeshL1.rotation.set(0.15, 0, -0.15);
    this.headGroup.add(hairMeshL1);

    const hairR1 = new CylinderGeometry(0.065, 0.03, 0.85, 10);
    this.geometries.push(hairR1);
    const hairMeshR1 = new Mesh(hairR1, hairMat);
    hairMeshR1.position.set(0.19, -0.25, 0.12);
    hairMeshR1.rotation.set(0.15, 0, 0.15);
    this.headGroup.add(hairMeshR1);

    // Vạt tóc dài buông sau lưng
    const hairBack = new CylinderGeometry(0.2, 0.28, 0.95, 12);
    this.geometries.push(hairBack);
    const hairBackMesh = new Mesh(hairBack, hairMat);
    hairBackMesh.position.set(0, -0.32, -0.12);
    this.headGroup.add(hairBackMesh);

    // 4. Mũ phù thủy chóp nhọn kinh điển (Pointed Witch Hat)
    const brimGeo = new CylinderGeometry(0.72, 0.72, 0.025, 32);
    this.geometries.push(brimGeo);
    const brimMesh = new Mesh(brimGeo, robeMat);
    brimMesh.position.set(0, 0.16, 0.02);
    brimMesh.rotation.set(-0.12, 0, 0);
    this.headGroup.add(brimMesh);

    const hatBeltGeo = new TorusGeometry(0.29, 0.035, 8, 24);
    this.geometries.push(hatBeltGeo);
    const hatBeltMesh = new Mesh(hatBeltGeo, corsetMat);
    hatBeltMesh.position.set(0, 0.19, 0.02);
    hatBeltMesh.rotation.set(Math.PI / 2 - 0.12, 0, 0);
    this.headGroup.add(hatBeltMesh);

    const moonGeo = new TorusGeometry(0.075, 0.02, 8, 20, Math.PI * 1.4);
    this.geometries.push(moonGeo);
    const moonMesh = new Mesh(moonGeo, goldMat);
    moonMesh.position.set(0, 0.22, 0.31);
    moonMesh.rotation.set(0.15, 0, Math.PI * 0.3);
    this.headGroup.add(moonMesh);

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

    this.torsoGroup.add(this.headGroup);

    // 5. Cánh tay, Ống tay áo loe mềm & Bàn tay có ngón
    // Cánh tay Trái
    this.leftArmGroup.position.set(-0.42, 1.48, 0.08);
    const armGeoL = new CylinderGeometry(0.085, 0.11, 0.7, 10);
    this.geometries.push(armGeoL);
    const armMeshL = new Mesh(armGeoL, robeMat);
    armMeshL.position.set(0, -0.28, 0.15);
    armMeshL.rotation.set(0.65, 0, 0.3);
    this.leftArmGroup.add(armMeshL);

    // Ống tay áo loe rộng (Bell Sleeve)
    const bellGeoL = new CylinderGeometry(0.24, 0.11, 0.44, 16);
    this.geometries.push(bellGeoL);
    const bellMeshL = new Mesh(bellGeoL, robeMat);
    bellMeshL.position.set(-0.08, -0.56, 0.38);
    bellMeshL.rotation.set(0.65, 0, 0.3);
    this.leftArmGroup.add(bellMeshL);

    // Bàn tay & Ngón tay Trái
    this.leftHandGroup.position.set(-0.12, -0.66, 0.48);
    const palmGeoL = new SphereGeometry(0.07, 10, 10);
    palmGeoL.scale(0.75, 0.38, 1.3);
    this.geometries.push(palmGeoL);
    const palmMeshL = new Mesh(palmGeoL, skinMat);
    this.leftHandGroup.add(palmMeshL);

    // Nhẫn vàng ngón tay Trái
    const ringGeoL = new TorusGeometry(0.036, 0.012, 6, 12);
    this.geometries.push(ringGeoL);
    const ringMeshL = new Mesh(ringGeoL, goldMat);
    ringMeshL.position.set(0.02, 0.02, 0.03);
    this.leftHandGroup.add(ringMeshL);

    this.leftArmGroup.add(this.leftHandGroup);
    this.torsoGroup.add(this.leftArmGroup);

    // Cánh tay Phải
    this.rightArmGroup.position.set(0.42, 1.48, 0.08);
    const armGeoR = new CylinderGeometry(0.085, 0.11, 0.7, 10);
    this.geometries.push(armGeoR);
    const armMeshR = new Mesh(armGeoR, robeMat);
    armMeshR.position.set(0, -0.28, 0.15);
    armMeshR.rotation.set(0.65, 0, -0.3);
    this.rightArmGroup.add(armMeshR);

    // Ống tay áo loe rộng (Bell Sleeve)
    const bellGeoR = new CylinderGeometry(0.24, 0.11, 0.44, 16);
    this.geometries.push(bellGeoR);
    const bellMeshR = new Mesh(bellGeoR, robeMat);
    bellMeshR.position.set(0.08, -0.56, 0.38);
    bellMeshR.rotation.set(0.65, 0, -0.3);
    this.rightArmGroup.add(bellMeshR);

    // Bàn tay & Ngón tay Phải
    this.rightHandGroup.position.set(0.12, -0.66, 0.48);
    const palmGeoR = new SphereGeometry(0.07, 10, 10);
    palmGeoR.scale(0.75, 0.38, 1.3);
    this.geometries.push(palmGeoR);
    const palmMeshR = new Mesh(palmGeoR, skinMat);
    this.rightHandGroup.add(palmMeshR);

    // Nhẫn vàng ngón tay Phải
    const ringGeoR = new TorusGeometry(0.036, 0.012, 6, 12);
    this.geometries.push(ringGeoR);
    const ringMeshR = new Mesh(ringGeoR, goldMat);
    ringMeshR.position.set(-0.02, 0.02, 0.03);
    this.rightHandGroup.add(ringMeshR);

    this.rightArmGroup.add(this.rightHandGroup);
    this.torsoGroup.add(this.rightArmGroup);

    this.bodyGroup.add(this.torsoGroup);
    this.add(this.bodyGroup);

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
   * Hoạt cảnh xáo bài chân thực:
   * Phù thủy hơi cúi người, đầu nghiêng dõi mắt nhìn bộ bài ở trung tâm.
   * Tay trái áp sát giữ nửa cọc bài dưới, tay phải nhấc nửa cọc bài trên uốn cong,
   * cử động đan xen 4 nhịp nhấp nhô theo tiếng sột soạt.
   */
  playShuffleGesture(duration = 2.4, onComplete?: () => void): void {
    const tl = gsap.timeline({
      onComplete: () => {
        if (onComplete) onComplete();
      },
      onUpdate: () => {
        this.engine.requestRender();
      },
    });

    // 1. Phù thủy cúi người nhẹ, đầu nghiêng tập trung nhìn bộ bài
    tl.to(
      this.torsoGroup.position,
      { z: 0.12, duration: 0.45, ease: 'power2.out' },
      0,
    );
    tl.to(
      this.headGroup.rotation,
      { x: 0.22, y: 0.08, duration: 0.45, ease: 'power2.out' },
      0,
    );

    // 2. Tay trái áp sát giữ nửa bài trái trên bàn
    tl.to(
      this.leftArmGroup.position,
      { x: -0.28, y: 1.16, z: 1.05, duration: 0.45, ease: 'power2.out' },
      0,
    );
    tl.to(
      this.leftArmGroup.rotation,
      { x: 0.35, y: 0.2, z: 0.12, duration: 0.45, ease: 'power2.out' },
      0,
    );

    // 3. Tay phải nhấc nửa cọc bài lên cao, nghiêng góc uốn cong
    tl.to(
      this.rightArmGroup.position,
      { x: 0.38, y: 1.32, z: 1.05, duration: 0.45, ease: 'power2.out' },
      0,
    );
    tl.to(
      this.rightArmGroup.rotation,
      { x: 0.45, y: -0.32, z: -0.22, duration: 0.45, ease: 'power2.out' },
      0,
    );

    // 4. Các nhịp đan xen và thả lá bài rơi luân chuyển (Riffle Shuffle)
    const steps = 4;
    const stepDuration = (duration - 0.8) / (steps * 2);

    for (let i = 0; i < steps; i++) {
      const timeStart = 0.45 + i * stepDuration * 2;
      // Nhấc lên tách cọc
      tl.to(
        this.rightArmGroup.position,
        { y: 1.36, x: 0.44, duration: stepDuration, ease: 'sine.inOut' },
        timeStart,
      );
      tl.to(
        this.leftArmGroup.position,
        { x: -0.36, duration: stepDuration, ease: 'sine.inOut' },
        timeStart,
      );

      // Thả đan xen vào giữa
      tl.to(
        this.rightArmGroup.position,
        { y: 1.18, x: 0.26, duration: stepDuration, ease: 'sine.inOut' },
        timeStart + stepDuration,
      );
      tl.to(
        this.leftArmGroup.position,
        { x: -0.26, duration: stepDuration, ease: 'sine.inOut' },
        timeStart + stepDuration,
      );
    }

    // 5. Kết thúc xáo bài: ngẩng đầu mỉm cười nhẹ trở lại
    tl.to(
      this.torsoGroup.position,
      { z: 0, duration: 0.35, ease: 'power2.out' },
      duration - 0.35,
    );
    tl.to(
      this.headGroup.rotation,
      { x: 0, y: 0, duration: 0.35, ease: 'power2.out' },
      duration - 0.35,
    );

    this.engine.trackTween(tl);
  }

  /**
   * Hoạt cảnh xòe 3 hàng bài: Phù thủy ngẩng đầu nhìn người chơi,
   * hai tay vuốt uyển chuyển 3 nhịp trải rộng 3 hàng bài ra khắp bàn.
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

    // Ngẩng đầu tươi tắn
    tl.to(this.headGroup.rotation, { x: -0.05, y: 0, duration: 0.4, ease: 'power2.out' }, 0);

    // Nhịp 1: Trải hàng trên (xa nhất)
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

    // Nhịp 3: Trải hàng dưới (gần người chơi nhất)
    tl.to(
      this.leftArmGroup.position,
      { x: -0.96, y: 1.12, z: 1.25, duration: duration * 0.3, ease: 'power2.out' },
      duration * 0.7,
    );
    tl.to(
      this.rightArmGroup.position,
      { x: 0.96, y: 1.12, z: 1.25, duration: duration * 0.3, ease: 'power2.out' },
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
      { x: -0.42, y: 1.25, z: 0.6, duration: 0.9, ease: 'power2.inOut' },
      0,
    );
    tl.to(
      this.leftArmGroup.rotation,
      { x: 0.45, y: 0.15, z: 0.1, duration: 0.9, ease: 'power2.inOut' },
      0,
    );

    tl.to(
      this.rightArmGroup.position,
      { x: 0.42, y: 1.25, z: 0.6, duration: 0.9, ease: 'power2.inOut' },
      0,
    );
    tl.to(
      this.rightArmGroup.rotation,
      { x: 0.45, y: -0.15, z: -0.1, duration: 0.9, ease: 'power2.inOut' },
      0,
    );

    this.engine.trackTween(tl);
  }

  /**
   * Đặt lại tư thế tay về trạng thái nghỉ ban đầu
   */
  resetPoseInstant(): void {
    this.torsoGroup.position.set(0, 0, 0);
    this.headGroup.rotation.set(0, 0, 0);
    this.leftArmGroup.position.set(-0.42, 1.48, 0.08);
    this.leftArmGroup.rotation.set(0, 0, 0);
    this.rightArmGroup.position.set(0.42, 1.48, 0.08);
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

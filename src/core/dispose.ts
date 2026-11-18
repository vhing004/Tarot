import type { Object3D, Mesh, Material, Texture } from 'three';

export interface DisposeOptions {
  keepShared?: Set<unknown>;
}

/**
 * Thu dọn toàn bộ tài nguyên Geometry, Material và Texture của một cây Object3D (R03 §4).
 * Các tài nguyên nằm trong keepShared (thuộc AssetLoader cache) sẽ được giữ lại.
 */
export function disposeObject(root: Object3D, opts: DisposeOptions = {}): void {
  const keepShared = opts.keepShared;

  root.traverse((obj) => {
    const mesh = obj as Mesh;
    if (mesh.geometry && (!keepShared || !keepShared.has(mesh.geometry))) {
      mesh.geometry.dispose();
    }

    if (mesh.material) {
      const mats: Material[] = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];

      for (const mat of mats) {
        if (keepShared && keepShared.has(mat)) continue;

        // Dọn dẹp các map texture gắn trong material
        const matRecord = mat as unknown as Record<string, unknown>;
        for (const key of Object.keys(matRecord)) {
          const val = matRecord[key];
          if (val && typeof val === 'object' && 'isTexture' in val && Boolean((val as Texture).isTexture)) {
            const tex = val as Texture;
            if (!keepShared || !keepShared.has(tex)) {
              tex.dispose();
            }
          }
        }
        mat.dispose();
      }
    }
  });

  root.removeFromParent();
}

"use client";

import { useEffect, useRef } from "react";
import { useSiteContent } from "./contentContext";

/**
 * 固定姿势 + GSAP 段切换 tween 动画
 * ─────────────────────────────────────
 *
 * motion.ts 文案切换段（统一参考系：intro fixed 滚动带 introTop→caseTop-vh）：
 *   p∈[0.00, 0.35) stage=0   左侧 ("关于我") ↔ 模型 x=+1.1 右侧 3/4 角度
 *   p∈[0.35, 0.70) stage=1   右侧 (experience) ↔ 模型 x=-1.1 左侧大 偏正面
 *   p∈[0.70, 1.00) stage=2   居中文案 + 模型缩小 z=-8 正面
 *
 * 固定姿势（文案刚 active 时模型已刚好到位）：
 *   RIGHT  文案在左 → 模型 x=+1.1 屏幕右侧，3/4 角度，z=-2.5 大
 *   LEFT   文案在右 → 模型 x=-1.1 屏幕左侧，偏正面，z=-2.5 大
 *   CENTER 文案居中 → 模型 x=0, y=-0.9, z=-8.0 → 视觉缩小在文字下方，正面
 *
 * 视野安全（FOV=45, 模型归一化后 wrapper y∈[-0.4,+1.6]）：
 *   z=-2.5 半高≈1.04 → y_base=-0.7 → 世界y∈[-1.1,+0.9] ✓
 *   z=-8.0 半高≈3.31 → y_base=-0.9 → 世界y∈[-1.3,+0.7] ✓ 居中偏下缩小
 */

type Pose = {
  /** x / y_base / z */
  p: [number, number, number];
  /** 欧拉角（弧度） */
  r: [number, number, number];
};

// 固定姿势（x 收中间一点，不要贴边）
const POSE_OUT: Pose = { p: [2.2, -0.65, -2.5], r: [-0.20, 1.30, 0] }; // 入场起点
const POSE_RIGHT: Pose = { p: [1.1, -0.70, -2.5], r: [-0.10, 0.90, 0] }; // 右侧大，3/4角度
const POSE_LEFT: Pose = { p: [-1.1, -0.70, -2.5], r: [0.00, -0.30, 0] };  // 左侧大，偏正面
const POSE_CENTER: Pose = { p: [0.0, -0.90, -8.0], r: [0.00, 0.00, 0] };  // 中央下方，缩小正面

// 段落 → 姿势映射（key: 当前 progress 所在区间 [lo, hi)）
// 参考系 = intro fixed 滚动带（introTop → caseTop - vh）
// 不再单独设 p<0.08 的"屏外"关键位：进入 intro 时模型直接站到位，
// 屏外姿势只作为模型加载时的入场起点（加载完成后 tween 到位）。
function poseForProgress(p: number): Pose {
  if (p < 0.35) return POSE_RIGHT;
  if (p < 0.7) return POSE_LEFT;
  return POSE_CENTER;
}

export default function IntroScene() {
  const holderRef = useRef<HTMLDivElement>(null);
  const content = useSiteContent();
  const modelUrl = content.intro.model;
  const brandPrimary = content.brand.colors.primary ?? "#22ba08";

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    let disposed = false;
    let frame = 0;
    let cleanupScene: (() => void) | undefined;
    let renderer: import("three").WebGLRenderer | undefined;
    let scene: import("three").Scene | undefined;

    (async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import(
        "three/examples/jsm/loaders/GLTFLoader.js"
      );
      const { RoomEnvironment } = await import(
        "three/examples/jsm/environments/RoomEnvironment.js"
      );

      if (disposed) return;

      const width = holder.clientWidth || window.innerWidth;
      const height = holder.clientHeight || window.innerHeight;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);

      const camera = new THREE.PerspectiveCamera(
        45,
        width / height,
        0.1,
        100,
      );
      camera.position.set(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(width, height);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.55;
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      renderer.domElement.style.display = "block";
      holder.appendChild(renderer.domElement);

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environment = envTexture;
      scene.environmentIntensity = 0.9;

      scene.add(new THREE.AmbientLight(0x444444, 1));

      const key = new THREE.PointLight(0xffffff, 90, 0, 2);
      key.position.set(4, 4, 3);
      scene.add(key);

      const brandHex = brandPrimary;
      const rimColor = new THREE.Color(brandHex);
      const rim = new THREE.PointLight(rimColor, 55, 0, 2);
      rim.position.set(-5, -2, 2);
      scene.add(rim);

      const fill = new THREE.PointLight(0x8fb6ff, 45, 0, 2);
      fill.position.set(0, -5, -3);
      scene.add(fill);

      const group = new THREE.Group();
      scene.add(group);

      // ====== GSAP 模块（用于段切换 tween） ======
      let gsapApi: {
        to: (
          target: unknown,
          vars: Record<string, unknown>,
        ) => { kill: () => void };
      } | undefined;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const g = (await import("gsap")) as any;
        const gsap = g.default ?? g;
        gsapApi = gsap;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[IntroScene] GSAP import failed", e);
      }

      // 当前姿势状态
      let currentPose: Pose | undefined;
      let currentTween: { kill: () => void } | undefined;

      const switchPose = (model: import("three").Group | undefined, target: Pose) => {
        if (!model) return;
        currentTween?.kill();

        if (!gsapApi) {
          model.position.set(target.p[0], target.p[1], target.p[2]);
          model.rotation.set(target.r[0], target.r[1], target.r[2]);
          currentPose = target;
          return;
        }

        // 同时 tween 位置和旋转（GSAP 支持同时 tween 两个属性对象）
        gsapApi.to(model.position, {
          x: target.p[0],
          y: target.p[1],
          z: target.p[2],
          duration: 0.85,
          ease: "power2.inOut",
        });
        const t2 = gsapApi.to(model.rotation, {
          x: target.r[0],
          y: target.r[1],
          z: target.r[2],
          duration: 0.85,
          ease: "power2.inOut",
          onComplete: () => { currentPose = target; currentTween = undefined; },
        });
        currentTween = t2;
      };

      // ====== 加载模型 ======
      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          const allMeshes: import("three").Mesh[] = [];
          model.traverse((o) => { const m = o as import("three").Mesh; if (m.isMesh) allMeshes.push(m); });

          // 强制材质颜色为品牌主色
          const brandColor = new THREE.Color(brandPrimary);
          model.traverse((obj) => {
            const mesh = obj as import("three").Mesh;
            const mat = mesh.material as
              | import("three").MeshStandardMaterial
              | import("three").MeshStandardMaterial[]
              | undefined;
            if (Array.isArray(mat)) mat.forEach((m) => { if (m) m.color = brandColor.clone(); });
            else if (mat) mat.color = brandColor.clone();
          });

          // Base-center 锚点：缩放到 maxSide ≈ 2.0，脚底对齐 wrapper y=-0.4
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxSide = Math.max(size.x, size.y, size.z) || 1;
          const scale = 2.0 / maxSide;

          model.position.sub(center);
          model.scale.setScalar(scale);
          model.position.multiplyScalar(scale);
          const minYScaled = box.min.y * scale;
          model.position.y = -0.4 - minYScaled;
          model.position.x = -center.x * scale;
          model.position.z = -center.z * scale;

          const wrapper = new THREE.Group();
          wrapper.add(model);

          // 初始放在屏外（入场起点）
          wrapper.position.set(POSE_OUT.p[0], POSE_OUT.p[1], POSE_OUT.p[2]);
          wrapper.rotation.set(POSE_OUT.r[0], POSE_OUT.r[1], POSE_OUT.r[2]);

          group.add(wrapper);
          group.userData.model = wrapper;
          group.userData.ready = true;
          currentPose = POSE_OUT;
          // 模型刚加载完，立即按当前 scroll 进度对齐 pose
          updateAndCheck();
        },
        undefined,
        (err) => {
          // eslint-disable-next-line no-console
          console.warn("[IntroScene] GLB load failed:", modelUrl, err);
        },
      );

      // ====== 进度驱动（window scroll 统一参考系：introTop→caseTop-vh） ======
      let scrolled = 0;
      let lastPose: Pose | undefined;

      const updateAndCheck = () => {
        if (!group.userData.ready) return;
        const intro = document.querySelector<HTMLElement>(".mod-introduce");
        const modCase = document.querySelector<HTMLElement>(".mod-case");
        if (intro && modCase) {
          const introTop = intro.offsetTop;
          const caseTopMinusVh = modCase.offsetTop - window.innerHeight;
          const bandLen = caseTopMinusVh - introTop;
          if (bandLen > 0) {
            const y = window.scrollY;
            scrolled = Math.min(1, Math.max(0, (y - introTop) / bandLen));
          }
        }
        const target = poseForProgress(scrolled);
        if (!lastPose || target !== lastPose) {
          lastPose = target;
          switchPose(group.userData.model, target);
        }
      };

      // 主驱动：window scroll 事件（参考系已与 motion.ts 统一为 introTop→caseTop-vh）
      window.addEventListener("scroll", updateAndCheck, { passive: true });
      window.addEventListener("resize", updateAndCheck);
      setTimeout(updateAndCheck, 300);

      const onResize = () => {
        if (!renderer) return;
        const w = holder.clientWidth || window.innerWidth;
        const h = holder.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };
      window.addEventListener("resize", onResize);

      // 只在 canvas 进入视口时才渲染，避免后段模块滚动时 3D 空转占满 GPU
      let visible = true;
      const io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) startLoop();
          else stopLoop();
        },
        { rootMargin: "200px" },
      );
      io.observe(holder);

      const animate = () => {
        if (disposed || !renderer || !scene) return;
        frame = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };

      let running = false;
      const startLoop = () => {
        if (running || disposed) return;
        running = true;
        animate();
      };
      const stopLoop = () => {
        running = false;
        if (frame) {
          cancelAnimationFrame(frame);
          frame = 0;
        }
      };

      startLoop();

      cleanupScene = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", updateAndCheck);
        io.disconnect();
        stopLoop();
        try { currentTween?.kill(); } catch { /* noop */ }
        envTexture.dispose();
        pmrem.dispose();
        scene?.traverse((obj) => {
          const mesh = obj as import("three").Mesh;
          if (mesh.geometry) mesh.geometry.dispose();
          const material = mesh.material as
            | import("three").Material
            | import("three").Material[]
            | undefined;
          if (Array.isArray(material)) material.forEach((m) => m.dispose());
          else material?.dispose();
        });
        renderer?.dispose();
        renderer?.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanupScene?.();
    };
  }, [brandPrimary, modelUrl]);

  return <div ref={holderRef} className="introduce-canvas" />;
}

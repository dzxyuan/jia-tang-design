// 把 Union.svg 挤压成 3D glb 模型
// 运行：node scripts/extrude-logo.mjs
import { JSDOM } from "jsdom";
import * as fs from "node:fs";
import * as path from "node:path";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

// DOM polyfill
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>");
globalThis.window = dom.window;
globalThis.DOMParser = dom.window.DOMParser;
globalThis.XMLSerializer = dom.window.XMLSerializer;
globalThis.Node = dom.window.Node;
globalThis.Element = dom.window.Element;
globalThis.SVGElement = dom.window.SVGElement;

// GLTFExporter 无论 binary 与否都会用到 FileReader（贴图）和 Blob.size
// 我们没有贴图，做最简 stub：
class FileReaderStub {
  constructor() { this.onloadend = null; this.onload = null; this.result = null; }
  readAsArrayBuffer(data) { this.result = data; queueMicrotask(() => { this.onloadend?.({ target: this }); this.onload?.({ target: this }); }); }
  readAsDataURL() { queueMicrotask(() => { this.onloadend?.({ target: this }); this.onload?.({ target: this }); }); }
  readAsText() {}
  abort() {}
}
globalThis.FileReader = FileReaderStub;

// Blob stub：需要正确 .size / .slice / 构造（GLTFWriter binary 模式）
class BlobStub {
  constructor(parts = [], opts = {}) {
    const bufs = parts.map((p) => {
      if (p instanceof ArrayBuffer) return p;
      if (p?.buffer instanceof ArrayBuffer) return p.buffer;
      if (typeof p === "string") return Buffer.from(p, "utf8");
      return new Uint8Array(p).buffer;
    });
    let total = 0;
    for (const b of bufs) total += b.byteLength;
    const out = new Uint8Array(total);
    let off = 0;
    for (const b of bufs) { out.set(new Uint8Array(b), off); off += b.byteLength; }
    this._buf = out.buffer;
    this.size = total;
    this.type = opts.type || "";
  }
  arrayBuffer() { return Promise.resolve(this._buf); }
  slice(start = 0, end = this.size) { return new BlobStub([this._buf.slice(start, end)]); }
}
globalThis.Blob = BlobStub;

const SVG_PATH = path.resolve("C:/Users/Administrator/Downloads/Union.svg");
const OUT_PATH = path.resolve("public/sites/choicedesign/assets/choice-logo.glb");

const svgString = fs.readFileSync(SVG_PATH, "utf8");
const result = new SVGLoader().parse(svgString);

const scene = new THREE.Group();

for (const group of result.paths) {
  const shapes = group.toShapes(true);
  // group.color 可能是 THREE.Color 或 number
  let colorNum = 0x39ff14;
  if (group.color) {
    if (typeof group.color === "number") colorNum = group.color;
    else if (group.color.isColor) colorNum = group.color.getHex();
  }
  console.log(`ShapePath: ${shapes.length} 个 shape，fill color=#${colorNum.toString(16).padStart(6, "0")}`);

  for (const shape of shapes) {
    if (!shape.curves.length) continue;

    const geom = new THREE.ExtrudeGeometry(shape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.03,
      bevelSegments: 3,
      curveSegments: 32,
      steps: 1,
    });

    geom.center();
    geom.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geom,
      new THREE.MeshStandardMaterial({
        color: colorNum,
        metalness: 0.25,
        roughness: 0.35,
      }),
    );
    scene.add(mesh);
  }
}

scene.updateMatrixWorld(true);

// 居中 & 缩放到最大边 ~2.6
const box = new THREE.Box3().setFromObject(scene);
const size = new THREE.Vector3();
const center = new THREE.Vector3();
box.getSize(size);
box.getCenter(center);
console.log(`原始尺寸 ${size.x.toFixed(2)} × ${size.y.toFixed(2)} × ${size.z.toFixed(2)}`);

if (Math.max(size.x, size.y, size.z) === 0) throw new Error("几何体是空的");

const maxDim = Math.max(size.x, size.y, size.z);
const scale = 2.6 / maxDim;

scene.traverse((obj) => {
  if (obj.isMesh) {
    obj.geometry.scale(scale, scale, scale);
    obj.geometry.translate(-center.x * scale, -center.y * scale, -center.z * scale);
  }
});
scene.updateMatrixWorld(true);

const box2 = new THREE.Box3().setFromObject(scene);
const center2 = new THREE.Vector3();
box2.getCenter(center2);
scene.position.sub(center2);
scene.updateMatrixWorld(true);

// 烘焙变换
scene.traverse((obj) => {
  if (obj.isMesh) {
    obj.geometry.applyMatrix4(obj.matrixWorld);
    obj.position.set(0, 0, 0);
    obj.rotation.set(0, 0, 0);
    obj.scale.set(1, 1, 1);
    obj.updateMatrix();
  }
});

// ========== 导出：binary:true，直接拿到 ArrayBuffer ==========
const exporter = new GLTFExporter();
const glbData = await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    (data) => resolve(data),
    (err) => reject(err),
    { binary: true },
  );
});

// GLTFExporter binary:true 返回的是 Blob（我们的 BlobStub），不是 ArrayBuffer
const glbAb = await glbData.arrayBuffer();
const glb = Buffer.from(glbAb);
fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, glb);
console.log(`✅ 导出到 ${OUT_PATH}  (${glb.byteLength} bytes)`);

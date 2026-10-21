import {
  AmbientLight,
  BackSide,
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  NearestFilter,
  PerspectiveCamera,
  Quaternion,
  RGBAFormat,
  Scene,
  SphereGeometry,
  TorusGeometry,
  UnsignedByteType,
  Vector2,
  Vector3,
  Euler,
} from "three";
import type { OwlOutfit } from "@/stores/settings";

/** Palette from DESIGN.md. */
const C = {
  body: "#A86B34",
  wing: "#8A5A2B",
  belly: "#F2D3A0",
  chevron: "#C99A5E",
  beak: "#F08A24",
  ink: "#1D2340",
  outline: "#3A2412",
  sclera: "#FFF8EA",
  cheek: "#F29A8A",
  mouth: "#B83A1B",
  gold: "#F5C542",
  cap: "#34409B",
  bow: "#3F4FB8",
} as const;

/** Every animatable number. owlMotion tweens this; `applyPose` maps it onto the meshes. */
export interface OwlPose {
  hop: number;
  sx: number;
  sy: number;
  tilt: number;
  lean: number;
  lookX: number;
  lookY: number;
  pupX: number;
  pupY: number;
  pupScale: number;
  lidU: number;
  lidL: number;
  beak: number;
  wingL: number;
  wingR: number;
  /** Right wing swung forward (towards the chin). */
  wingRFwd: number;
  breathe: number;
  /** Closed-eye line (0..1 size) and its direction: 0 = happy arch, 1 = sleepy smile. */
  arc: number;
  arcFlip: number;
  /** 0..1: glasses pushed up onto the forehead, so a closed-eye arc never crosses a lens rim. */
  glassesUp: number;
}

export const NEUTRAL_POSE: OwlPose = {
  hop: 0,
  sx: 1,
  sy: 1,
  tilt: 0,
  lean: 0,
  lookX: 0,
  lookY: 0,
  pupX: 0,
  pupY: 0,
  pupScale: 1,
  lidU: 0,
  lidL: 0,
  beak: 0,
  wingL: 0,
  wingR: 0,
  wingRFwd: 0,
  breathe: 0,
  arc: 0,
  arcFlip: 0,
  glassesUp: 0,
};

export interface OwlModel {
  scene: Scene;
  camera: PerspectiveCamera;
  applyPose: (p: OwlPose) => void;
  /** Show exactly one accessory; returns the group that now shows (for the pop). */
  showOutfit: (o: OwlOutfit) => Group | null;
  dispose: () => void;
  triangles: number;
}

const FEET_Y = 1.09; // body group sits this far above the rig origin (the floor)

/** Egg radius at height y (y in -1..1): chubby, a little wider at the bottom. */
function eggRadius(y: number): number {
  return 0.98 * Math.sqrt(Math.max(0, 1 - y * y)) * (1 - 0.12 * y);
}
function surfaceZ(x: number, y: number): number {
  const r = eggRadius(y);
  return Math.sqrt(Math.max(0, r * r - x * x));
}

export function buildOwl(): OwlModel {
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(d: T): T => {
    disposables.push(d);
    return d;
  };
  let triangles = 0;
  const count = (g: BufferGeometry, mult = 1) => {
    triangles += ((g.index ? g.index.count : g.attributes.position.count) / 3) * mult;
  };

  // Three-step toon ramp (shadow / mid / light), nearest-filtered so the bands stay crisp.
  const ramp = track(
    new DataTexture(new Uint8Array([105, 105, 105, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, RGBAFormat, UnsignedByteType),
  );
  ramp.minFilter = NearestFilter;
  ramp.magFilter = NearestFilter;
  ramp.needsUpdate = true;

  const mats = new Map<string, MeshToonMaterial>();
  const toon = (hex: string): MeshToonMaterial => {
    let m = mats.get(hex);
    if (!m) {
      m = track(new MeshToonMaterial({ color: new Color(hex), gradientMap: ramp }));
      mats.set(hex, m);
    }
    return m;
  };
  const outlineMat = track(new MeshBasicMaterial({ color: new Color(C.outline), side: BackSide }));
  const basic = (hex: string) => track(new MeshBasicMaterial({ color: new Color(hex) }));

  const geo = <T extends BufferGeometry>(g: T, mult = 1): T => {
    track(g);
    count(g, mult);
    return g;
  };

  const mesh = (g: BufferGeometry, hex: string, outline = 0): Mesh => {
    const m = new Mesh(g, toon(hex));
    if (outline) {
      const o = new Mesh(g, outlineMat);
      o.scale.setScalar(outline);
      m.add(o);
      count(g);
    }
    return m;
  };

  const sphere = (r: number, w = 20, h = 14) => geo(new SphereGeometry(r, w, h));

  // ----- scene, camera, lights -----
  const scene = new Scene();
  const camera = new PerspectiveCamera(28, 1, 1, 20);
  camera.position.set(0, 1.6, 6.6);
  camera.lookAt(0, 1.18, 0);
  scene.add(new AmbientLight(0xffffff, 1.15));
  const sun = new DirectionalLight(0xffffff, 2.6);
  sun.position.set(2.2, 3.2, 4.5);
  scene.add(sun);

  // ----- soft blob shadow -----
  const sd = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) {
      const d = Math.hypot(x - 15.5, y - 15.5) / 16;
      const a = Math.max(0, 1 - d);
      const i = (y * 32 + x) * 4;
      sd[i] = 20;
      sd[i + 1] = 18;
      sd[i + 2] = 40;
      sd[i + 3] = Math.round(255 * a * a);
    }
  const shadowTex = track(new DataTexture(sd, 32, 32, RGBAFormat, UnsignedByteType));
  shadowTex.needsUpdate = true;
  const shadowMat = track(new MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.55 }));
  const shadow = new Mesh(geo(new CircleGeometry(0.95, 16)), shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  shadow.scale.set(1.05, 0.7, 1);
  shadow.renderOrder = -1;
  scene.add(shadow);

  // ----- rig: origin at the floor so squash and stretch pivot on the feet -----
  const rig = new Group();
  scene.add(rig);
  const body = new Group();
  body.position.y = FEET_Y;
  rig.add(body);

  // egg: body + head as one soft shape
  const pts: Vector2[] = [];
  for (let i = 0; i <= 22; i++) {
    const y = -Math.cos((Math.PI * i) / 22);
    pts.push(new Vector2(Math.max(0.0001, eggRadius(y)), y));
  }
  const egg = mesh(geo(new LatheGeometry(pts, 30)), C.body, 1.035);
  body.add(egg);

  // belly + feather scallops
  const belly = mesh(sphere(1, 24, 16), C.belly);
  belly.scale.set(0.62, 0.64, 0.56);
  belly.position.set(0, -0.5, 0.39);
  body.add(belly);

  const chevGeo = geo(new TorusGeometry(0.075, 0.017, 5, 10, Math.PI));
  const chev = new InstancedMesh(chevGeo, toon(C.chevron), 7);
  const spots: [number, number][] = [
    [-0.21, -0.34],
    [0.21, -0.34],
    [0, -0.49],
    [-0.31, -0.63],
    [0.31, -0.63],
    [-0.13, -0.77],
    [0.13, -0.77],
  ];
  const tmp = new Matrix4();
  spots.forEach(([x, y], i) => {
    const nz = Math.sqrt(Math.max(0, 1 - (x / 0.62) ** 2 - ((y + 0.5) / 0.64) ** 2));
    const z = 0.39 + 0.56 * nz + 0.012;
    tmp.compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(-0.1, 0, Math.PI)), new Vector3(1, 1, 1));
    chev.setMatrixAt(i, tmp);
  });
  chev.instanceMatrix.needsUpdate = true;
  triangles += (chevGeo.index!.count / 3) * 7;
  disposables.push({ dispose: () => chev.dispose() });
  body.add(chev);

  // feet
  const footGeo = sphere(1, 12, 8);
  const toeGeo = sphere(0.062, 8, 6);
  for (const s of [-1, 1]) {
    const foot = mesh(footGeo, C.beak, 1.08);
    foot.scale.set(0.2, 0.075, 0.25);
    foot.position.set(s * 0.3, -0.99, 0.46);
    body.add(foot);
    for (const tx of [-0.1, 0, 0.1]) {
      const toe = mesh(toeGeo, C.beak);
      toe.scale.set(1, 0.8, 1.2);
      toe.position.set(s * 0.3 + tx, -1.0, 0.7 - Math.abs(tx) * 0.4);
      body.add(toe);
    }
  }

  // wings, hinged at the shoulders
  const wingGeo = sphere(1, 16, 12);
  const makeWing = (s: number) => {
    const hinge = new Group();
    hinge.position.set(s * 0.93, 0.02, 0.04);
    const w = mesh(wingGeo, C.wing, 1.06);
    w.scale.set(0.17, 0.5, 0.31);
    w.position.set(s * 0.05, -0.38, 0);
    hinge.add(w);
    body.add(hinge);
    return hinge;
  };
  const wingLHinge = makeWing(-1);
  const wingRHinge = makeWing(1);

  // face group: everything on the front of the head (turns a little to look)
  const face = new Group();
  body.add(face);

  // ear tufts
  const tuftGeo = geo(new ConeGeometry(0.22, 0.62, 12));
  for (const s of [-1, 1]) {
    const t = mesh(tuftGeo, C.wing, 1.07);
    t.position.set(s * 0.45, 0.92, -0.02);
    t.rotation.z = -s * 0.5;
    t.rotation.x = 0.15;
    face.add(t);
  }

  // eyes
  type Eye = { group: Group; pupil: Group; up: Mesh; low: Mesh; arc: Mesh };
  const eyes: Eye[] = [];
  const scleraGeo = sphere(0.34, 22, 16);
  const lidUpGeo = geo(new SphereGeometry(0.385, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  const lidLowGeo = geo(new SphereGeometry(0.385, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2));
  const pupilGeo = sphere(0.19, 16, 12);
  const glintBig = sphere(0.062, 8, 6);
  const glintSmall = sphere(0.032, 8, 6);
  const glintMat = basic("#ffffff");
  const arcGeo = geo(new TorusGeometry(0.22, 0.05, 6, 14, Math.PI));
  arcGeo.translate(0, 0, 0);
  const EYE_Y = 0.3;
  for (const s of [-1, 1]) {
    const g = new Group();
    const x = s * 0.375;
    g.position.set(x, EYE_Y, surfaceZ(x, EYE_Y) - 0.03);
    g.rotation.y = s * 0.3;
    const inner = new Group();
    inner.scale.set(1, 1, 0.62);
    g.add(inner);
    inner.add(mesh(scleraGeo, C.sclera, 1.06));
    const pupil = new Group();
    const pm = mesh(pupilGeo, C.ink);
    pm.scale.set(1, 1, 0.3);
    pupil.add(pm);
    const g1 = new Mesh(glintBig, glintMat);
    g1.position.set(0.075, 0.085, 0.07);
    g1.scale.z = 0.5;
    const g2 = new Mesh(glintSmall, glintMat);
    g2.position.set(-0.06, -0.07, 0.07);
    g2.scale.z = 0.5;
    pupil.add(g1, g2);
    pupil.position.set(0, 0, 0.325);
    inner.add(pupil);
    const up = mesh(lidUpGeo, C.body);
    const low = mesh(lidLowGeo, C.body);
    inner.add(up, low);
    const arc = new Mesh(arcGeo, toon(C.ink));
    arc.position.z = 0.3;
    arc.visible = false;
    g.add(arc);
    face.add(g);
    eyes.push({ group: g, pupil, up, low, arc });
  }

  // beak (upper + hinged lower) and the little mouth inside
  const beakUpGeo = geo(new ConeGeometry(0.13, 0.25, 12));
  beakUpGeo.rotateX(Math.PI / 2);
  const beakLowGeo = geo(new ConeGeometry(0.1, 0.18, 10));
  beakLowGeo.rotateX(Math.PI / 2);
  const beakZ = surfaceZ(0, -0.03);
  const beakUp = mesh(beakUpGeo, C.beak, 1.12);
  beakUp.scale.set(1, 0.62, 1);
  beakUp.position.set(0, 0.0, beakZ + 0.04);
  const jaw = new Group();
  jaw.position.set(0, -0.055, beakZ + 0.02);
  const beakLow = mesh(beakLowGeo, C.beak, 1.12);
  beakLow.scale.set(1, 0.6, 1);
  beakLow.position.set(0, 0, 0.02);
  jaw.add(beakLow);
  const mouth = new Mesh(sphere(1, 10, 8), toon(C.mouth));
  mouth.scale.set(0.09, 0.001, 0.12);
  mouth.position.set(0, -0.045, beakZ + 0.05);
  face.add(beakUp, jaw, mouth);

  // rosy cheeks
  const cheekGeo = sphere(0.15, 12, 8);
  for (const s of [-1, 1]) {
    const x = s * 0.64;
    const ch = mesh(cheekGeo, C.cheek);
    ch.scale.set(1, 0.72, 0.28);
    ch.position.set(x, -0.1, surfaceZ(x, -0.1) - 0.005);
    ch.rotation.y = s * 0.75;
    face.add(ch);
  }

  // ----- accessories -----
  const glasses = new Group();
  const rimGeo = geo(new TorusGeometry(0.3, 0.04, 8, 28));
  for (const e of eyes) {
    const rim = mesh(rimGeo, C.ink);
    rim.position.set(0, 0, 0.25);
    const holder = new Group();
    holder.position.copy(e.group.position);
    holder.rotation.copy(e.group.rotation);
    holder.add(rim);
    glasses.add(holder);
  }
  const bridge = mesh(geo(new CylinderGeometry(0.028, 0.028, 0.14, 6)), C.ink);
  bridge.rotation.z = Math.PI / 2;
  bridge.position.set(0, EYE_Y + 0.05, surfaceZ(0, EYE_Y) + 0.14);
  glasses.add(bridge);

  const cap = new Group();
  const skull = mesh(geo(new CylinderGeometry(0.46, 0.5, 0.26, 18)), C.cap);
  skull.position.y = 0.93;
  const board = mesh(geo(new BoxGeometry(1.1, 0.09, 1.1)), C.cap);
  board.position.y = 1.07;
  board.rotation.y = Math.PI / 4;
  const button = mesh(sphere(0.06, 8, 6), C.gold);
  button.position.y = 1.13;
  const cord = mesh(geo(new CylinderGeometry(0.014, 0.014, 0.55, 5)), C.gold);
  cord.rotation.z = Math.PI / 2 - 0.12;
  cord.position.set(0.28, 1.11, 0);
  const tassel = mesh(sphere(0.07, 8, 6), C.gold);
  tassel.scale.set(1, 1.5, 1);
  tassel.position.set(0.55, 1.0, 0);
  const tail = mesh(geo(new CylinderGeometry(0.05, 0.025, 0.2, 6)), C.gold);
  tail.position.set(0.55, 0.88, 0);
  cap.add(skull, board, button, cord, tassel, tail);
  cap.children.forEach((c) => {
    c.position.y -= 1;
  });
  cap.position.y = 1;
  cap.rotation.x = 0.28;
  

  const bow = new Group();
  const bowGeo = geo(new ConeGeometry(0.14, 0.26, 10));
  bowGeo.rotateZ(Math.PI / 2);
  for (const s of [-1, 1]) {
    const b = mesh(bowGeo, C.bow, 1.1);
    b.scale.x = s;
    b.position.set(s * 0.15, 0, 0);
    bow.add(b);
  }
  bow.add(mesh(sphere(0.075, 10, 8), C.bow, 1.12));
  bow.position.set(0, -0.3, 0.97);
  bow.scale.setScalar(1.5);

  face.add(glasses);
  face.add(cap);
  body.add(bow);
  const outfits: Record<Exclude<OwlOutfit, "none">, Group> = { glasses, cap, bow };
  (Object.values(outfits) as Group[]).forEach((g) => (g.visible = false));

  const showOutfit = (o: OwlOutfit): Group | null => {
    for (const [k, g] of Object.entries(outfits)) g.visible = k === o;
    return o === "none" ? null : outfits[o];
  };

  // ----- pose -> meshes -----
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const WING_REST = 0.14;
  const applyPose = (p: OwlPose) => {
    rig.position.y = p.hop;
    rig.scale.set(p.sx, p.sy, p.sx);
    const lift = Math.min(1, p.hop / 0.7);
    shadow.scale.set(1.05 * (1 - lift * 0.3), 0.7 * (1 - lift * 0.3), 1);
    shadowMat.opacity = 0.55 * (1 - lift * 0.45);
    body.rotation.set(p.lean + p.breathe * 0.03, p.lookX * 0.18, p.tilt);
    body.scale.setScalar(1 + p.breathe * 0.025);
    face.rotation.set(-p.lookY * 0.22, p.lookX * 0.3, 0);
    for (const e of eyes) {
      e.pupil.position.x = p.pupX * 0.1;
      e.pupil.position.y = p.pupY * 0.1;
      e.pupil.scale.setScalar(p.pupScale);
      e.pupil.visible = p.lidU < 0.9;
      e.up.rotation.x = lerp(-Math.PI / 2 - 0.35, Math.PI / 2, p.lidU);
      e.low.rotation.x = lerp(Math.PI / 2 + 0.35, -Math.PI / 2, p.lidL);
      e.arc.visible = p.arc > 0.02 && p.lidU > 0.9;
      e.arc.scale.setScalar(Math.max(0.01, p.arc) * 1.1);
      e.arc.rotation.z = p.arcFlip > 0.5 ? Math.PI : 0;
      e.arc.position.y = p.arcFlip > 0.5 ? 0.07 : -0.07;
    }
    glasses.position.set(0, p.glassesUp * 0.5, -p.glassesUp * 0.1);
    glasses.rotation.x = -p.glassesUp * 0.45;
    jaw.rotation.x = p.beak * 0.55;
    mouth.scale.y = 0.001 + p.beak * 0.05;
    wingLHinge.rotation.set(0, 0, -(WING_REST + p.wingL));
    wingRHinge.rotation.set(-p.wingRFwd, 0, WING_REST + p.wingR);
  };
  applyPose(NEUTRAL_POSE);

  return {
    scene,
    camera,
    applyPose,
    showOutfit,
    triangles: Math.round(triangles),
    dispose() {
      disposables.forEach((d) => d.dispose());
      scene.clear();
    },
  };
}

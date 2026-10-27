"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useStore } from "@/lib/store";
import { currentHighlight, currentView, type Pulse, type View } from "@/lib/bus";
import { coverId, photo } from "@/lib/photos";
import { cssVar, damp, labelTexture, mount, softShadow } from "./kit";

// The market hall. On the right, the stall: an awning, three shelves of products with their real
// cover photos, and a counter. On the left, the makers' back door and a conveyor that carries a new
// product under the arch where its listing is written, once. In front, visitors keep walking past.
// The lamp on the arch lights up only when a model is called. Visitors never light it.

type V3 = [number, number, number];
const CAM: Record<View, { p: V3; t: V3; ox: number }> = {
  market: { p: [7.4, 5.2, 20.5], t: [2.4, 2.0, 0], ox: -0.27 },
  item: { p: [8.4, 4.4, 15], t: [3.8, 2.3, -0.4], ox: -0.26 },
  studio: { p: [-0.6, 4.8, 14.5], t: [-4.2, 1.5, 0], ox: -0.3 },
  ledger: { p: [2.4, 15.5, 20], t: [1.2, 0.4, 0], ox: -0.2 },
};

const SLOTS_X = [-1, 1, 3, 5, 7];
const SHELF_Y = [1.42, 2.42, 3.42];
const SHELF_Z = -0.95;

export default function Backdrop() {
  const ref = useRef<HTMLDivElement | null>(null);
  const s = useStore();
  const listRef = useRef(s.listings);
  listRef.current = s.listings;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const st = mount(el);
    if (!st) return;
    const { scene, small, reduce } = st;

    const accent = new THREE.Color(cssVar("--accent", "#5b3fd9"));
    const support = new THREE.Color(cssVar("--support", "#f0743e"));
    const okC = new THREE.Color(cssVar("--ok", "#1f9a6c"));
    scene.fog = new THREE.Fog(0xf5f4fa, 20, 44);

    const cam = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd9d4ea, 1.75));
    const sun = new THREE.DirectionalLight(0xffffff, 1.45);
    sun.position.set(6, 12, 9);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(accent.clone().lerp(new THREE.Color(0xffffff), 0.55), 0.6);
    rim.position.set(-9, 5, -6);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);
    const disposables: { dispose: () => void }[] = [];
    const tex = (t: THREE.Texture) => {
      disposables.push(t);
      return t;
    };

    // the floor: a floating slab with a faint grid
    const gridC = document.createElement("canvas");
    gridC.width = gridC.height = 256;
    const gg = gridC.getContext("2d")!;
    gg.fillStyle = "#fbfaff";
    gg.fillRect(0, 0, 256, 256);
    gg.strokeStyle = "rgba(91,63,217,0.08)";
    gg.lineWidth = 2;
    for (let i = 0; i <= 256; i += 32) {
      gg.beginPath();
      gg.moveTo(i, 0);
      gg.lineTo(i, 256);
      gg.stroke();
      gg.beginPath();
      gg.moveTo(0, i);
      gg.lineTo(256, i);
      gg.stroke();
    }
    const gridT = tex(new THREE.CanvasTexture(gridC));
    gridT.wrapS = gridT.wrapT = THREE.RepeatWrapping;
    gridT.repeat.set(6, 2.5);
    gridT.colorSpace = THREE.SRGBColorSpace;
    const side = new THREE.MeshLambertMaterial({ color: 0xebe8f4 });
    const slab = new THREE.Mesh(new THREE.BoxGeometry(23, 0.4, 10), [side, side, new THREE.MeshLambertMaterial({ map: gridT }), side, new THREE.MeshLambertMaterial({ color: 0xf3f1f9 }), side]);
    slab.position.set(0, -0.2, 0.6);
    root.add(slab);
    const under = softShadow(28, 13, 0.28);
    under.position.y = -1.2;
    root.add(under);

    // ---------- the stall ----------
    const stall = new THREE.Group();
    root.add(stall);
    const wood = new THREE.MeshLambertMaterial({ color: 0xf1ece4 });
    const woodDark = new THREE.MeshLambertMaterial({ color: 0xd9cfc0 });
    const white = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const backPanel = new THREE.Mesh(new THREE.BoxGeometry(10.6, 4.1, 0.12), new THREE.MeshLambertMaterial({ color: 0xece8f6 }));
    backPanel.position.set(3, 2.05, -1.5);
    stall.add(backPanel);
    for (const y of SHELF_Y) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.09, 1.0), wood);
      b.position.set(3, y - 0.42, SHELF_Z);
      stall.add(b);
      const lip = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.12, 0.05), woodDark);
      lip.position.set(3, y - 0.36, SHELF_Z + 0.5);
      stall.add(lip);
    }
    const postG = new THREE.BoxGeometry(0.14, 4.6, 0.14);
    for (const px of [-2.2, 8.2])
      for (const pz of [-1.45, 2.05]) {
        const p = new THREE.Mesh(postG, woodDark);
        p.position.set(px, 2.3, pz);
        stall.add(p);
      }
    // counter, with a violet front panel
    const counter = new THREE.Mesh(new THREE.BoxGeometry(10.4, 1.05, 1.1), white);
    counter.position.set(3, 0.52, 1.5);
    stall.add(counter);
    const front = new THREE.Mesh(new THREE.BoxGeometry(10.42, 0.62, 0.02), new THREE.MeshLambertMaterial({ color: accent }));
    front.position.set(3, 0.52, 2.06);
    stall.add(front);
    const top = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.08, 1.24), woodDark);
    top.position.set(3, 1.08, 1.5);
    stall.add(top);
    const cShadow = softShadow(11.5, 2.2, 0.22);
    cShadow.position.set(3, 0.01, 1.5);
    stall.add(cShadow);

    // striped awning in the two brand colours
    const awC = document.createElement("canvas");
    awC.width = 512;
    awC.height = 64;
    const ag = awC.getContext("2d")!;
    for (let i = 0; i < 16; i++) {
      ag.fillStyle = i % 2 ? "#ffffff" : `#${support.getHexString()}`;
      ag.fillRect(i * 32, 0, 32, 64);
    }
    const awT = tex(new THREE.CanvasTexture(awC));
    awT.colorSpace = THREE.SRGBColorSpace;
    const awning = new THREE.Mesh(new THREE.BoxGeometry(11, 0.08, 3.0), [white, white, new THREE.MeshLambertMaterial({ map: awT }), white, white, white]);
    awning.position.set(3, 4.72, 0.35);
    awning.rotation.x = 0.32;
    stall.add(awning);
    const valC = document.createElement("canvas");
    valC.width = 512;
    valC.height = 64;
    const vg = valC.getContext("2d")!;
    for (let i = 0; i < 16; i++) {
      vg.fillStyle = i % 2 ? "#ffffff" : `#${support.getHexString()}`;
      vg.beginPath();
      vg.moveTo(i * 32, 0);
      vg.lineTo(i * 32 + 32, 0);
      vg.lineTo(i * 32 + 32, 40);
      vg.arc(i * 32 + 16, 40, 16, 0, Math.PI);
      vg.closePath();
      vg.fill();
    }
    const valT = tex(new THREE.CanvasTexture(valC));
    valT.colorSpace = THREE.SRGBColorSpace;
    const valance = new THREE.Mesh(new THREE.PlaneGeometry(11, 0.55), new THREE.MeshLambertMaterial({ map: valT, transparent: true, side: THREE.DoubleSide }));
    valance.position.set(3, 4.0, 1.86);
    stall.add(valance);
    const signT = tex(labelTexture("KITSTALL", { bg: "#16142b", color: "#ffffff", w: 512, h: 112, size: 64 }));
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.57), new THREE.MeshBasicMaterial({ map: signT, transparent: true }));
    sign.position.set(3, 5.42, 0.2);
    sign.rotation.x = -0.05;
    stall.add(sign);

    // ---------- products on the shelves, with their real cover photos ----------
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const coverCache = new Map<string, THREE.Texture>();
    const coverTex = (key: string) => {
      let t = coverCache.get(key);
      if (!t) {
        t = loader.load(photo(coverId(key), 320, 240));
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        coverCache.set(key, t);
        disposables.push(t);
      }
      return t;
    };
    const productG = new THREE.BoxGeometry(1.42, 1.06, 0.1);
    const edgeM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    interface Slot {
      g: THREE.Group;
      face: THREE.MeshLambertMaterial;
      id: string | null;
      base: THREE.Vector3;
      pop: number;
      want: number;
      bump: number;
      tag: THREE.Sprite;
      tagM: THREE.SpriteMaterial;
    }
    const slots: Slot[] = [];
    const tagCache = new Map<string, THREE.Texture>();
    const priceTag = (text: string) => {
      let t = tagCache.get(text);
      if (!t) {
        t = labelTexture(text, { bg: "#16142b", color: "#ffffff", w: 200, h: 84, size: 40 });
        tagCache.set(text, t);
        disposables.push(t);
      }
      return t;
    };
    const live = listRef.current.filter((l) => l.status === "live").sort((a, b) => b.views30 - a.views30);
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 5; i++) {
        const l = live[row * 5 + i];
        const g = new THREE.Group();
        const face = new THREE.MeshLambertMaterial({ color: 0xffffff, map: l ? coverTex(l.cover) : null });
        const box = new THREE.Mesh(productG, [edgeM, edgeM, edgeM, edgeM, face, edgeM]);
        box.position.y = 0.53;
        g.add(box);
        const base = new THREE.Vector3(SLOTS_X[i], SHELF_Y[row] - 0.37, SHELF_Z + 0.05);
        g.position.copy(base);
        g.rotation.x = -0.12;
        g.rotation.y = ((i - 2) * -0.05);
        stall.add(g);
        const tagM = new THREE.SpriteMaterial({ map: l ? priceTag(`$${l.price}`) : null, transparent: true, opacity: 0, depthWrite: false });
        const tag = new THREE.Sprite(tagM);
        tag.scale.set(0.62, 0.26, 1);
        tag.position.set(0, 1.32, 0.1);
        g.add(tag);
        slots.push({ g, face, id: l?.id ?? null, base, pop: 0, want: 0, bump: 0, tag, tagM });
      }

    // ---------- the makers' door, the conveyor and the arch where listings get written ----------
    const back = new THREE.Group();
    back.position.set(-6, 0, -0.1);
    root.add(back);
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.4, 3.2), new THREE.MeshLambertMaterial({ color: 0xe6e1f2 }));
    wall.position.set(-3.6, 1.7, 0);
    back.add(wall);
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.2), new THREE.MeshBasicMaterial({ color: 0xfff1e2 }));
    doorGlow.position.set(-3.44, 1.12, 0);
    doorGlow.rotation.y = Math.PI / 2;
    back.add(doorGlow);
    const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.5, 1.85), woodDark);
    doorFrame.position.set(-3.48, 1.25, 0);
    back.add(doorFrame);
    doorFrame.renderOrder = -1;
    const doorLabelT = tex(labelTexture("Maker's facts", { bg: "#ffffff", color: "#16142b", w: 360, h: 84, size: 36, border: "#d7d4e5" }));
    const doorLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: doorLabelT, transparent: true }));
    doorLabel.scale.set(1.15, 0.27, 1);
    doorLabel.position.set(-3.1, 2.9, 0.4);
    back.add(doorLabel);

    const beltC = document.createElement("canvas");
    beltC.width = 128;
    beltC.height = 32;
    const bg2 = beltC.getContext("2d")!;
    bg2.fillStyle = "#d8d3ea";
    bg2.fillRect(0, 0, 128, 32);
    bg2.fillStyle = "#c7c0e0";
    for (let i = 0; i < 128; i += 16) bg2.fillRect(i, 0, 6, 32);
    const beltT = tex(new THREE.CanvasTexture(beltC));
    beltT.wrapS = THREE.RepeatWrapping;
    beltT.repeat.set(6, 1);
    beltT.colorSpace = THREE.SRGBColorSpace;
    const belt = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.16, 0.95), [woodDark, woodDark, new THREE.MeshLambertMaterial({ map: beltT }), woodDark, woodDark, woodDark]);
    belt.position.set(0.05, 0.62, 0);
    back.add(belt);
    const legG = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    for (const lx of [-3.0, 3.0])
      for (const lz of [-0.4, 0.4]) {
        const leg = new THREE.Mesh(legG, woodDark);
        leg.position.set(lx, 0.27, lz);
        back.add(leg);
      }
    const beltShadow = softShadow(7.2, 1.6, 0.2);
    beltShadow.position.set(0, 0.01, 0);
    back.add(beltShadow);

    const archM = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: accent.clone().multiplyScalar(0.0) });
    const archPostG = new THREE.BoxGeometry(0.16, 2.0, 0.16);
    for (const z of [-0.62, 0.62]) {
      const p = new THREE.Mesh(archPostG, archM);
      p.position.set(-0.4, 1.4, z);
      back.add(p);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 1.44), archM);
    beam.position.set(-0.4, 2.4, 0);
    back.add(beam);
    const lampM = new THREE.MeshPhongMaterial({ color: 0xd9d4ea, emissive: 0x000000, shininess: 80 });
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), lampM);
    lamp.position.set(-0.4, 2.72, 0);
    back.add(lamp);
    const haloM = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, depthWrite: false });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 14), haloM);
    halo.position.copy(lamp.position);
    back.add(halo);
    const scanM = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 1.2), scanM);
    scan.rotation.y = Math.PI / 2;
    scan.scale.set(1, 1, 1);
    const veil = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.7), scanM);
    veil.rotation.y = Math.PI / 2;
    veil.position.set(-0.4, 1.35, 0);
    back.add(veil);
    const archLabelT = tex(labelTexture("Written once", { bg: "#5b3fd9", color: "#ffffff", w: 360, h: 84, size: 38 }));
    const archLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: archLabelT, transparent: true }));
    archLabel.scale.set(1.2, 0.28, 1);
    archLabel.position.set(-0.4, 3.32, 0);
    back.add(archLabel);

    // boxes riding the conveyor
    const writtenT = tex(labelTexture("Written", { bg: "#1f9a6c", color: "#ffffff", w: 220, h: 80, size: 36 }));
    interface Rider {
      g: THREE.Group;
      face: THREE.MeshLambertMaterial;
      tag: THREE.Sprite;
      x: number;
      alive: boolean;
      hold: number;
      written: boolean;
      speed: number;
    }
    const riders: Rider[] = [];
    const riderG = new THREE.BoxGeometry(0.78, 0.58, 0.08);
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      const face = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const m = new THREE.Mesh(riderG, [edgeM, edgeM, edgeM, edgeM, face, edgeM]);
      m.position.y = 0.29;
      m.rotation.y = -0.25;
      g.add(m);
      const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: writtenT, transparent: true, depthWrite: false }));
      tag.scale.set(0.6, 0.22, 1);
      tag.position.set(0, 0.82, 0.05);
      tag.visible = false;
      g.add(tag);
      g.visible = false;
      back.add(g);
      riders.push({ g, face, tag, x: -3.2, alive: false, hold: 0, written: false, speed: 1 });
    }
    const covers = live.map((l) => l.cover);
    let coverI = 7;
    const spawnRider = (hold: number) => {
      const r = riders.find((x) => !x.alive);
      if (!r) return null;
      r.alive = true;
      r.x = -3.3;
      r.hold = hold;
      r.written = false;
      r.speed = 1.15;
      r.tag.visible = false;
      r.face.map = coverTex(covers[coverI++ % covers.length]);
      r.face.needsUpdate = true;
      r.g.visible = true;
      r.g.position.set(r.x, 0.7, 0);
      r.g.scale.setScalar(0.001);
      return r;
    };

    // ---------- visitors walking past the stall ----------
    const N = small ? 18 : 30;
    const bodyG = new THREE.CapsuleGeometry(0.17, 0.52, 4, 10);
    const headG = new THREE.SphereGeometry(0.15, 14, 10);
    const bodyM = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const headM = new THREE.MeshLambertMaterial({ color: 0xf1d3bd });
    const bodies = new THREE.InstancedMesh(bodyG, bodyM, N);
    const heads = new THREE.InstancedMesh(headG, headM, N);
    bodies.frustumCulled = false;
    heads.frustumCulled = false;
    const shirt = ["#5b3fd9", "#f0743e", "#2a2740", "#7fb3a6", "#d9cfc0", "#9b8fe8", "#e8b04a", "#4b6584", "#c0587e", "#6aa5d9"].map((c) => new THREE.Color(c));
    const skin = ["#f1d3bd", "#d9a98a", "#b07a58", "#8a5a3c", "#5e3b28", "#e8c3a3"].map((c) => new THREE.Color(c));
    interface Walker {
      x: number;
      z: number;
      v: number;
      on: boolean;
      stop: number;
      phase: number;
    }
    const walkers: Walker[] = [];
    for (let i = 0; i < N; i++) {
      bodies.setColorAt(i, shirt[i % shirt.length]);
      heads.setColorAt(i, skin[(i * 7) % skin.length]);
      walkers.push({ x: -12 + (i / N) * 24, z: 3.0 + ((i * 37) % 10) / 10, v: 0.75 + ((i * 13) % 7) / 12, on: i < N * 0.55, stop: 0, phase: i * 1.7 });
    }
    root.add(bodies, heads);
    const dummy = new THREE.Object3D();

    // coins popping when something sells
    const coinM = new THREE.MeshPhongMaterial({ color: 0xf2b84b, emissive: 0x6a4a08, shininess: 90 });
    const coinG = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 24);
    const coins: { m: THREE.Mesh; life: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(coinG, coinM);
      m.rotation.x = Math.PI / 2;
      m.visible = false;
      root.add(m);
      coins.push({ m, life: 0 });
    }
    const popCoin = (x: number, z: number) => {
      const c = coins.find((k) => k.life <= 0);
      if (!c) return;
      c.life = 1;
      c.m.position.set(x, 1.9, z);
      c.m.visible = true;
    };

    // a ring above a product when a buyer asks about it
    const ringM = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 40), ringM);
    stall.add(ring);
    let ringLife = 0;

    // ---------- events from the page ----------
    let glow = 0;
    let glowColor = accent.clone();
    let scanT = 0;
    let lastWriteRider: Rider | null = null;
    const onPulse = (e: Event) => {
      const { kind, n } = (e as CustomEvent<{ kind: Pulse; n: number }>).detail;
      if (kind === "visit") {
        let k = n;
        for (const w of walkers) {
          if (k <= 0) break;
          if (!w.on) {
            w.on = true;
            w.x = -12.5;
            w.stop = 0;
            k--;
          }
        }
      } else if (kind === "sale") {
        const near = walkers.filter((w) => w.on && w.x > -1 && w.x < 7 && w.stop <= 0);
        const w = near[Math.floor(Math.random() * near.length)];
        if (w) {
          w.stop = 1.8;
          popCoin(w.x, w.z - 0.6);
        } else popCoin(-1 + Math.random() * 8, 2.6);
        const sl = slots[Math.floor(Math.random() * slots.length)];
        sl.bump = 1;
      } else if (kind === "write") {
        glow = 1;
        glowColor = accent.clone();
        scanT = 2.2;
        lastWriteRider = spawnRider(14);
      } else if (kind === "publish") {
        glow = 1;
        glowColor = okC.clone();
        if (lastWriteRider && lastWriteRider.alive) {
          lastWriteRider.hold = 0;
          lastWriteRider.speed = 2.2;
        } else {
          const r = spawnRider(0);
          if (r) r.speed = 2.0;
        }
        lastWriteRider = null;
        slots.forEach((sl, i) => (sl.bump = Math.max(sl.bump, 0.4 + (i % 3) * 0.2)));
      } else if (kind === "query") {
        glow = Math.max(glow, 0.35);
        glowColor = accent.clone().lerp(new THREE.Color(0x7ad3ff), 0.5);
      } else if (kind === "ask") {
        glow = Math.max(glow, 0.65);
        glowColor = accent.clone();
        ringLife = 1.4;
      }
    };
    window.addEventListener("kit:pulse", onPulse);

    let hi: string[] = currentHighlight();
    const applyHi = (ids: string[]) => {
      hi = ids;
      // a product that is not on the shelves borrows the middle slot while it is being looked at
      const onShelf = new Set(slots.map((x) => x.id));
      const missing = ids.filter((id) => !onShelf.has(id)).slice(0, 2);
      const spare = [7, 8];
      missing.forEach((id, k) => {
        const l = listRef.current.find((x) => x.id === id);
        const sl = slots[spare[k]];
        if (!l || !sl) return;
        sl.id = id;
        sl.face.map = coverTex(l.cover);
        sl.face.needsUpdate = true;
        sl.tagM.map = priceTag(`$${l.price}`);
        sl.tagM.needsUpdate = true;
      });
      slots.forEach((sl) => (sl.want = sl.id && hi.includes(sl.id) ? 1 : 0));
    };
    applyHi(hi);
    const onHi = (e: Event) => applyHi((e as CustomEvent<string[]>).detail);
    window.addEventListener("kit:hi", onHi);

    let v: View = currentView();
    const onView = (e: Event) => {
      v = (e as CustomEvent<View>).detail;
    };
    window.addEventListener("kit:view", onView);

    let px = 0;
    let py = 0;
    const onMove = (e: PointerEvent) => {
      px = e.clientX / window.innerWidth - 0.5;
      py = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const camP = new THREE.Vector3(...CAM[v].p);
    const camT = new THREE.Vector3(...CAM[v].t);
    let ox = CAM[v].ox;
    cam.position.copy(camP);
    const fit = (w: number, h: number) => {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    };
    const { w: w0, h: h0 } = st.size();
    fit(w0, h0);
    st.onResize(fit);
    const tmpP = new THREE.Vector3();
    const tmpT = new THREE.Vector3();
    let ambientT = 9;

    st.loop((dt, t) => {
      const { w, h } = st.size();
      const narrow = w < 900;
      const preset = CAM[v];
      const sy = Math.min(window.scrollY, 1600);
      tmpT.set(...preset.t);
      tmpP.set(...preset.p);
      const dist = tmpP.distanceTo(tmpT);
      const minDist = w < 560 ? 26 : narrow ? 20 : 0;
      if (dist < minDist) tmpP.sub(tmpT).multiplyScalar(minDist / dist).add(tmpT);
      tmpP.x += px * 1.2;
      tmpP.y += -py * 0.6 + sy * 0.0028;
      tmpT.y += sy * 0.0022;
      camP.x = damp(camP.x, tmpP.x, 2.2, dt);
      camP.y = damp(camP.y, tmpP.y, 2.2, dt);
      camP.z = damp(camP.z, tmpP.z, 2.2, dt);
      camT.x = damp(camT.x, tmpT.x, 2.4, dt);
      camT.y = damp(camT.y, tmpT.y, 2.4, dt);
      camT.z = damp(camT.z, tmpT.z, 2.4, dt);
      ox = damp(ox, narrow ? 0 : preset.ox, 2.2, dt);
      cam.position.copy(camP);
      cam.lookAt(camT);
      cam.setViewOffset(w, h, w * ox, h * (narrow ? 0.27 : 0.14), w, h);
      root.rotation.y = reduce ? 0 : Math.sin(t * 0.1) * 0.03;

      // products: the highlighted ones step forward and show their price
      for (const sl of slots) {
        sl.pop = damp(sl.pop, sl.want, 6, dt);
        sl.bump = Math.max(0, sl.bump - dt * 1.6);
        sl.g.position.set(sl.base.x, sl.base.y + sl.pop * 0.16 + Math.sin(sl.bump * Math.PI) * 0.12, sl.base.z + sl.pop * 0.55);
        sl.g.scale.setScalar(1 + sl.pop * 0.12);
        sl.face.emissive.copy(accent).multiplyScalar(sl.pop * 0.18);
        sl.tagM.opacity = sl.pop;
      }
      if (ringLife > 0) {
        ringLife = Math.max(0, ringLife - dt);
        const target = slots.find((x) => x.want > 0) ?? slots[7];
        ring.position.set(target.g.position.x, target.g.position.y + 1.65, target.g.position.z + 0.1);
        const k = 1 - ringLife / 1.4;
        ring.scale.setScalar(0.6 + k * 1.2);
        ringM.opacity = Math.sin(Math.min(1, k) * Math.PI) * 0.8;
      } else ringM.opacity = 0;

      // the arch lamp: lit only by model calls
      glow = Math.max(0, glow - dt * 0.55);
      lampM.emissive.copy(glowColor).multiplyScalar(glow * 0.95);
      lampM.color.copy(new THREE.Color(0xd9d4ea).lerp(glowColor, glow * 0.6));
      haloM.color.copy(glowColor);
      haloM.opacity = glow * 0.35;
      halo.scale.setScalar(1 + glow * 0.8);
      archM.emissive.copy(glowColor).multiplyScalar(glow * 0.12);
      scanT = Math.max(0, scanT - dt);
      scanM.opacity = scanT > 0 ? 0.1 + Math.sin(t * 9) * 0.06 + 0.1 : glow * 0.1;

      if (!reduce) {
        beltT.offset.x -= dt * 0.18;
        ambientT -= dt;
        if (ambientT <= 0) {
          // another maker somewhere publishes: one write, then it joins the stall
          ambientT = 15 + Math.random() * 8;
          const r = spawnRider(1.4);
          if (r) r.speed = 1.2;
        }
      }
      for (const r of riders) {
        if (!r.alive) continue;
        const arch = -0.4;
        if (!r.written && r.x >= arch - 0.02) {
          if (r.hold > 0) {
            r.hold -= dt;
            glow = Math.max(glow, 0.55 + Math.sin(t * 6) * 0.2);
            scanT = Math.max(scanT, 0.3);
          } else {
            r.written = true;
            r.tag.visible = true;
            glow = Math.max(glow, 0.9);
          }
        } else if (!reduce || r.written) {
          r.x += dt * r.speed;
        }
        if (!r.written && r.x > arch) r.x = arch;
        r.g.position.x = r.x;
        const enter = Math.min(1, (r.x + 3.3) / 0.6);
        const exit = r.x > 2.6 ? Math.max(0, 1 - (r.x - 2.6) / 0.6) : 1;
        r.g.scale.setScalar(Math.max(0.001, Math.min(enter, exit)));
        if (r.x > 3.2) {
          r.alive = false;
          r.g.visible = false;
          slots[Math.floor(Math.random() * 5)].bump = 1;
        }
      }

      // visitors
      for (let i = 0; i < N; i++) {
        const wk = walkers[i];
        if (wk.on && !reduce) {
          if (wk.stop > 0) wk.stop -= dt;
          else wk.x += dt * wk.v;
          if (wk.x > 12.5) wk.on = false;
        }
        const bob = wk.stop > 0 || reduce ? 0 : Math.abs(Math.sin(t * 6 * wk.v + wk.phase)) * 0.06;
        const sc = wk.on ? 1 : 0.0001;
        dummy.position.set(wk.x, 0.5 + bob, wk.z);
        dummy.rotation.set(0, wk.stop > 0 ? 0 : Math.PI / 2, 0);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        bodies.setMatrixAt(i, dummy.matrix);
        dummy.position.set(wk.x, 1.12 + bob, wk.z);
        dummy.updateMatrix();
        heads.setMatrixAt(i, dummy.matrix);
      }
      bodies.instanceMatrix.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true;

      for (const c of coins) {
        if (c.life <= 0) continue;
        c.life -= dt * 0.8;
        c.m.position.y += dt * 0.9;
        c.m.rotation.z += dt * 6;
        c.m.scale.setScalar(Math.max(0.001, Math.min(1, c.life * 2.5)));
        if (c.life <= 0) c.m.visible = false;
      }

      st.renderer.render(scene, cam);
    });

    return () => {
      window.removeEventListener("kit:pulse", onPulse);
      window.removeEventListener("kit:hi", onHi);
      window.removeEventListener("kit:view", onView);
      window.removeEventListener("pointermove", onMove);
      disposables.forEach((d) => d.dispose());
      st.dispose();
    };
    // the scene is built once; the page talks to it through events
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="backdrop" ref={ref} aria-hidden="true" />;
}

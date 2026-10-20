import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function createLabel(text, color = '#17324d') {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255,255,255,.94)';
  ctx.roundRect(8, 8, 496, 112, 22); ctx.fill();
  ctx.fillStyle = color; ctx.font = '700 34px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
  sprite.scale.set(4.1, 1.02, 1);
  return sprite;
}

function addBox(parent, size, position, material, cast = true) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position); mesh.castShadow = cast; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function addRoom(root, { name, x, z, w, d, color, doorway = 'south' }) {
  const floor = new THREE.Mesh(new THREE.BoxGeometry(w, 0.18, d), new THREE.MeshStandardMaterial({ color, roughness: 0.88 }));
  floor.position.set(x, 0.02, z); floor.receiveShadow = true; root.add(floor);
  const wall = new THREE.MeshStandardMaterial({ color: '#f1f5f8', roughness: 0.84 });
  const edge = new THREE.MeshStandardMaterial({ color: '#a9b9c8', roughness: 0.75 });
  const h = 2.45, t = 0.2;
  addBox(root, [w, h, t], [x, h / 2, z - d / 2], wall);
  addBox(root, [t, h, d], [x - w / 2, h / 2, z], wall);
  addBox(root, [t, h, d], [x + w / 2, h / 2, z], wall);
  if (doorway === 'south') {
    const gap = Math.min(1.7, w * 0.28), side = (w - gap) / 2;
    addBox(root, [side, h, t], [x - (gap + side) / 2, h / 2, z + d / 2], wall);
    addBox(root, [side, h, t], [x + (gap + side) / 2, h / 2, z + d / 2], wall);
    addBox(root, [gap, 0.18, 0.06], [x, 1.05, z + d / 2], edge, false);
  } else {
    addBox(root, [w, h, t], [x, h / 2, z + d / 2], wall);
  }
  const label = createLabel(name);
  label.position.set(x, 0.18, z); root.add(label);
}

function addStairs(root, x, z, name, color = '#2563a8') {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.66 });
  for (let i = 0; i < 6; i += 1) addBox(root, [1.6, 0.18, 0.48], [x, 0.1 + i * 0.17, z + (i - 2.5) * 0.48], mat);
  const marker = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.16, 28), new THREE.MeshStandardMaterial({ color: '#0f2744' }));
  marker.position.set(x, 1.28, z - 2.1); root.add(marker);
  const label = createLabel(name, '#ffffff'); label.position.set(x, 2.12, z - 2.1); label.scale.set(2.7, 0.68, 1); root.add(label);
}

export default function EvacuationScene({ userPos, target, routeColor, activeHazards = [], selectedFloor = 3, detailFloor = null, onSelectFloor }) {
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const resetRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#edf3f8');
    scene.fog = new THREE.Fog('#edf3f8', 42, 82);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
    scene.add(new THREE.HemisphereLight('#ffffff', '#9aafc2', 2.2));
    const sun = new THREE.DirectionalLight('#ffffff', 3.2);
    sun.position.set(-12, 24, 14); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun);
    const fill = new THREE.DirectionalLight('#c7e6ff', 1.2); fill.position.set(14, 10, -12); scene.add(fill);

    const root = new THREE.Group(); scene.add(root);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#eaf0f5', roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.48; ground.receiveShadow = true; scene.add(ground);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(34, 0.42, 22), new THREE.MeshStandardMaterial({ color: '#627c95', roughness: 0.75 }));
    slab.userData.floorMarker = 1;
    slab.position.y = -0.23; slab.receiveShadow = true; slab.castShadow = true; root.add(slab);
    const hall = new THREE.Mesh(new THREE.BoxGeometry(31, 0.12, 3.1), new THREE.MeshStandardMaterial({ color: '#dcebf4', roughness: 0.7 }));
    hall.position.set(0, 0.08, 0); root.add(hall);
    const spine = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.13, 18.5), new THREE.MeshStandardMaterial({ color: '#dcebf4', roughness: 0.7 }));
    spine.position.set(0, 0.09, 0); root.add(spine);
    addRoom(root, { name: 'LOBBY · 101', x: -11, z: -6.2, w: 8.2, d: 5.6, color: '#e8dcc9' });
    addRoom(root, { name: 'OFFICES · 102', x: -3.2, z: -6.2, w: 5.8, d: 5.6, color: '#dce8ee' });
    addRoom(root, { name: 'REFUGE · 103', x: 6.1, z: -6.2, w: 8, d: 5.6, color: activeHazards.length ? '#f4d6d3' : '#dce8ee' });
    addRoom(root, { name: 'SERVICE CORE', x: -11, z: 6.3, w: 8.2, d: 5.5, color: '#d8e0e7', doorway: 'north' });
    addRoom(root, { name: 'AMENITIES', x: 10.1, z: 6.3, w: 7.5, d: 5.5, color: '#e4e9dc', doorway: 'north' });

    const glass = new THREE.MeshStandardMaterial({ color: '#85b8d7', metalness: 0.08, roughness: 0.24, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 4; i += 1) addBox(root, [1.12, 1.35, 0.08], [-13.55 + i * 1.8, 1.25, -9.02], glass, false);
    const furniture = new THREE.MeshStandardMaterial({ color: '#8296a8', roughness: 0.8 });
    addBox(root, [2.1, 0.52, 0.85], [-11, 0.44, -6.4], furniture);
    addBox(root, [1.3, 0.78, 1.5], [-3.5, 0.57, -6.2], furniture);
    addBox(root, [1.9, 0.38, 0.9], [10, 0.36, 6.1], furniture);

    const perimeter = new THREE.MeshStandardMaterial({ color: '#d5e0e9', roughness: 0.8 });
    addBox(root, [34, 2.7, 0.25], [0, 1.35, -11], perimeter);
    addBox(root, [0.25, 2.7, 22], [-17, 1.35, 0], perimeter);
    addBox(root, [0.25, 2.7, 22], [17, 1.35, 0], perimeter);
    addBox(root, [34, 2.7, 0.25], [0, 1.35, 11], perimeter);
    addStairs(root, -15, 0, 'STAIR B', '#2563a8');
    addStairs(root, 15, 0, 'STAIR A', '#2563a8');
    const lift = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), new THREE.MeshStandardMaterial({ color: '#78a9c8', roughness: 0.32, metalness: 0.15 }));
    lift.position.set(0, 1.3, -9.4); lift.castShadow = true; root.add(lift);
    const liftLabel = createLabel('EVAC LIFT'); liftLabel.position.set(0, 2.9, -9.4); liftLabel.scale.set(2.8, 0.7, 1); root.add(liftLabel);
    const serviceLift = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 2.4), new THREE.MeshStandardMaterial({ color: '#91a3b3', roughness: 0.5, metalness: 0.18 }));
    serviceLift.position.set(13, 1.3, -7); serviceLift.castShadow = true; root.add(serviceLift);
    const serviceLiftLabel = createLabel('SERVICE LIFT'); serviceLiftLabel.position.set(13, 2.9, -7); serviceLiftLabel.scale.set(3, 0.7, 1); root.add(serviceLiftLabel);

    const floorHeight = 6.2;
    const groundLabel = createLabel('LEVEL 01', '#ffffff');
    groundLabel.userData.floorLabel = 1;
    groundLabel.position.set(0, 3.2, 11.8); groundLabel.scale.set(3.2, 0.8, 1); scene.add(groundLabel);
    for (let floor = 2; floor <= 3; floor += 1) {
      const upperFloor = root.clone(true);
      upperFloor.position.y = (floor - 1) * floorHeight;
      upperFloor.userData.floorShell = floor;
      upperFloor.traverse((item) => {
        if (item.userData.floorMarker) item.userData.floorMarker = floor;
      });
      scene.add(upperFloor);
      const floorLabel = createLabel(`LEVEL 0${floor}`, '#ffffff');
      floorLabel.userData.floorLabel = floor;
      floorLabel.position.set(0, (floor - 1) * floorHeight + 3.2, 11.8);
      floorLabel.scale.set(3.2, 0.8, 1); scene.add(floorLabel);
    }
    const stairMaterial = new THREE.MeshStandardMaterial({ color: '#55728e', roughness: 0.8 });
    for (const stairX of [-15, 15]) {
      for (let storey = 0; storey < 2; storey += 1) {
        for (let step = 0; step < 12; step += 1) {
          const y = storey * floorHeight + 0.25 + step * 0.49;
          const z = -1.75 + step * 0.3;
          addBox(scene, [1.35, 0.18, 0.34], [stairX, y, z], stairMaterial);
        }
      }
    }

    const toWorld = (point) => new THREE.Vector3((point.x - 450) / 25, 0.24, (270 - point.y) / 25);
    const start = toWorld(userPos);
    const startY = (selectedFloor - 1) * floorHeight + 0.3;
    start.y = startY;
    const stairX = target?.id === 'secondary' ? -15 : 15;
    const junction = new THREE.Vector3(0, startY, 0);
    const routePoints = [start, junction];
    if (target?.id === 'refuge') {
      routePoints.push(new THREE.Vector3(5, startY, -6));
    } else if (target?.id === 'accessible' || target?.id === 'cargo') {
      const liftX = target.id === 'cargo' ? 13 : 0;
      const liftZ = target.id === 'cargo' ? -7 : -9.4;
      routePoints.push(new THREE.Vector3(liftX, startY, liftZ));
      for (let floor = selectedFloor - 1; floor >= 1; floor -= 1) routePoints.push(new THREE.Vector3(liftX, (floor - 1) * floorHeight + 0.3, liftZ));
      routePoints.push(new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(19, 0.3, 0));
    } else {
      routePoints.push(new THREE.Vector3(stairX, startY, 0));
      for (let floor = selectedFloor - 1; floor >= 1; floor -= 1) {
        routePoints.push(new THREE.Vector3(stairX, (floor - 1) * floorHeight + floorHeight * 0.5, floor % 2 ? -1.6 : 1.6));
        routePoints.push(new THREE.Vector3(stairX, (floor - 1) * floorHeight + 0.3, 0));
      }
      routePoints.push(new THREE.Vector3(stairX, 0.3, 0));
      routePoints.push(new THREE.Vector3(stairX > 0 ? 19 : -19, 0.3, 0));
    }
    const routeMaterial = new THREE.MeshStandardMaterial({ color: routeColor, emissive: routeColor, emissiveIntensity: 0.85, roughness: 0.28 });
    const route = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(routePoints), 48, 0.17, 10, false), routeMaterial);
    root.add(route);
    const beacon = new THREE.Group(); beacon.position.copy(start); root.add(beacon);
    const beaconCore = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 18), new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0369a1', emissiveIntensity: 0.6 })); beaconCore.position.y = 0.34; beacon.add(beaconCore);
    const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.045, 8, 36), new THREE.MeshBasicMaterial({ color: '#38bdf8' })); beaconRing.rotation.x = Math.PI / 2; beaconRing.position.y = 0.22; beacon.add(beaconRing);
    if (activeHazards.length) {
      const hazard = new THREE.Mesh(new THREE.ConeGeometry(0.65, 1.5, 3), new THREE.MeshStandardMaterial({ color: '#dc2626', emissive: '#7f1d1d', emissiveIntensity: 0.35 }));
      hazard.position.set(5, (selectedFloor - 1) * floorHeight + 0.9, -5.7); hazard.castShadow = true; scene.add(hazard);
    }
    const grid = new THREE.GridHelper(200, 100, '#d7e1e9', '#e2e9ef'); grid.position.y = -0.46; scene.add(grid);

    scene.children.filter((child) => child.userData.floorLabel).forEach((label) => { label.visible = !detailFloor || label.userData.floorLabel === detailFloor; });
    root.visible = !detailFloor || detailFloor === 1;
    scene.children.filter((child) => child.userData.floorShell).forEach((group) => { group.visible = !detailFloor || group.userData.floorShell === detailFloor; });
    const visibleStart = toWorld(userPos);
    const fullRouteStart = new THREE.Vector3(visibleStart.x, (selectedFloor - 1) * floorHeight + 0.3, visibleStart.z);
    const overviewPath = [fullRouteStart];
    const routeExitX = target?.id === 'secondary' ? -19 : 19;
    if (selectedFloor > 1) {
      const shaftX = target?.id === 'accessible' ? 0 : target?.id === 'cargo' ? 13 : routeExitX === -19 ? -15 : 15;
      const shaftZ = target?.id === 'accessible' ? -9.4 : target?.id === 'cargo' ? -7 : 0;
      overviewPath.push(new THREE.Vector3(shaftX, fullRouteStart.y, shaftZ));
      for (let floor = selectedFloor - 1; floor >= 1; floor -= 1) overviewPath.push(new THREE.Vector3(shaftX, (floor - 1) * floorHeight + 0.3, shaftZ));
    }
    overviewPath.push(new THREE.Vector3(0, 0.3, 0), new THREE.Vector3(routeExitX, 0.3, 0));
    const overviewRoute = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(overviewPath), 96, 0.2, 10, false), new THREE.MeshStandardMaterial({ color: routeColor, emissive: routeColor, emissiveIntensity: 0.85, roughness: 0.28 }));
    scene.add(overviewRoute);
    const overviewOrigin = new THREE.Mesh(new THREE.SphereGeometry(0.54, 24, 18), new THREE.MeshStandardMaterial({ color: '#0284c7', emissive: '#0369a1', emissiveIntensity: 0.75 }));
    overviewOrigin.position.copy(fullRouteStart).y += 0.55; scene.add(overviewOrigin);
    const overviewExit = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.32, 32), new THREE.MeshStandardMaterial({ color: '#16a34a', emissive: '#15803d', emissiveIntensity: 0.4 }));
    overviewExit.position.set(routeExitX, 0.2, 0); scene.add(overviewExit);

    let theta = THREE.MathUtils.degToRad(325), phi = THREE.MathUtils.degToRad(58), radius = detailFloor ? 31 : 58;
    const focus = new THREE.Vector3(0, detailFloor ? (detailFloor - 1) * floorHeight + 1 : 6.2, 0);
    const updateCamera = () => {
      phi = THREE.MathUtils.clamp(phi, THREE.MathUtils.degToRad(22), THREE.MathUtils.degToRad(78));
      camera.position.set(focus.x + radius * Math.sin(phi) * Math.sin(theta), focus.y + radius * Math.cos(phi), focus.z + radius * Math.sin(phi) * Math.cos(theta));
      camera.lookAt(focus); camera.updateProjectionMatrix();
    };
    updateCamera(); cameraRef.current = {
      updateCamera,
      zoom: (direction) => { radius = THREE.MathUtils.clamp(radius + direction * 5, 22, 62); updateCamera(); },
      reset: () => { theta = THREE.MathUtils.degToRad(325); phi = THREE.MathUtils.degToRad(58); radius = detailFloor ? 31 : 58; updateCamera(); },
    };
    resetRef.current = () => cameraRef.current?.reset();
    let pointer = null;
    const onDown = (event) => { pointer = { x: event.clientX, y: event.clientY }; canvas.setPointerCapture(event.pointerId); };
    const onMove = (event) => { if (!pointer) return; theta -= (event.clientX - pointer.x) * 0.008; phi += (event.clientY - pointer.y) * 0.006; pointer = { x: event.clientX, y: event.clientY }; updateCamera(); };
    const raycaster = new THREE.Raycaster();
    const pointerVector = new THREE.Vector2();
    const onUp = (event) => {
      if (!pointer) return;
      const moved = Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y);
      pointer = null;
      if (moved > 7 || !onSelectFloor) return;
      const rect = canvas.getBoundingClientRect();
      pointerVector.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerVector.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerVector, camera);
      const marker = raycaster.intersectObjects(scene.children, true).find((hit) => hit.object.userData.floorMarker);
      if (marker) onSelectFloor(marker.object.userData.floorMarker);
    };
    const onWheel = (event) => { event.preventDefault(); radius = THREE.MathUtils.clamp(radius + event.deltaY * 0.025, 22, 62); updateCamera(); };
    canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp); canvas.addEventListener('wheel', onWheel, { passive: false });
    const resize = () => { const rect = canvas.getBoundingClientRect(); renderer.setSize(rect.width, rect.height, false); camera.aspect = rect.width / Math.max(rect.height, 1); camera.updateProjectionMatrix(); };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    let frame;
    const animate = () => { frame = requestAnimationFrame(animate); beaconRing.rotation.z += 0.012; renderer.render(scene, camera); };
    animate();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp); canvas.removeEventListener('wheel', onWheel); renderer.dispose(); scene.traverse((item) => { if (item.geometry) item.geometry.dispose(); if (item.material) { const materials = Array.isArray(item.material) ? item.material : [item.material]; materials.forEach((material) => { if (material.map) material.map.dispose(); material.dispose(); }); } }); };
  }, [userPos, target, routeColor, activeHazards, selectedFloor, detailFloor, onSelectFloor]);

  return <div className="evac-three-viewport">
    <canvas ref={canvasRef} className="evac-three-canvas" aria-label="Interactive multi-floor 3D evacuation route. Drag to orbit, scroll to zoom. Click a floor marker to inspect it." />
    <div className="evac-three-controls"><span>Drag to orbit · Scroll to zoom</span><button type="button" aria-label="Zoom out" onClick={() => cameraRef.current?.zoom(1)}>−</button><button type="button" aria-label="Zoom in" onClick={() => cameraRef.current?.zoom(-1)}>+</button><button type="button" onClick={() => resetRef.current?.()}>Reset</button></div>
  </div>;
}

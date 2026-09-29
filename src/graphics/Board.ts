import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export const SQUARE_SIZE = 2.0;

export class Board {
  public group: THREE.Group;
  public tileMeshes: Map<string, THREE.Mesh> = new Map();
  private highlightGroup: THREE.Group;
  private selectedRing: THREE.Mesh | null = null;
  public moveIndicators: THREE.Mesh[] = [];
  private checkIndicator: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.highlightGroup = new THREE.Group();
    this.group.add(this.highlightGroup);
    scene.add(this.group);

    this.createBoardTiles();
    this.createBoardFrame();
    this.setupLighting(scene);
    this.loadEnvironmentProps();
  }

  public static squareToCoords(square: string): { x: number; z: number } {
    const col = square.charCodeAt(0) - 97; // 'a' -> 0, 'h' -> 7
    const row = parseInt(square[1]) - 1;   // '1' -> 0, '8' -> 7
    return {
      x: (col - 3.5) * SQUARE_SIZE,
      z: (3.5 - row) * SQUARE_SIZE
    };
  }

  public static coordsToSquare(x: number, z: number): string | null {
    const col = Math.round(x / SQUARE_SIZE + 3.5);
    const row = Math.round(3.5 - z / SQUARE_SIZE);
    if (col < 0 || col > 7 || row < 0 || row > 7) return null;
    return String.fromCharCode(97 + col) + (row + 1);
  }

  private createBoardTiles() {
    const tileGeom = new THREE.BoxGeometry(SQUARE_SIZE, 0.1, SQUARE_SIZE);
    const invisibleMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const mesh = new THREE.Mesh(tileGeom, invisibleMat);
        const { x, z } = Board.squareToCoords(String.fromCharCode(97 + col) + (row + 1));
        mesh.position.set(x, 0.05, z);

        const square = String.fromCharCode(97 + col) + (row + 1);
        mesh.name = `tile_${square}`;
        mesh.userData = { square };
        this.tileMeshes.set(square, mesh);
        this.group.add(mesh);
      }
    }
  }

  private createBoardFrame() {
    // The 3D Floating Chess Arena model already includes ancient stone borders and 4 corner pillars.
  }

  private setupLighting(scene: THREE.Scene) {
    // Soft Sky & Ground Ambient Fill
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.0);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x88bbff, 0x332211, 1.2);
    scene.add(hemiLight);

    // Main Sun Directional Light (Wider shadow frustum to cover citadel & bone gate)
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunLight.position.set(16, 26, 18);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 70;
    sunLight.shadow.camera.left = -24;
    sunLight.shadow.camera.right = 24;
    sunLight.shadow.camera.top = 24;
    sunLight.shadow.camera.bottom = -24;
    sunLight.shadow.bias = -0.0004;
    scene.add(sunLight);

    // Warm torch & demonic glow on the Dark Abyss side
    const darkTorchLight = new THREE.PointLight(0xff4411, 5.0, 22);
    darkTorchLight.position.set(0, 5, -13);
    scene.add(darkTorchLight);

    const boneGateAccent = new THREE.PointLight(0xa832d4, 4.0, 20);
    boneGateAccent.position.set(0, 8, -17);
    scene.add(boneGateAccent);

    // Holy radiance & golden glow on the Light Citadel side
    const holyLight = new THREE.PointLight(0xffea9f, 3.5, 22);
    holyLight.position.set(0, 5, 13);
    scene.add(holyLight);

    const citadelAccent = new THREE.PointLight(0x60a5fa, 3.0, 20);
    citadelAccent.position.set(0, 8, 17);
    scene.add(citadelAccent);
  }

  private loadEnvironmentProps() {
    const loader = new GLTFLoader();

    const setupMeshes = (scene: THREE.Group) => {
      scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          materials.forEach((mat) => {
            if (mat) {
              const m = mat as THREE.MeshStandardMaterial;
              if (m.map) {
                m.map.anisotropy = 16;
                m.map.minFilter = THREE.LinearMipmapLinearFilter;
                m.map.magFilter = THREE.LinearFilter;
                m.map.generateMipmaps = true;
                m.map.needsUpdate = true;
              }
              if (m.normalMap) m.normalMap.anisotropy = 16;
              if (m.roughnessMap) m.roughnessMap.anisotropy = 16;
            }
          });
        }
      });
    };

    // 1. Floating Chess Arena (Đấu trường bàn cờ 3D lơ lửng cổ đại với 4 cột trụ đá và mặt sàn đá/dung nham)
    loader.load('./assets/models/meshy/env/board/floating_chess_arena.glb', (gltf) => {
      const arena = gltf.scene;
      setupMeshes(arena);
      arena.scale.set(8.55, 6.0, 10.05);
      arena.position.set(0, -1.386, 0);
      this.group.add(arena);
    });

    // 2. White Base: White Faction Grand Citadel (Thành lũy hoàng gia phe Trắng)
    loader.load('./assets/models/meshy/env/bases/white_grand_citadel.glb', (gltf) => {
      const citadel = gltf.scene;
      setupMeshes(citadel);
      citadel.scale.set(8.5, 8.5, 8.5);
      citadel.position.set(0, 0.604 * 8.5 - 0.4, 15.5);
      citadel.rotation.y = Math.PI; // Face towards battlefield (-Z)
      this.group.add(citadel);
    });

    // 3. Black Base: Black Faction Colossal Bone Gate (Cổng xương quỷ phe Đen)
    loader.load('./assets/models/meshy/env/bases/black_colossal_bone_gate.glb', (gltf) => {
      const boneGate = gltf.scene;
      setupMeshes(boneGate);
      boneGate.scale.set(8.5, 8.5, 8.5);
      boneGate.position.set(0, 0.478 * 8.5 - 0.4, -15.5);
      boneGate.rotation.y = 0; // Face towards battlefield (+Z)
      this.group.add(boneGate);
    });

    // 4. White Canyon Cliffs (Vách đá hẻm núi phe Trắng)
    loader.load('./assets/models/meshy/env/cliffs/white_canyon_cliff.glb', (gltf) => {
      const cliffLeft = gltf.scene;
      setupMeshes(cliffLeft);
      cliffLeft.scale.set(7.5, 7.5, 7.5);
      cliffLeft.position.set(-15.5, 0.626 * 7.5 - 0.4, 7.0);
      cliffLeft.rotation.y = Math.PI / 4;
      this.group.add(cliffLeft);

      const cliffRight = cliffLeft.clone();
      cliffRight.position.set(15.5, 0.626 * 7.5 - 0.4, 7.0);
      cliffRight.rotation.y = -Math.PI / 4;
      this.group.add(cliffRight);
    });

    // 5. Black Canyon Cliffs (Vách đá hẻm núi phe Đen)
    loader.load('./assets/models/meshy/env/cliffs/black_canyon_cliff.glb', (gltf) => {
      const cliffLeft = gltf.scene;
      setupMeshes(cliffLeft);
      cliffLeft.scale.set(7.5, 7.5, 7.5);
      cliffLeft.position.set(-15.5, 0.469 * 7.5 - 0.4, -7.0);
      cliffLeft.rotation.y = (3 * Math.PI) / 4;
      this.group.add(cliffLeft);

      const cliffRight = cliffLeft.clone();
      cliffRight.position.set(15.5, 0.469 * 7.5 - 0.4, -7.0);
      cliffRight.rotation.y = (-3 * Math.PI) / 4;
      this.group.add(cliffRight);
    });

    // 6. Terrain Props (Đạo cụ cảnh quan)
    loader.load('./assets/models/meshy/env/props/white_terrain_props.glb', (gltf) => {
      const propLeft = gltf.scene;
      setupMeshes(propLeft);
      propLeft.scale.set(4.5, 4.5, 4.5);
      propLeft.position.set(-11.0, 0.668 * 4.5 - 0.4, 13.0);
      this.group.add(propLeft);

      const propRight = propLeft.clone();
      propRight.position.set(11.0, 0.668 * 4.5 - 0.4, 13.0);
      this.group.add(propRight);
    });

    loader.load('./assets/models/meshy/env/props/black_terrain_props.glb', (gltf) => {
      const propLeft = gltf.scene;
      setupMeshes(propLeft);
      propLeft.scale.set(4.5, 4.5, 4.5);
      propLeft.position.set(-11.0, 0.258 * 4.5 - 0.4, -13.0);
      this.group.add(propLeft);

      const propRight = propLeft.clone();
      propRight.position.set(11.0, 0.258 * 4.5 - 0.4, -13.0);
      this.group.add(propRight);
    });
  }

  public showSelectedSquare(square: string | null) {
    if (this.selectedRing) {
      this.highlightGroup.remove(this.selectedRing);
      this.selectedRing.geometry.dispose();
      (this.selectedRing.material as THREE.Material).dispose();
      this.selectedRing = null;
    }

    if (!square) return;

    const { x, z } = Board.squareToCoords(square);
    const geom = new THREE.RingGeometry(SQUARE_SIZE * 0.35, SQUARE_SIZE * 0.45, 32);
    geom.rotateX(-Math.PI / 2);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.selectedRing = new THREE.Mesh(geom, mat);
    this.selectedRing.position.set(x, 0.05, z);
    this.highlightGroup.add(this.selectedRing);
  }

  public showLegalMoves(legalSquares: string[], captureSquares: string[]) {
    // Clear old indicators
    this.moveIndicators.forEach(mesh => {
      this.highlightGroup.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    this.moveIndicators = [];

    // Legal destination circles
    legalSquares.forEach(sq => {
      const isCapture = captureSquares.includes(sq);
      const { x, z } = Board.squareToCoords(sq);

      const geom = isCapture
        ? new THREE.RingGeometry(SQUARE_SIZE * 0.35, SQUARE_SIZE * 0.46, 32)
        : new THREE.CircleGeometry(SQUARE_SIZE * 0.22, 24);
      geom.rotateX(-Math.PI / 2);

      const color = isCapture ? 0xff2244 : 0x00ff66;
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isCapture ? 0.9 : 0.75
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.set(x, 0.05, z);
      mesh.userData = { square: sq };
      this.highlightGroup.add(mesh);
      this.moveIndicators.push(mesh);
    });
  }

  public showCheck(kingSquare: string | null) {
    if (this.checkIndicator) {
      this.highlightGroup.remove(this.checkIndicator);
      this.checkIndicator.geometry.dispose();
      (this.checkIndicator.material as THREE.Material).dispose();
      this.checkIndicator = null;
    }

    if (!kingSquare) return;

    const { x, z } = Board.squareToCoords(kingSquare);
    const geom = new THREE.RingGeometry(SQUARE_SIZE * 0.25, SQUARE_SIZE * 0.48, 32);
    geom.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff0033,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });

    this.checkIndicator = new THREE.Mesh(geom, mat);
    this.checkIndicator.position.set(x, 0.06, z);
    this.highlightGroup.add(this.checkIndicator);
  }

  public clearHighlights() {
    this.showSelectedSquare(null);
    this.showLegalMoves([], []);
  }
}

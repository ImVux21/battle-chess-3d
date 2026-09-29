import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as TWEEN from '@tweenjs/tween.js';
import { Board } from './Board';
import { soundManager } from '../sound/SoundManager';
import { VFXManager } from '../vfx/VFXManager';

export interface Piece3D {
  id: string;
  square: string;
  color: 'w' | 'b';
  type: string;
  model: THREE.Group;
  mixer: THREE.AnimationMixer;
  animations: Map<string, THREE.AnimationClip>;
  currentAction: THREE.AnimationAction | null;
}

export const PIECE_TYPES: Record<string, { sym: string; name: string }> = {
  p: { sym: 'p', name: 'pawn' },
  r: { sym: 'r', name: 'rook' },
  n: { sym: 'n', name: 'knight' },
  b: { sym: 'b', name: 'bishop' },
  q: { sym: 'q', name: 'queen' },
  k: { sym: 'k', name: 'king' },
  pawn: { sym: 'p', name: 'pawn' },
  rook: { sym: 'r', name: 'rook' },
  knight: { sym: 'n', name: 'knight' },
  bishop: { sym: 'b', name: 'bishop' },
  queen: { sym: 'q', name: 'queen' },
  king: { sym: 'k', name: 'king' }
};

export interface PieceModelConfig {
  scale: number;
  yOffset: number;
  displayName: string;
  role: string;
}

// Meshy piece configuration:
// 10 Non-knights have center at Y=0, bounding box Y: [-0.952, 0.951] (height ~1.90m).
// To place their feet firmly on tile surface (Y=0), yOffset = 0.952 * scale.
// Knights have feet already at Y=0, so yOffset = 0.
export const MESHY_PIECE_CONFIG: Record<string, PieceModelConfig> = {
  // White Pieces
  w_k: { scale: 0.88, yOffset: 0.952 * 0.88, displayName: 'Paladin King', role: 'Vua Hiệp Sĩ' },
  w_q: { scale: 0.84, yOffset: 0.952 * 0.84, displayName: 'Sorceress Queen', role: 'Hậu Phù Thủy' },
  w_b: { scale: 0.80, yOffset: 0.952 * 0.80, displayName: 'High Priest', role: 'Tượng Đại Pháp Sư' },
  w_n: { scale: 0.82, yOffset: 0.0,          displayName: 'Mounted Cavalry', role: 'Mã Kỵ Binh' },
  w_r: { scale: 0.80, yOffset: 0.952 * 0.80, displayName: 'Stone Guardian', role: 'Xe Hộ Vệ Đá' },
  w_p: { scale: 0.65, yOffset: 0.952 * 0.65, displayName: 'Castle Guard', role: 'Tốt Thị Vệ' },
  // Black Pieces
  b_k: { scale: 0.88, yOffset: 0.952 * 0.88, displayName: 'Orc Warlord', role: 'Vua Chúa Tể Orc' },
  b_q: { scale: 0.84, yOffset: 0.952 * 0.84, displayName: 'Lich Sorceress', role: 'Hậu Vu Yêu Hắc Ám' },
  b_b: { scale: 0.80, yOffset: 0.952 * 0.80, displayName: 'Cult Priest', role: 'Tượng Tế Tư Tà Giáo' },
  b_n: { scale: 0.88, yOffset: 0.0,          displayName: 'Nightmare Beast', role: 'Mã Ma Thú Ác Mộng' },
  b_r: { scale: 0.80, yOffset: 0.952 * 0.80, displayName: 'Ogre Brute', role: 'Xe Khổng Lồ Quỷ' },
  b_p: { scale: 0.65, yOffset: 0.952 * 0.65, displayName: 'Skeleton Warrior', role: 'Tốt Chiến Binh Xương' },
};

export class PieceManager {
  private scene: THREE.Scene;
  private vfx: VFXManager;
  private loader: GLTFLoader;
  private templates: Map<string, { scene: THREE.Group; animations: THREE.AnimationClip[] }> = new Map();
  public pieces: Map<string, Piece3D> = new Map(); // keyed by square e.g. "e4"

  constructor(scene: THREE.Scene, vfx: VFXManager) {
    this.scene = scene;
    this.vfx = vfx;
    this.loader = new GLTFLoader();
  }

  public async preloadAll(onProgress?: (loaded: number, total: number, name: string) => void): Promise<void> {
    const pieceNames = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'];
    const colors: ('w' | 'b')[] = ['w', 'b'];
    const total = colors.length * pieceNames.length;
    let loaded = 0;

    const promises: Promise<void>[] = [];

    for (const color of colors) {
      const folder = color === 'w' ? 'white' : 'black';
      for (const name of pieceNames) {
        const sym = PIECE_TYPES[name].sym;
        
        // Meshy models are .glb
        // White pieces and black pieces (except black queen and knights) have armed versions
        const hasArmedVersion = (name !== 'knight') && !(color === 'b' && name === 'queen');
        const basePath = `./assets/models/meshy`;
        let url = `${basePath}/${folder}/${name}.glb`;
        
        if (hasArmedVersion) {
            url = `${basePath}/merged/${folder}_${name}_armed.glb`;
        }

        promises.push(
          this.loadTemplate(color, sym, name, url).then(() => {
            loaded++;
            if (onProgress) {
              const cfg = MESHY_PIECE_CONFIG[`${color}_${sym}`];
              onProgress(loaded, total, cfg ? cfg.displayName : `${color}_${name}`);
            }
          })
        );
      }
    }

    await Promise.all(promises);
  }

  private loadTemplate(color: 'w' | 'b', sym: string, name: string, url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (gltf: GLTF) => {
          gltf.scene.traverse((child) => {
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
          const tmplData = { scene: gltf.scene, animations: gltf.animations };
          // Register under both single-letter symbol (e.g. w_p) and full name (e.g. w_pawn)
          this.templates.set(`${color}_${sym}`, tmplData);
          this.templates.set(`${color}_${name}`, tmplData);
          resolve();
        },
        undefined,
        (err) => {
          console.error(`Failed to load model: ${url}`, err);
          reject(err);
        }
      );
    });
  }

  public generateThumbnails(): Map<string, string> {
    const thumbMap = new Map<string, string>();
    const colors: ('w' | 'b')[] = ['w', 'b'];
    const pieceNames = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'];

    for (const color of colors) {
      for (const name of pieceNames) {
        const sym = PIECE_TYPES[name].sym;
        // High-res Meshy sculpt portrait with pedestal
        thumbMap.set(`${color}_${sym}`, `./assets/images/pieces/${color}_${sym}.png`);
      }
    }

    return thumbMap;
  }

  public spawnPiece(square: string, color: 'w' | 'b', type: string): Piece3D | null {
    const rawType = type.toLowerCase();
    const info = PIECE_TYPES[rawType];
    const sym = info ? info.sym : rawType;
    const name = info ? info.name : rawType;

    const tmpl = this.templates.get(`${color}_${sym}`) || this.templates.get(`${color}_${name}`);
    if (!tmpl) {
      console.warn(`Template not found for: ${color}_${type} (${sym}/${name})`);
      return null;
    }

    // Clone model and its skeleton hierarchy
    const model = (SkeletonUtils.clone(tmpl.scene) as THREE.Group) || this.cloneFbxGltf(tmpl.scene);
    const mixer = new THREE.AnimationMixer(model);

    // Configuration from MESHY_PIECE_CONFIG
    const config = MESHY_PIECE_CONFIG[`${color}_${sym}`] || { scale: 0.75, yOffset: 0, displayName: name, role: '' };
    model.scale.set(config.scale, config.scale, config.scale);

    // Save baseY in model userData for hop and movement animation
    model.userData.baseY = config.yOffset;

    // Position piece on board: feet touch the ground surface (Y = 0)
    const { x, z } = Board.squareToCoords(square);
    model.position.set(x, config.yOffset, z);

    // Initial orientation: Models naturally face +Z at rotation.y = 0.
    // White at south end faces North (-Z) -> Math.PI; Black at north end faces South (+Z) -> 0
    model.rotation.y = color === 'w' ? Math.PI : 0;

    this.scene.add(model);

    const animMap = new Map<string, THREE.AnimationClip>();
    tmpl.animations.forEach(clip => animMap.set(clip.name, clip));

    const piece: Piece3D = {
      id: `${color}_${sym}_${square}`,
      square,
      color,
      type: sym,
      model,
      mixer,
      animations: animMap,
      currentAction: null
    };

    // Play Idle animation with slight random offset to prevent clone breathing
    this.playAnimation(piece, 'Idle', true, Math.random() * 2);

    this.pieces.set(square, piece);
    return piece;
  }

  public getPieceAt(square: string): Piece3D | undefined {
    return this.pieces.get(square);
  }

  public removePiece(square: string): void {
    const piece = this.pieces.get(square);
    if (piece) {
      this.scene.remove(piece.model);
      this.pieces.delete(square);
    }
  }

  public playAnimation(piece: Piece3D, animKeyword: string, loop: boolean = true, timeOffset: number = 0): THREE.AnimationAction | null {
    // Find closest matching animation name
    let chosenClip: THREE.AnimationClip | null = null;
    const lowerKey = animKeyword.toLowerCase();

    for (const [name, clip] of piece.animations) {
      if (name.toLowerCase().includes(lowerKey)) {
        chosenClip = clip;
        break;
      }
    }

    // Fallbacks
    if (!chosenClip) {
      if (lowerKey === 'attack') {
        for (const [name, clip] of piece.animations) {
          if (
            name.includes('Punch') ||
            name.includes('Weapon') ||
            name.includes('Sword') ||
            name.includes('Spell') ||
            name.includes('Attack') ||
            name.includes('Bow') ||
            name.includes('Bite') ||
            name.includes('Headbutt')
          ) {
            chosenClip = clip;
            break;
          }
        }
      } else if (lowerKey === 'death') {
        for (const [name, clip] of piece.animations) {
          if (name.includes('Death') || name.includes('Die')) {
            chosenClip = clip;
            break;
          }
        }
      } else if (lowerKey === 'run' || lowerKey === 'walk') {
        for (const [name, clip] of piece.animations) {
          if (
            name.includes('Run') ||
            name.includes('Walk') ||
            name.includes('Flying') ||
            name.includes('Fly')
          ) {
            chosenClip = clip;
            break;
          }
        }
      } else if (lowerKey === 'hitreact' || lowerKey === 'hit' || lowerKey === 'recievehit') {
        for (const [name, clip] of piece.animations) {
          if (name.includes('Hit') || name.includes('Recieve')) {
            chosenClip = clip;
            break;
          }
        }
      }
    }

    if (!chosenClip) return null;

    const action = piece.mixer.clipAction(chosenClip);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    action.clampWhenFinished = !loop;

    if (piece.currentAction && piece.currentAction !== action) {
      piece.currentAction.crossFadeTo(action, 0.25, true);
    }

    action.reset();
    if (timeOffset > 0) action.time = timeOffset;
    action.play();
    piece.currentAction = action;

    return action;
  }

  public movePieceSmoothly(fromSq: string, toSq: string, onArrived: () => void) {
    const piece = this.pieces.get(fromSq);
    if (!piece) {
      onArrived();
      return;
    }

    this.pieces.delete(fromSq);
    piece.square = toSq;
    this.pieces.set(toSq, piece);

    const targetCoords = Board.squareToCoords(toSq);
    const startCoords = { x: piece.model.position.x, z: piece.model.position.z };

    // Rotate towards movement direction (models naturally face +Z when rotation.y = 0)
    const dx = targetCoords.x - startCoords.x;
    const dz = targetCoords.z - startCoords.z;
    const angle = Math.atan2(dx, dz);
    piece.model.rotation.y = angle;

    // Start Running
    this.playAnimation(piece, 'Run', true);
    soundManager.play('move');

    const isKnight = piece.type === 'n';
    const moveDuration = isKnight ? 650 : 550;
    const hasAnimation = piece.animations.size > 0;
    const baseY = piece.model.userData.baseY ?? 0;

    // Tween position
    new TWEEN.Tween(piece.model.position, true)
      .to({ x: targetCoords.x, z: targetCoords.z }, moveDuration)
      .easing(TWEEN.Easing.Quadratic.Out)
      .onUpdate((_obj, elapsed) => {
        if (!hasAnimation) {
          // Add a hop and a slight tilt for static pieces on top of baseY
          piece.model.position.y = baseY + Math.sin(elapsed * Math.PI) * 0.8;
          // Tilt forward slightly during the middle of the hop
          piece.model.rotation.x = Math.sin(elapsed * Math.PI) * 0.2;
        }
      })
      .onComplete(() => {
        if (!hasAnimation) {
          piece.model.position.y = baseY;
          piece.model.rotation.x = 0;
        }
        // Face enemy side again
        piece.model.rotation.y = piece.color === 'w' ? Math.PI : 0;
        const idleAction = this.playAnimation(piece, 'Idle', true);
        if (!idleAction && piece.currentAction) {
          piece.currentAction.fadeOut(0.2);
          setTimeout(() => {
            piece.currentAction?.stop();
            piece.currentAction = null;
          }, 200);
        }
        onArrived();
      })
      .start();
  }

  public executeBattleClash(
    attackerSq: string,
    victimSq: string,
    destSq: string = victimSq,
    onImpact: () => void,
    onBattleOver: () => void
  ) {
    const attacker = this.pieces.get(attackerSq);
    const victim = this.pieces.get(victimSq);

    if (!attacker && !victim) {
      onImpact();
      onBattleOver();
      return;
    }

    if (!victim && attacker) {
      // Victim piece already gone or missing from map; smoothly move attacker to destination
      this.movePieceSmoothly(attackerSq, destSq, () => {
        onImpact();
        onBattleOver();
      });
      return;
    }

    if (!attacker && victim) {
      // Attacker missing from map; clean up victim
      this.removePiece(victimSq);
      onImpact();
      onBattleOver();
      return;
    }

    // Both attacker and victim are present.
    // Eagerly remove victim from pieces map so victimSq is free and victim cannot be selected
    this.pieces.delete(victimSq);

    // Step 1: Attacker dashes in front of victim
    const targetCoords = Board.squareToCoords(victimSq);
    const destCoords = Board.squareToCoords(destSq);
    const attackerStartCoords = { x: attacker!.model.position.x, z: attacker!.model.position.z };

    const dirX = targetCoords.x - attackerStartCoords.x;
    const dirZ = targetCoords.z - attackerStartCoords.z;
    const dist = Math.hypot(dirX, dirZ);
    const normX = dirX / (dist || 1);
    const normZ = dirZ / (dist || 1);

    // Stop just before victim
    const clashX = targetCoords.x - normX * 0.8;
    const clashZ = targetCoords.z - normZ * 0.8;

    attacker!.model.rotation.y = Math.atan2(normX, normZ);
    victim!.model.rotation.y = Math.atan2(-normX, -normZ); // victim faces attacker

    const hasAnimation = attacker!.animations.size > 0;
    const hasVictimAnimation = victim!.animations.size > 0;
    const attackerBaseY = attacker!.model.userData.baseY ?? 0;

    this.playAnimation(attacker!, 'Run', true);
    soundManager.play('move');

    new TWEEN.Tween(attacker!.model.position, true)
      .to({ x: clashX, z: clashZ }, 450)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate((_obj, elapsed) => {
        if (!hasAnimation) {
          attacker!.model.position.y = attackerBaseY + Math.sin(elapsed * Math.PI) * 0.8;
          attacker!.model.rotation.x = Math.sin(elapsed * Math.PI) * 0.2;
        }
      })
      .onComplete(() => {
        if (!hasAnimation) {
          attacker!.model.position.y = attackerBaseY;
          attacker!.model.rotation.x = 0;
          
          // Animate a little "bump" forward for the strike!
          new TWEEN.Tween(attacker!.model.position, true)
            .to({ x: clashX + normX * 0.4, z: clashZ + normZ * 0.4 }, 100)
            .yoyo(true).repeat(1)
            .easing(TWEEN.Easing.Quadratic.Out)
            .start();
        }

        // Step 2: Strike!
        this.playAnimation(attacker!, 'Attack', false);

        setTimeout(() => {
          // Impact hit
          soundManager.play('clash');
          soundManager.play('hit');
          this.vfx.createHitSparks(victim!.model.position, victim!.color === 'b');
          onImpact();

          if (!hasVictimAnimation) {
             // Shake the static victim
             new TWEEN.Tween(victim!.model.rotation, true)
               .to({ x: -0.5, z: 0.2 }, 150)
               .yoyo(true).repeat(1)
               .start();
          }

          // Victim plays hit then death
          this.playAnimation(victim!, 'HitReact', false);

          setTimeout(() => {
            this.playAnimation(victim!, 'Death', false);
            this.vfx.createDeathDissolve(victim!.model.position, victim!.color === 'b');

            // Fade victim out into the ground
            new TWEEN.Tween(victim!.model.position, true)
              .to({ y: -1.5 }, 700)
              .easing(TWEEN.Easing.Quadratic.In)
              .onComplete(() => {
                this.scene.remove(victim!.model);
                // NOTE: Do NOT call this.pieces.delete(victimSq) here!
                // The victim was already deleted from this.pieces, and deleting it here
                // would delete the newly moved attacker piece that stepped onto victimSq!
              })
              .start();

            // If destination is different from victim (e.g. en-passant), turn attacker toward destination
            if (destSq !== victimSq) {
              const dx = destCoords.x - clashX;
              const dz = destCoords.z - clashZ;
              attacker!.model.rotation.y = Math.atan2(dx, dz);
            }

            // Attacker steps onto destination square proudly
            new TWEEN.Tween(attacker!.model.position, true)
              .to({ x: destCoords.x, y: attackerBaseY, z: destCoords.z }, 400)
              .easing(TWEEN.Easing.Quadratic.Out)
              .onUpdate((_obj, elapsed) => {
                if (!hasAnimation) {
                  attacker!.model.position.y = attackerBaseY + Math.sin(elapsed * Math.PI) * 0.8;
                  attacker!.model.rotation.x = Math.sin(elapsed * Math.PI) * 0.2;
                }
              })
              .onComplete(() => {
                if (!hasAnimation) {
                  attacker!.model.position.y = attackerBaseY;
                  attacker!.model.rotation.x = 0;
                }
                this.pieces.delete(attackerSq);
                attacker!.square = destSq;
                this.pieces.set(destSq, attacker!);

                attacker!.model.rotation.y = attacker!.color === 'w' ? Math.PI : 0;
                const idleAction = this.playAnimation(attacker!, 'Idle', true);
                if (!idleAction && attacker!.currentAction) {
                  attacker!.currentAction.fadeOut(0.2);
                  setTimeout(() => {
                    attacker!.currentAction?.stop();
                    attacker!.currentAction = null;
                  }, 200);
                }
                onBattleOver();
              })
              .start();
          }, 350);
        }, 250);
      })
      .start();
  }

  public clearAll() {
    this.pieces.forEach(p => {
      this.scene.remove(p.model);
    });
    this.pieces.clear();
  }

  public update(delta: number) {
    this.pieces.forEach(p => {
      p.mixer.update(delta);
    });
  }

  // Deep clone helper for glTF models with SkinnedMesh
  private cloneFbxGltf(source: THREE.Group): THREE.Group {
    const clone = source.clone(true);
    const sourceBones: THREE.Bone[] = [];
    const cloneBones: THREE.Bone[] = [];

    source.traverse((child) => {
      if ((child as THREE.Bone).isBone) sourceBones.push(child as THREE.Bone);
    });

    clone.traverse((child) => {
      if ((child as THREE.Bone).isBone) cloneBones.push(child as THREE.Bone);
    });

    clone.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh;
        const newBones = mesh.skeleton.bones.map(b => {
          const idx = sourceBones.indexOf(b);
          return cloneBones[idx] || b;
        });
        mesh.skeleton = new THREE.Skeleton(newBones, mesh.skeleton.boneInverses);
        mesh.bind(mesh.skeleton, mesh.bindMatrix);
      }
    });

    return clone;
  }
}

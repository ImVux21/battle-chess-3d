import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as TWEEN from '@tweenjs/tween.js';

export class ActionCam {
  public camera: THREE.PerspectiveCamera;
  public controls: OrbitControls;
  public isCinematic: boolean = false;
  public skipKillCam: boolean = false;

  private defaultPosition = new THREE.Vector3(0, 16, 17);
  private defaultTarget = new THREE.Vector3(0, 0, 0);

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.camera.position.copy(this.defaultPosition);

    this.controls = new OrbitControls(this.camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2.1; // Don't go below ground
    this.controls.minDistance = 6;
    this.controls.maxDistance = 35;
    this.controls.target.copy(this.defaultTarget);
    this.controls.update();
  }

  public resetToDefault(duration: number = 800) {
    new TWEEN.Tween(this.camera.position, true)
      .to(this.defaultPosition, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    new TWEEN.Tween(this.controls.target, true)
      .to(this.defaultTarget, duration)
      .easing(TWEEN.Easing.Cubic.Out)
      .onUpdate(() => this.controls.update())
      .start();
  }

  public triggerKillCam(
    attackerPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    onHit: () => void,
    onFinished: () => void
  ) {
    if (this.skipKillCam) {
      onHit();
      onFinished();
      return;
    }

    this.isCinematic = true;
    this.controls.enabled = false;

    // The battle takes place at the victim's square (targetPos), with the attacker stopping ~0.8 units in front.
    const dir = new THREE.Vector3().subVectors(targetPos, attackerPos);
    dir.y = 0;
    if (dir.lengthSq() < 0.0001) {
      dir.set(0, 0, -1);
    } else {
      dir.normalize();
    }

    // Clash center is right in front of victim where the combatants meet
    const clashCenter = targetPos.clone().sub(dir.clone().multiplyScalar(0.4));
    // Look target at character chest height (~0.9 units above board)
    const lookTarget = clashCenter.clone().add(new THREE.Vector3(0, 0.9, 0));

    // Perpendicular vector for dramatic side-angle profile view
    let side = new THREE.Vector3(-dir.z, 0, dir.x);
    // If side points toward -Z (behind the board where rocks/pillars can obstruct), flip toward +Z (player perspective)
    if (side.z < -0.1) {
      side.negate();
    }
    // Ensure side has a solid lateral component
    if (Math.abs(side.x) < 0.2 && Math.abs(side.z) < 0.2) {
      side.set(1, 0, 0.4).normalize();
    } else {
      side.normalize();
    }

    // Camera placed 4.2 units away from clash, 2.2 units high for optimal framing
    const camTargetPos = clashCenter.clone()
      .add(side.clone().multiplyScalar(4.2))
      .add(new THREE.Vector3(0, 2.2, 0));

    // Save initial camera and control target state
    const savedCamPos = this.camera.position.clone();
    const savedTarget = this.controls.target.clone();

    // Swoop camera down
    new TWEEN.Tween(this.camera.position, true)
      .to(camTargetPos, 500)
      .easing(TWEEN.Easing.Cubic.Out)
      .start();

    new TWEEN.Tween(this.controls.target, true)
      .to(lookTarget, 500)
      .easing(TWEEN.Easing.Cubic.Out)
      .onComplete(() => {
        // Impact hit strike!
        onHit();

        // Hold dramatic close-up during attack impact and victim death
        setTimeout(() => {
          // Swoop back up to player perspective
          new TWEEN.Tween(this.camera.position, true)
            .to(savedCamPos, 650)
            .easing(TWEEN.Easing.Cubic.InOut)
            .start();

          new TWEEN.Tween(this.controls.target, true)
            .to(savedTarget, 650)
            .easing(TWEEN.Easing.Cubic.InOut)
            .onComplete(() => {
              this.isCinematic = false;
              this.controls.enabled = true;
              this.controls.target.copy(savedTarget);
              this.controls.update();
              onFinished();
            })
            .start();
        }, 900);
      })
      .start();
  }

  public update() {
    if (!this.isCinematic) {
      this.controls.update();
    } else {
      // During cinematic kill cam, continuously keep camera focused on lookTarget
      this.camera.lookAt(this.controls.target);
    }
  }
}

import * as THREE from 'three';
import confetti from 'canvas-confetti';

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

export class VFXManager {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  private sparkMaterial: THREE.MeshBasicMaterial;
  private darkSparkMaterial: THREE.MeshBasicMaterial;
  private sparkGeometry: THREE.SphereGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sparkGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    this.sparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xffdd44,
      transparent: true,
      opacity: 1
    });
    this.darkSparkMaterial = new THREE.MeshBasicMaterial({
      color: 0xaa22ff,
      transparent: true,
      opacity: 1
    });
  }

  public createHitSparks(pos: THREE.Vector3, isDarkSide: boolean = false) {
    const count = 18;
    const mat = isDarkSide ? this.darkSparkMaterial : this.sparkMaterial;

    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(this.sparkGeometry, mat.clone());
      mesh.position.copy(pos);
      mesh.position.y += 0.8 + (Math.random() - 0.5) * 0.4;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 + 2,
        (Math.random() - 0.5) * 6
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3
      });
    }
  }

  public createDeathDissolve(pos: THREE.Vector3, isDarkSide: boolean = false) {
    const count = 35;
    const color = isDarkSide ? 0x9900ff : 0xffaa00;

    for (let i = 0; i < count; i++) {
      const geom = new THREE.SphereGeometry(0.12, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(pos);
      mesh.position.x += (Math.random() - 0.5) * 0.6;
      mesh.position.y += Math.random() * 1.5;
      mesh.position.z += (Math.random() - 0.5) * 0.6;

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1.5,
        (Math.random() - 0.5) * 2
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        velocity,
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4
      });
    }
  }

  public triggerVictoryConfetti() {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      p.mesh.position.addScaledVector(p.velocity, delta);
      p.velocity.y -= 9.8 * delta; // gravity

      const progress = p.life / p.maxLife;
      const mat = p.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 1 - progress);

      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        mat.dispose();
        this.particles.splice(i, 1);
      }
    }
  }
}

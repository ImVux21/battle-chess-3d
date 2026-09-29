import { Howl } from 'howler';

class SoundManager {
  private sounds: Map<string, Howl> = new Map();
  public isMuted: boolean = false;

  constructor() {
    this.loadSound('move', './assets/sounds/move_piece.ogg', 0.5);
    this.loadSound('clash', './assets/sounds/sword_clash.ogg', 0.8);
    this.loadSound('hit', './assets/sounds/heavy_hit.ogg', 0.8);
    this.loadSound('kill', './assets/sounds/kill_punch.ogg', 0.9);
    this.loadSound('crush', './assets/sounds/crush.ogg', 0.8);
  }

  private loadSound(name: string, src: string, volume: number = 0.7) {
    try {
      const sound = new Howl({
        src: [src],
        volume,
        preload: true
      });
      this.sounds.set(name, sound);
    } catch (e) {
      console.warn(`Could not load sound ${name}:`, e);
    }
  }

  public play(name: string) {
    if (this.isMuted) return;
    const sound = this.sounds.get(name);
    if (sound) {
      sound.play();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();

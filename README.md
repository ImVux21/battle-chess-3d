# ⚔️ Battle Chess 3D

> **Chiến Bàn Cờ 3D Huyền Thoại** — A modern 3D fantasy battle chess game built with Three.js, TypeScript, and Vite. Powered by custom AI-generated 3D models from Meshy, featuring animated skeletal units, dramatic environments, particle VFX, and full chess engine rule enforcement.

![Battle Chess 3D Banner](public/assets/images/pieces/white_king.png)

---

## 🌟 Features

- **🏰 Immersive 3D Arenas**:
  - Floating Chess Arena high above fantasy canyon cliffs
  - White Faction: Grand Citadel fortress and citadel terrain props
  - Black Faction: Colossal Bone Gate fortress and dark demonic terrain props
- **♟️ Unique Meshy 3D Fantasy Pieces**:
  - **White Kingdom**: Paladin King, Sorceress Queen, High Priest Bishops, Mounted Cavalry Knights (with real rigged gallop/run animations), Stone Guardian Rooks, and Castle Guard Pawns.
  - **Black Horde**: Orc Warlord King, Lich Sorceress Queen, Cult Priest Bishops, Nightmare Beast Knights (with rigged quadruped beast animations), Ogre Brute Rooks, and Skeleton Warrior Pawns.
- **⚡ Visuals & Audio Juice**:
  - Attack animations, piece leaping, particle explosions, ground impacts, and dust VFX
  - Ambient soundtrack and impact sound effects via Howler.js
  - Victory celebrations with confetti cannon
- **🕹️ Modern UI & Controls**:
  - **Faction Legend Modal & Dock**: High-resolution portraits with stone pedestals and character lore
  - **Multi-angle Cameras**: Toggle between White perspective, Black perspective, Isometric, and Free Orbit controls
  - **Legal Move Indicators & Chess Engine**: Fully validated by `chess.js`
- **🚀 WebGL Optimized**:
  - Models optimized via decimation and compressed PBR textures to load smoothly on all modern browsers without memory lag.

---

## 🎮 Play Online

Play directly in your browser:
👉 **[https://imvux21.github.io/battle-chess-3d/](https://imvux21.github.io/battle-chess-3d/)**

---

## 🛠️ Local Development

### Prerequisites
- Node.js 18+
- npm

### Installation
```bash
# Clone the repository
git clone https://github.com/ImVux21/battle-chess-3d.git

# Enter project directory
cd battle-chess-3d

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 📜 License
MIT License. Built with passion for 3D web games.

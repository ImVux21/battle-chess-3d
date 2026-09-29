import type { AIDifficulty } from '../chess/ChessAI';
import { soundManager } from '../sound/SoundManager';

export interface UIEventHandlers {
  onRestart: () => void;
  onResetCam: () => void;
  onModeChange: (mode: 'ai' | 'pvp', difficulty: AIDifficulty) => void;
  onToggleCinematic: (enabled: boolean) => void;
}

export class UIManager {
  private turnEl!: HTMLElement;
  private statusEl!: HTMLElement;
  private capturedWhiteEl!: HTMLElement;
  private capturedBlackEl!: HTMLElement;
  private modalEl!: HTMLElement;
  private modalTitleEl!: HTMLElement;
  private modalMsgEl!: HTMLElement;

  constructor(handlers: UIEventHandlers) {
    this.createUI(handlers);
  }

  private createUI(handlers: UIEventHandlers) {
    const root = document.getElementById('app') || document.body;
    root.innerHTML = `
      <div id="game-ui">
        <!-- Top Turn & Status Banner -->
        <header id="top-banner">
          <div id="realm-badge" class="holy-turn">
            <span id="realm-icon">👑</span>
            <span id="turn-text">HOLY REALM'S TURN</span>
          </div>
          <div id="status-alert"></div>
        </header>

        <!-- Mini Legend Dock (Always visible outside on HUD with pictures) -->
        <aside id="mini-legend-dock">
          <div class="dock-header">
            <span class="dock-title">⚔️ QUÂN CỜ</span>
            <button id="btn-toggle-dock" class="btn-dock-toggle" title="Thu gọn / Mở rộng">◀</button>
          </div>

          <div class="dock-body">
            <!-- White pieces column -->
            <div class="dock-column white-column">
              <div class="col-title">👑 TRẮNG</div>
              <div class="dock-card" data-piece="w_k" title="Vua (King) = Paladin King">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♔</span>
                  <img id="thumb-w_k" class="dock-img" src="./assets/images/pieces/w_k.png" alt="Paladin King" />
                </div>
                <span class="dock-name">Paladin King</span>
              </div>
              <div class="dock-card" data-piece="w_q" title="Hậu (Queen) = Sorceress Queen">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♕</span>
                  <img id="thumb-w_q" class="dock-img" src="./assets/images/pieces/w_q.png" alt="Sorceress Queen" />
                </div>
                <span class="dock-name">Sorceress</span>
              </div>
              <div class="dock-card" data-piece="w_b" title="Tượng (Bishop) = High Priest">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♗</span>
                  <img id="thumb-w_b" class="dock-img" src="./assets/images/pieces/w_b.png" alt="High Priest" />
                </div>
                <span class="dock-name">High Priest</span>
              </div>
              <div class="dock-card" data-piece="w_n" title="Mã (Knight) = Mounted Cavalry">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♘</span>
                  <img id="thumb-w_n" class="dock-img" src="./assets/images/pieces/w_n.png" alt="Mounted Cavalry" />
                </div>
                <span class="dock-name">Cavalry</span>
              </div>
              <div class="dock-card" data-piece="w_r" title="Xe (Rook) = Stone Guardian">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♖</span>
                  <img id="thumb-w_r" class="dock-img" src="./assets/images/pieces/w_r.png" alt="Stone Guardian" />
                </div>
                <span class="dock-name">Guardian</span>
              </div>
              <div class="dock-card" data-piece="w_p" title="Tốt (Pawn) = Castle Guard">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♙</span>
                  <img id="thumb-w_p" class="dock-img" src="./assets/images/pieces/w_p.png" alt="Castle Guard" />
                </div>
                <span class="dock-name">Castle Guard</span>
              </div>
            </div>

            <!-- Black pieces column -->
            <div class="dock-column black-column">
              <div class="col-title">👹 ĐEN</div>
              <div class="dock-card" data-piece="b_k" title="Vua (King) = Orc Warlord">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♚</span>
                  <img id="thumb-b_k" class="dock-img" src="./assets/images/pieces/b_k.png" alt="Orc Warlord" />
                </div>
                <span class="dock-name">Orc Warlord</span>
              </div>
              <div class="dock-card" data-piece="b_q" title="Hậu (Queen) = Lich Sorceress">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♛</span>
                  <img id="thumb-b_q" class="dock-img" src="./assets/images/pieces/b_q.png" alt="Lich Sorceress" />
                </div>
                <span class="dock-name">Lich Queen</span>
              </div>
              <div class="dock-card" data-piece="b_b" title="Tượng (Bishop) = Cult Priest">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♝</span>
                  <img id="thumb-b_b" class="dock-img" src="./assets/images/pieces/b_b.png" alt="Cult Priest" />
                </div>
                <span class="dock-name">Cult Priest</span>
              </div>
              <div class="dock-card" data-piece="b_n" title="Mã (Knight) = Nightmare Beast">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♞</span>
                  <img id="thumb-b_n" class="dock-img" src="./assets/images/pieces/b_n.png" alt="Nightmare Beast" />
                </div>
                <span class="dock-name">Nightmare</span>
              </div>
              <div class="dock-card" data-piece="b_r" title="Xe (Rook) = Ogre Brute">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♜</span>
                  <img id="thumb-b_r" class="dock-img" src="./assets/images/pieces/b_r.png" alt="Ogre Brute" />
                </div>
                <span class="dock-name">Ogre Brute</span>
              </div>
              <div class="dock-card" data-piece="b_p" title="Tốt (Pawn) = Skeleton Warrior">
                <div class="dock-thumb-box">
                  <span class="badge-sym-icon">♟</span>
                  <img id="thumb-b_p" class="dock-img" src="./assets/images/pieces/b_p.png" alt="Skeleton Warrior" />
                </div>
                <span class="dock-name">Skeleton</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Right Side Quick Settings Panel -->
        <div id="settings-panel">
          <div class="panel-group">
            <label>Mode</label>
            <select id="mode-select">
              <option value="ai-medium">vs AI (Medium)</option>
              <option value="ai-easy">vs AI (Easy)</option>
              <option value="ai-hard">vs AI (Hard)</option>
              <option value="pvp">2 Players (Local)</option>
            </select>
          </div>

          <div class="panel-buttons">
            <button id="btn-legend" class="highlight-btn" title="View Chess Pieces Legend">📜 Bảng Quân Cờ (Legend)</button>
            <button id="btn-cam" title="Reset Camera">🎥 Cam</button>
            <button id="btn-cine" class="active" title="Toggle Kill-Cam">🎬 Action Cam: ON</button>
            <button id="btn-sound" title="Toggle Sound">🔊 Sound</button>
            <button id="btn-restart" title="Restart Game">🔄 New Game</button>
          </div>
        </div>

        <!-- Captured Trophies -->
        <div id="captured-bar">
          <div class="captured-group" id="captured-black">
            <span class="cap-title">Slain Monsters:</span>
            <div class="cap-icons" id="cap-black-icons"></div>
          </div>
          <div id="piece-info-badge" class="hidden"></div>
          <div class="captured-group" id="captured-white">
            <span class="cap-title">Fallen Heroes:</span>
            <div class="cap-icons" id="cap-white-icons"></div>
          </div>
        </div>

        <!-- Loading Overlay -->
        <div id="loading-overlay">
          <div class="spinner"></div>
          <h2>SUMMONING BATTLEFIELD...</h2>
          <p id="loading-status-text">Đang nạp dữ liệu 3D & Môi trường...</p>
          <div id="loading-bar-wrapper" style="width: 320px; height: 10px; background: rgba(255,255,255,0.15); border-radius: 6px; margin: 15px auto; overflow: hidden; border: 1px solid rgba(255,215,0,0.4); box-shadow: 0 0 10px rgba(0,0,0,0.5);">
            <div id="loading-bar-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #ff8800, #ffd700); transition: width 0.25s ease;"></div>
          </div>
        </div>

        <!-- Legend Modal -->
        <div id="legend-modal" class="hidden">
          <div class="legend-card">
            <div class="legend-header">
              <h2>⚔️ BẢNG CHÚ GIẢI QUÂN CỜ ⚔️</h2>
              <button id="btn-close-legend" class="btn-icon" title="Đóng">✕</button>
            </div>
            <p class="legend-sub">Đối chiếu giữa cờ vua truyền thống và các nhân vật 3D trên bệ đá trong trận đại chiến</p>
            <div class="legend-grid">
              <!-- Holy Realm (White) -->
              <div class="legend-faction white-faction">
                <div class="faction-header">
                  <span class="faction-icon">👑</span>
                  <h3>PHE THÁNH QUỐC (TRẮNG)</h3>
                </div>
                <div class="legend-list">
                  <div class="legend-item">
                    <img src="./assets/images/pieces/w_k.png" class="legend-thumb-img" alt="Paladin King" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ffd700; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Vua (King) <span class="char-tag white-tag">Paladin King ♔</span></div>
                      <div class="piece-desc">Thánh hiệp sĩ đại kiếm hoàng gia, chỉ huy tối cao của Thánh Quốc.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/w_q.png" class="legend-thumb-img" alt="Sorceress Queen" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ffd700; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Hậu (Queen) <span class="char-tag white-tag">Sorceress Queen ♕</span></div>
                      <div class="piece-desc">Nữ hoàng ma thuật tối thượng, uy lực càn quét khắp bàn đấu.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/w_b.png" class="legend-thumb-img" alt="High Priest" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ffd700; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Tượng (Bishop) <span class="char-tag white-tag">High Priest ♗</span></div>
                      <div class="piece-desc">Đại pháp sư quyền trượng pha lê, tấn công xuyên đường chéo.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/w_n.png" class="legend-thumb-img" alt="Mounted Cavalry" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ffd700; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Mã (Knight) <span class="char-tag white-tag">Mounted Cavalry ♘</span></div>
                      <div class="piece-desc">Kỵ binh thiết giáp phi nước đại, vượt qua chướng ngại vật chữ L.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/w_r.png" class="legend-thumb-img" alt="Stone Guardian" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ffd700; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Xe (Rook) <span class="char-tag white-tag">Stone Guardian ♖</span></div>
                      <div class="piece-desc">Hộ vệ đá khổng lồ cầm búa đá, càn quét nghiền nát đường thẳng.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/w_p.png" class="legend-thumb-img" alt="Castle Guard" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ffd700; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Tốt (Pawn) <span class="char-tag white-tag">Castle Guard ♙</span></div>
                      <div class="piece-desc">Thị vệ hoàng thành giáo dài nhọn, đội quân tiên phong bất khuất.</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dark Abyss (Black) -->
              <div class="legend-faction black-faction">
                <div class="faction-header">
                  <span class="faction-icon">👹</span>
                  <h3>PHE VỰC THẲM (ĐEN)</h3>
                </div>
                <div class="legend-list">
                  <div class="legend-item">
                    <img src="./assets/images/pieces/b_k.png" class="legend-thumb-img" alt="Orc Warlord" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ff3366; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Vua (King) <span class="char-tag dark-tag">Orc Warlord ♚</span></div>
                      <div class="piece-desc">Chúa tể Orc chùy gai tàn khốc, thống trị đội quân quỷ dữ.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/b_q.png" class="legend-thumb-img" alt="Lich Sorceress" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ff3366; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Hậu (Queen) <span class="char-tag dark-tag">Lich Sorceress ♛</span></div>
                      <div class="piece-desc">Nữ vu yêu phù thủy hắc ám, phép thuật đoạt hồn huỷ diệt.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/b_b.png" class="legend-thumb-img" alt="Cult Priest" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ff3366; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Tượng (Bishop) <span class="char-tag dark-tag">Cult Priest ♝</span></div>
                      <div class="piece-desc">Tế tư tà giáo trượng đầu lâu, niệm chú nguyền rủa đường chéo.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/b_n.png" class="legend-thumb-img" alt="Nightmare Beast" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ff3366; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Mã (Knight) <span class="char-tag dark-tag">Nightmare Beast ♞</span></div>
                      <div class="piece-desc">Ma thú ác mộng 4 chân hung dữ, vồ mồi chớp nhoáng theo chữ L.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/b_r.png" class="legend-thumb-img" alt="Ogre Brute" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ff3366; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Xe (Rook) <span class="char-tag dark-tag">Ogre Brute ♜</span></div>
                      <div class="piece-desc">Quỷ khổng lồ chùy đá nặng ngàn cân, càn quét nghiền nát chướng ngại.</div>
                    </div>
                  </div>
                  <div class="legend-item">
                    <img src="./assets/images/pieces/b_p.png" class="legend-thumb-img" alt="Skeleton Warrior" style="width: 48px; height: 48px; border-radius: 6px; border: 1px solid #ff3366; object-fit: cover;" />
                    <div class="item-meta">
                      <div class="piece-title">Tốt (Pawn) <span class="char-tag dark-tag">Skeleton Warrior ♟</span></div>
                      <div class="piece-desc">Chiến binh bộ xương kiếm rỉ, đội quân cảm tử vô tận từ lòng đất.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="legend-footer">
              <button id="btn-legend-ok">ĐÃ HIỂU / ĐÓNG</button>
            </div>
          </div>
        </div>

        <!-- Game Over Modal -->
        <div id="game-modal" class="hidden">
          <div class="modal-card">
            <h1 id="modal-title">VICTORY!</h1>
            <p id="modal-msg">The Holy Realm has vanquished the Dark Abyss!</p>
            <button id="btn-modal-restart">PLAY AGAIN</button>
          </div>
        </div>
      </div>
    `;

    this.turnEl = document.getElementById('turn-text')!;
    this.statusEl = document.getElementById('status-alert')!;
    this.capturedWhiteEl = document.getElementById('cap-white-icons')!;
    this.capturedBlackEl = document.getElementById('cap-black-icons')!;
    this.modalEl = document.getElementById('game-modal')!;
    this.modalTitleEl = document.getElementById('modal-title')!;
    this.modalMsgEl = document.getElementById('modal-msg')!;

    // Event listeners
    document.getElementById('btn-restart')!.addEventListener('click', handlers.onRestart);
    document.getElementById('btn-modal-restart')!.addEventListener('click', () => {
      this.hideModal();
      handlers.onRestart();
    });

    document.getElementById('btn-legend')!.addEventListener('click', () => {
      this.showLegend();
    });
    document.getElementById('btn-close-legend')!.addEventListener('click', () => {
      this.hideLegend();
    });
    document.getElementById('btn-legend-ok')!.addEventListener('click', () => {
      this.hideLegend();
    });
    document.getElementById('legend-modal')!.addEventListener('click', (e) => {
      if (e.target === document.getElementById('legend-modal')) {
        this.hideLegend();
      }
    });

    const dockEl = document.getElementById('mini-legend-dock');
    const btnToggleDock = document.getElementById('btn-toggle-dock');
    if (btnToggleDock && dockEl) {
      btnToggleDock.addEventListener('click', () => {
        dockEl.classList.toggle('collapsed');
        btnToggleDock.textContent = dockEl.classList.contains('collapsed') ? '▶' : '◀';
        btnToggleDock.title = dockEl.classList.contains('collapsed') ? 'Mở rộng bảng quân cờ' : 'Thu gọn bảng quân cờ';
      });
    }

    document.getElementById('btn-cam')!.addEventListener('click', handlers.onResetCam);

    const btnCine = document.getElementById('btn-cine')!;
    let cineOn = true;
    btnCine.addEventListener('click', () => {
      cineOn = !cineOn;
      btnCine.textContent = cineOn ? '🎬 Action Cam: ON' : '🎬 Action Cam: OFF';
      btnCine.classList.toggle('active', cineOn);
      handlers.onToggleCinematic(cineOn);
    });

    const btnSound = document.getElementById('btn-sound')!;
    btnSound.addEventListener('click', () => {
      const isMuted = soundManager.toggleMute();
      btnSound.textContent = isMuted ? '🔇 Muted' : '🔊 Sound';
    });

    const modeSelect = document.getElementById('mode-select') as HTMLSelectElement;
    modeSelect.addEventListener('change', () => {
      const val = modeSelect.value;
      if (val === 'pvp') {
        handlers.onModeChange('pvp', 'medium');
      } else {
        const diff = val.split('-')[1] as AIDifficulty;
        handlers.onModeChange('ai', diff);
      }
    });
  }

  public hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.classList.add('fade-out');
  }

  public updateTurn(color: 'w' | 'b', isCheck: boolean) {
    const badge = document.getElementById('realm-badge')!;
    const icon = document.getElementById('realm-icon')!;

    if (color === 'w') {
      badge.className = 'holy-turn';
      icon.textContent = '👑';
      this.turnEl.textContent = "HOLY REALM'S TURN";
    } else {
      badge.className = 'dark-turn';
      icon.textContent = '👹';
      this.turnEl.textContent = "DARK ABYSS' TURN";
    }

    if (isCheck) {
      this.statusEl.textContent = '⚠️ CHECK! KING IN PERIL!';
      this.statusEl.className = 'visible check-alert';
    } else {
      this.statusEl.textContent = '';
      this.statusEl.className = '';
    }
  }

  public updateCaptured(capturedWhite: string[], capturedBlack: string[]) {
    const symbols: Record<string, string> = {
      p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚'
    };

    this.capturedWhiteEl.innerHTML = capturedWhite
      .map(p => `<span>${symbols[p] || p}</span>`)
      .join(' ');

    this.capturedBlackEl.innerHTML = capturedBlack
      .map(p => `<span>${symbols[p] || p}</span>`)
      .join(' ');
  }

  public showGameOver(winner: 'w' | 'b' | 'draw') {
    this.modalEl.classList.remove('hidden');

    if (winner === 'w') {
      this.modalTitleEl.textContent = 'VICTORY OF THE HOLY REALM!';
      this.modalMsgEl.textContent = 'The Knights and Wizards have banished the monsters forever!';
      this.modalTitleEl.style.color = '#ffd700';
    } else if (winner === 'b') {
      this.modalTitleEl.textContent = 'THE DARK ABYSS PREVAILS!';
      this.modalMsgEl.textContent = 'The Monsters and Demons have conquered the battlefield!';
      this.modalTitleEl.style.color = '#ff3366';
    } else {
      this.modalTitleEl.textContent = 'STALEMATE!';
      this.modalMsgEl.textContent = 'Neither realm could strike a decisive blow.';
      this.modalTitleEl.style.color = '#cccccc';
    }
  }

  public hideModal() {
    this.modalEl.classList.add('hidden');
  }

  public showLegend() {
    const el = document.getElementById('legend-modal');
    if (el) el.classList.remove('hidden');
  }

  public hideLegend() {
    const el = document.getElementById('legend-modal');
    if (el) el.classList.add('hidden');
  }

  public updateLoadingProgress(loaded: number, total: number, itemName: string) {
    const bar = document.getElementById('loading-bar-fill');
    const text = document.getElementById('loading-status-text');
    if (bar) {
      const pct = Math.round((loaded / total) * 100);
      bar.style.width = `${pct}%`;
    }
    if (text) {
      text.textContent = `Nạp mô hình 3D (${loaded}/${total}): ${itemName}...`;
    }
  }

  public showPieceInfo(color: 'w' | 'b', type: string, square: string) {
    const pieceInfoBadge = document.getElementById('piece-info-badge');
    if (!pieceInfoBadge) return;
    const isWhite = color === 'w';
    const dict: Record<string, { name: string; char: string; sym: string }> = isWhite ? {
      k: { name: 'Vua (King)', char: 'Paladin King', sym: '♔' },
      q: { name: 'Hậu (Queen)', char: 'Sorceress Queen', sym: '♕' },
      b: { name: 'Tượng (Bishop)', char: 'High Priest', sym: '♗' },
      n: { name: 'Mã (Knight)', char: 'Mounted Cavalry', sym: '♘' },
      r: { name: 'Xe (Rook)', char: 'Stone Guardian', sym: '♖' },
      p: { name: 'Tốt (Pawn)', char: 'Castle Guard', sym: '♙' },
    } : {
      k: { name: 'Vua (King)', char: 'Orc Warlord', sym: '♚' },
      q: { name: 'Hậu (Queen)', char: 'Lich Sorceress', sym: '♛' },
      b: { name: 'Tượng (Bishop)', char: 'Cult Priest', sym: '♝' },
      n: { name: 'Mã (Knight)', char: 'Nightmare Beast', sym: '♞' },
      r: { name: 'Xe (Rook)', char: 'Ogre Brute', sym: '♜' },
      p: { name: 'Tốt (Pawn)', char: 'Skeleton Warrior', sym: '♟' },
    };
    const info = dict[type.toLowerCase()] || { name: type, char: type, sym: '♟' };
    pieceInfoBadge.innerHTML = `<span class="badge-sym">${info.sym}</span> <strong>${info.name}:</strong> <span class="badge-char">${info.char}</span> <span class="badge-sq">[${square.toUpperCase()}]</span>`;
    pieceInfoBadge.className = `visible ${isWhite ? 'white-badge' : 'black-badge'}`;
  }

  public hidePieceInfo() {
    const pieceInfoBadge = document.getElementById('piece-info-badge');
    if (pieceInfoBadge) {
      pieceInfoBadge.className = 'hidden';
    }
  }

  public populateThumbnails(thumbMap: Map<string, string>) {
    thumbMap.forEach((dataUrl, key) => {
      const img = document.getElementById(`thumb-${key}`) as HTMLImageElement;
      if (img) {
        img.src = dataUrl;
        img.style.display = 'block';
      }
    });
  }
}

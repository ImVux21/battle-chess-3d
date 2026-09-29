import * as THREE from 'three';
import * as TWEEN from '@tweenjs/tween.js';
import './style.css';
import { ChessGame } from './chess/ChessGame';
import { ChessAI, type AIDifficulty } from './chess/ChessAI';
import { Board } from './graphics/Board';
import { PieceManager } from './graphics/PieceManager';
import { ActionCam } from './graphics/ActionCam';
import { VFXManager } from './vfx/VFXManager';
import { UIManager } from './ui/UIManager';
import { soundManager } from './sound/SoundManager';

class GameApp {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;

  private chessGame: ChessGame;
  private board: Board;
  private vfx: VFXManager;
  private pieceManager: PieceManager;
  private actionCam: ActionCam;
  private ui: UIManager;

  private gameMode: 'ai' | 'pvp' = 'ai';
  private aiDifficulty: AIDifficulty = 'medium';
  private isProcessingMove: boolean = false;
  private selectedSquare: string | null = null;
  private currentLegalMoves: string[] = [];
  private capturedWhite: string[] = [];
  private capturedBlack: string[] = [];

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor() {
    this.clock = new THREE.Clock();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0e111a);
    this.scene.fog = new THREE.Fog(0x0e111a, 28, 80);

    // Camera setup
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    const container = document.getElementById('canvas-container')!;
    container.appendChild(this.renderer.domElement);

    // Managers
    this.chessGame = new ChessGame();
    this.board = new Board(this.scene);
    this.vfx = new VFXManager(this.scene);
    this.pieceManager = new PieceManager(this.scene, this.vfx);
    this.actionCam = new ActionCam(this.camera, this.renderer.domElement);

    // UI
    this.ui = new UIManager({
      onRestart: () => this.restartGame(),
      onResetCam: () => this.actionCam.resetToDefault(),
      onModeChange: (mode, diff) => {
        this.gameMode = mode;
        this.aiDifficulty = diff;
        if (this.gameMode === 'ai' && !this.chessGame.isWhiteTurn()) {
          this.triggerAIMove();
        }
      },
      onToggleCinematic: (enabled) => {
        this.actionCam.skipKillCam = !enabled;
      }
    });

    this.setupEvents();
    this.initGame();
  }

  private async initGame() {
    try {
      await this.pieceManager.preloadAll((loaded, total, name) => {
        this.ui.updateLoadingProgress(loaded, total, name);
      });
      const thumbnails = this.pieceManager.generateThumbnails();
      this.ui.populateThumbnails(thumbnails);
      this.ui.hideLoading();
      this.spawnInitialBoard();
      this.animate();
    } catch (err) {
      console.error('Initialization failed:', err);
    }
  }

  private spawnInitialBoard() {
    this.pieceManager.clearAll();
    const boardState = this.chessGame.getBoard();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = boardState[r][c];
        if (piece) {
          this.pieceManager.spawnPiece(piece.square, piece.color, piece.type);
        }
      }
    }

    this.updateCheckHighlights();
  }

  private restartGame() {
    TWEEN.removeAll();
    this.chessGame.reset();
    this.selectedSquare = null;
    this.currentLegalMoves = [];
    this.isProcessingMove = false;
    this.capturedWhite = [];
    this.capturedBlack = [];
    this.board.clearHighlights();
    this.ui.hidePieceInfo();
    this.ui.updateTurn('w', false);
    this.ui.updateCaptured([], []);
    this.spawnInitialBoard();
  }

  private setupEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    this.renderer.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
  }

  private onPointerDown(e: MouseEvent) {
    if (this.isProcessingMove || this.actionCam.isCinematic) return;

    // In AI mode, ignore clicks when it's Black's turn
    if (this.gameMode === 'ai' && !this.chessGame.isWhiteTurn()) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // 1. Check piece meshes click
    const pieceIntersects: { square: string; distance: number }[] = [];
    this.pieceManager.pieces.forEach((p) => {
      const hits = this.raycaster.intersectObject(p.model, true);
      if (hits.length > 0) {
        pieceIntersects.push({ square: p.square, distance: hits[0].distance });
      }
    });

    // 2. Check indicator & tile meshes click
    const clickableBoardMeshes = [
      ...this.board.moveIndicators,
      ...Array.from(this.board.tileMeshes.values())
    ];
    const boardHits = this.raycaster.intersectObjects(clickableBoardMeshes, false);

    let clickedSquare: string | null = null;

    if (pieceIntersects.length > 0) {
      pieceIntersects.sort((a, b) => a.distance - b.distance);
      clickedSquare = pieceIntersects[0].square;
    } else if (boardHits.length > 0) {
      clickedSquare = boardHits[0].object.userData.square;
    }

    if (clickedSquare) {
      this.handleSquareClick(clickedSquare);
    }
  }

  private handleSquareClick(square: string) {
    const pieceAtSquare = this.chessGame.getPiece(square);
    const isCurrentPlayerPiece = pieceAtSquare && pieceAtSquare.color === this.chessGame.getTurn();

    // If clicking on our own piece, select it
    if (isCurrentPlayerPiece) {
      this.selectedSquare = square;
      this.currentLegalMoves = this.chessGame.getLegalMoves(square);
      this.board.showSelectedSquare(square);

      const captures = this.currentLegalMoves.filter(sq => {
        if (this.chessGame.getPiece(sq)) return true;
        // Mark en-passant capture square as well
        if (pieceAtSquare.type === 'p' && sq[0] !== square[0]) return true;
        return false;
      });
      this.board.showLegalMoves(this.currentLegalMoves, captures);
      this.ui.showPieceInfo(pieceAtSquare.color, pieceAtSquare.type, square);
      return;
    }

    // Check if player clicked directly on the enemy pawn to capture via en-passant
    let targetSquare = square;
    if (this.selectedSquare && !this.currentLegalMoves.includes(square)) {
      const selectedPiece = this.chessGame.getPiece(this.selectedSquare);
      if (selectedPiece && selectedPiece.type === 'p') {
        const epDest = `${square[0]}${selectedPiece.color === 'w' ? '6' : '3'}`;
        if (
          this.currentLegalMoves.includes(epDest) &&
          Math.abs(square.charCodeAt(0) - this.selectedSquare.charCodeAt(0)) === 1 &&
          square[1] === this.selectedSquare[1]
        ) {
          targetSquare = epDest;
        }
      }
    }

    // If already selected a piece and clicking a legal move destination
    if (this.selectedSquare && this.currentLegalMoves.includes(targetSquare)) {
      this.ui.hidePieceInfo();
      this.executePlayerMove(this.selectedSquare, targetSquare);
      this.selectedSquare = null;
      this.currentLegalMoves = [];
      this.board.clearHighlights();
      return;
    }

    // Otherwise deselect
    this.selectedSquare = null;
    this.currentLegalMoves = [];
    this.board.clearHighlights();
    this.ui.hidePieceInfo();
  }

  private executePlayerMove(from: string, to: string) {
    const victim = this.chessGame.getPiece(to);
    const moveResult = this.chessGame.makeMove(from, to);

    if (!moveResult) return;

    this.isProcessingMove = true;

    // Check en passant capture
    const isEnPassant = moveResult.flags.includes('e');
    const victimSquare = isEnPassant ? `${to[0]}${from[1]}` : to;
    const isCapture = !!moveResult.captured || !!victim || isEnPassant;

    const afterMoveAnimation = () => {
      // Handle Castling: move corresponding rook
      if (moveResult.flags.includes('k')) {
        // Kingside castling
        if (moveResult.color === 'w') {
          this.pieceManager.movePieceSmoothly('h1', 'f1', () => {});
        } else {
          this.pieceManager.movePieceSmoothly('h8', 'f8', () => {});
        }
      } else if (moveResult.flags.includes('q')) {
        // Queenside castling
        if (moveResult.color === 'w') {
          this.pieceManager.movePieceSmoothly('a1', 'd1', () => {});
        } else {
          this.pieceManager.movePieceSmoothly('a8', 'd8', () => {});
        }
      }

      // Handle Promotion
      if (moveResult.promotion) {
        this.pieceManager.removePiece(to);
        this.pieceManager.spawnPiece(to, moveResult.color, moveResult.promotion);
      }

      this.postMoveCheck();
    };

    if (isCapture) {
      // Capture Move! Execute Cinematic Action Cam & Clash!
      const capturedType = moveResult.captured || (victim ? victim.type : 'p');
      if (moveResult.color === 'w') {
        this.capturedBlack.push(capturedType);
      } else {
        this.capturedWhite.push(capturedType);
      }
      this.ui.updateCaptured(this.capturedWhite, this.capturedBlack);

      const attackerPos = Board.squareToCoords(from);
      const victimPos = Board.squareToCoords(victimSquare);

      let clashDone = false;
      let camDone = false;
      const maybeFinish = () => {
        if (clashDone && camDone) {
          afterMoveAnimation();
        }
      };

      this.actionCam.triggerKillCam(
        new THREE.Vector3(attackerPos.x, 0, attackerPos.z),
        new THREE.Vector3(victimPos.x, 0, victimPos.z),
        () => {},
        () => {
          camDone = true;
          maybeFinish();
        }
      );

      this.pieceManager.executeBattleClash(
        from,
        victimSquare,
        to,
        () => {},
        () => {
          clashDone = true;
          maybeFinish();
        }
      );
    } else {
      // Non-capture Move
      this.pieceManager.movePieceSmoothly(from, to, () => {
        afterMoveAnimation();
      });
    }
  }

  private postMoveCheck() {
    this.isProcessingMove = false;
    const turn = this.chessGame.getTurn();
    const isCheck = this.chessGame.isCheck();

    this.ui.updateTurn(turn, isCheck);
    this.updateCheckHighlights();

    if (this.chessGame.isGameOver()) {
      if (this.chessGame.isCheckmate()) {
        const winner = turn === 'w' ? 'b' : 'w';
        this.ui.showGameOver(winner);
        this.vfx.triggerVictoryConfetti();
        soundManager.play('crush');
      } else {
        this.ui.showGameOver('draw');
      }
      return;
    }

    // Trigger AI move if applicable
    if (this.gameMode === 'ai' && !this.chessGame.isWhiteTurn()) {
      setTimeout(() => this.triggerAIMove(), 500);
    }
  }

  private triggerAIMove() {
    if (this.chessGame.isGameOver()) return;

    const bestMove = ChessAI.getBestMove(this.chessGame.getFen(), this.aiDifficulty);
    if (!bestMove) return;

    this.executePlayerMove(bestMove.from, bestMove.to);
  }

  private updateCheckHighlights() {
    if (this.chessGame.isCheck()) {
      const kingSq = this.chessGame.getKingSquare(this.chessGame.getTurn());
      this.board.showCheck(kingSq);
    } else {
      this.board.showCheck(null);
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    TWEEN.update();

    this.pieceManager.update(delta);
    this.vfx.update(delta);
    this.actionCam.update();

    this.renderer.render(this.scene, this.camera);
  };
}

// Start Game
new GameApp();

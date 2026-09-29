import { Chess } from 'chess.js';

const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece square tables (from Black's perspective, higher is better for Black)
const PAWN_TABLE = [
  [0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5,  5, 10, 25, 25, 10,  5,  5],
  [0,  0,  0, 20, 20,  0,  0,  0],
  [5, -5,-10,  0,  0,-10, -5,  5],
  [5, 10, 10,-20,-20, 10, 10,  5],
  [0,  0,  0,  0,  0,  0,  0,  0]
];

const KNIGHT_TABLE = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export class ChessAI {
  public static getBestMove(fen: string, difficulty: AIDifficulty = 'medium'): { from: string; to: string } | null {
    const game = new Chess(fen);
    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length === 0) return null;

    if (difficulty === 'easy') {
      // Pick random or simple capture
      const captures = legalMoves.filter(m => m.captured);
      if (captures.length > 0 && Math.random() < 0.6) {
        const choice = captures[Math.floor(Math.random() * captures.length)];
        return { from: choice.from, to: choice.to };
      }
      const choice = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return { from: choice.from, to: choice.to };
    }

    const depth = difficulty === 'hard' ? 3 : 2;
    let bestMove = legalMoves[0];
    let bestValue = -999999;

    // Shuffle moves slightly to avoid deterministic repeating games
    const shuffled = [...legalMoves].sort(() => Math.random() - 0.5);

    for (const move of shuffled) {
      game.move(move);
      const value = -this.minimax(game, depth - 1, -999999, 999999, false);
      game.undo();

      if (value > bestValue) {
        bestValue = value;
        bestMove = move;
      }
    }

    return { from: bestMove.from, to: bestMove.to };
  }

  private static minimax(game: Chess, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0 || game.isGameOver()) {
      return this.evaluateBoard(game);
    }

    const moves = game.moves({ verbose: true });
    if (isMaximizing) {
      let maxEval = -999999;
      for (const move of moves) {
        game.move(move);
        const evalVal = this.minimax(game, depth - 1, alpha, beta, false);
        game.undo();
        maxEval = Math.max(maxEval, evalVal);
        alpha = Math.max(alpha, evalVal);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = 999999;
      for (const move of moves) {
        game.move(move);
        const evalVal = this.minimax(game, depth - 1, alpha, beta, true);
        game.undo();
        minEval = Math.min(minEval, evalVal);
        beta = Math.min(beta, evalVal);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  private static evaluateBoard(game: Chess): number {
    let totalScore = 0;
    const board = game.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        let pieceScore = PIECE_VALUES[piece.type] || 0;

        if (piece.type === 'p') {
          pieceScore += piece.color === 'b' ? PAWN_TABLE[r][c] : PAWN_TABLE[7 - r][c];
        } else if (piece.type === 'n') {
          pieceScore += KNIGHT_TABLE[r][c];
        }

        if (piece.color === 'b') {
          totalScore += pieceScore;
        } else {
          totalScore -= pieceScore;
        }
      }
    }

    return totalScore;
  }
}

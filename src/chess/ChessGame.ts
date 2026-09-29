import { Chess, type Square, type PieceSymbol, type Color } from 'chess.js';

export interface MoveResult {
  from: string;
  to: string;
  piece: PieceSymbol;
  color: Color;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  flags: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  san: string;
}

export class ChessGame {
  private chess: Chess;

  constructor() {
    this.chess = new Chess();
  }

  public reset() {
    this.chess.reset();
  }

  public getTurn(): Color {
    return this.chess.turn();
  }

  public isWhiteTurn(): boolean {
    return this.chess.turn() === 'w';
  }

  public isGameOver(): boolean {
    return this.chess.isGameOver();
  }

  public isCheck(): boolean {
    return this.chess.inCheck();
  }

  public isCheckmate(): boolean {
    return this.chess.isCheckmate();
  }

  public isDraw(): boolean {
    return this.chess.isDraw();
  }

  public getLegalMoves(square: string): string[] {
    const moves = this.chess.moves({ square: square as Square, verbose: true });
    return moves.map(m => m.to);
  }

  public getPiece(square: string) {
    return this.chess.get(square as Square);
  }

  public makeMove(from: string, to: string, promotion: string = 'q'): MoveResult | null {
    try {
      const move = this.chess.move({
        from: from as Square,
        to: to as Square,
        promotion: promotion as PieceSymbol
      });

      if (!move) return null;

      return {
        from: move.from,
        to: move.to,
        piece: move.piece,
        color: move.color,
        captured: move.captured,
        promotion: move.promotion,
        flags: move.flags,
        isCheck: this.chess.inCheck(),
        isCheckmate: this.chess.isCheckmate(),
        isDraw: this.chess.isDraw(),
        san: move.san
      };
    } catch {
      return null;
    }
  }

  public getBoard() {
    return this.chess.board();
  }

  public getFen(): string {
    return this.chess.fen();
  }

  public getKingSquare(color: Color): string | null {
    const board = this.chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return piece.square;
        }
      }
    }
    return null;
  }
}

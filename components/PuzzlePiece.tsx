import React from 'react';
import { Piece } from '../types';

interface PuzzlePieceProps {
  piece: Piece;
  imgUrl: string;
  rows: number;
  cols: number;
  containerSize: number;
  onPointerDown: (e: React.PointerEvent, pieceId: number) => void;
  isDragging: boolean;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  imgUrl,
  rows,
  cols,
  containerSize,
  onPointerDown,
  isDragging,
}) => {
  const widthPercent = 100 / cols;
  const heightPercent = 100 / rows;
  
  // Calculate background position to show the correct part of the image
  // We use percentages for responsiveness
  // Division by zero protection if rows/cols = 1 (though not expected in puzzle logic)
  const bgX = cols > 1 ? (piece.correctX / (100 - widthPercent)) * 100 : 0;
  const bgY = rows > 1 ? (piece.correctY / (100 - heightPercent)) * 100 : 0;

  return (
    <div
      onPointerDown={(e) => onPointerDown(e, piece.id)}
      className={`puzzle-piece absolute border-2 border-white/80 box-border rounded-md overflow-hidden ${
        piece.isPlaced ? 'placed' : ''
      } ${isDragging ? 'dragging' : ''}`}
      style={{
        width: `${widthPercent}%`,
        height: `${heightPercent}%`,
        left: `${piece.currentX}%`,
        top: `${piece.currentY}%`,
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: `${cols * 100}% ${rows * 100}%`,
        backgroundPositionX: `${bgX}%`,
        backgroundPositionY: `${bgY}%`,
        cursor: piece.isPlaced ? 'default' : 'grab',
      }}
    >
      {/* Gloss effect */}
      {!piece.isPlaced && (
         <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      )}
      
      {/* Checkmark when placed */}
      {piece.isPlaced && (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 animate-pop">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
};
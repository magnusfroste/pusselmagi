export type Theme = 'animals' | 'space' | 'fantasy' | 'nature';

export interface GameState {
  currentTheme: Theme | null;
  difficulty: { rows: number; cols: number };
  score: number;
  unlockedLevels: number;
  totalStars: number;
}

export interface Piece {
  id: number;
  correctX: number; // Percentage 0-100
  correctY: number; // Percentage 0-100
  currentX: number; // Percentage 0-100
  currentY: number; // Percentage 0-100
  isPlaced: boolean;
}

export interface PuzzleConfig {
  imgUrl: string;
  rows: number;
  cols: number;
}

export interface PlayerStats {
  totalScore: number;
  stars: number;
  completedPuzzles: number;
  highestUnlockedLevelIndex: number; // New field to track progression
}
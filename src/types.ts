/**
 * Types and interfaces for the Kindergarten ABC Voice game.
 */

export interface LetterState {
  char: string; // The specific letter, e.g., 'C' in 'CAT'
  isDestroyed: boolean;
  id: string; // Unique ID for key mapping (e.g. wordId + index)
}

export interface FallingWord {
  id: string;
  word: string; // E.g., 'CAT'
  letters: LetterState[];
  x: number; // 5 to 90 (percent from left margin)
  y: number; // -10 to 100 (percent from top)
  speed: number; // how fast it falls (percent per frame or tick)
  category: WordCategory;
  emoji: string; // e.g., "🐱" for CAT
  translation: string; // Traditional Chinese translation for context
  colorCategory: string; // Tailwind color class grouping
  isClearing: boolean; // True when showing destruction animation
}

export type WordCategory = 'animals' | 'colors' | 'nature' | 'daily' | 'actions';

export interface WordCategoryDef {
  id: WordCategory;
  name: string;
  icon: string;
  color: string; // Tailwind bg/text classes
}

export interface VocabularyItem {
  word: string;
  category: WordCategory;
  emoji: string;
  translation: string; // Chinese explanation for traditional teaching support
}

export interface GameParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  char?: string; // Optional letter particle floating away
}

export interface SpeechLog {
  id: string;
  text: string;
  timestamp: Date;
  matchType: 'word' | 'letter' | 'miss';
  matchedValue: string;
}

export type GameView = 'menu' | 'play' | 'practice' | 'guide';

export interface GameStats {
  score: number;
  wordsCleared: number;
  lettersCleared: number;
  lives: number;
  maxLives: number;
  level: number;
}

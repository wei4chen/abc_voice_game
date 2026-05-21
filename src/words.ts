import { VocabularyItem, WordCategoryDef } from './types';

export const WORD_CATEGORIES: WordCategoryDef[] = [
  { id: 'animals', name: '動物 Animal', icon: '🦁', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { id: 'colors', name: '顏色 Color', icon: '🎨', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'nature', name: '自然 Nature', icon: '🌿', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'daily', name: '日常 Daily', icon: '🧸', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
  { id: 'actions', name: '動作 Action', icon: '🏃‍♂️', color: 'bg-pink-100 text-pink-800 border-pink-300' },
];

export const VOCABULARY: VocabularyItem[] = [
  // Animals
  { word: 'CAT', category: 'animals', emoji: '🐱', translation: '貓咪' },
  { word: 'DOG', category: 'animals', emoji: '🐶', translation: '小狗' },
  { word: 'PIG', category: 'animals', emoji: '🐷', translation: '小豬' },
  { word: 'FOX', category: 'animals', emoji: '🦊', translation: '狐狸' },
  { word: 'OWL', category: 'animals', emoji: '🦉', translation: '貓頭鷹' },
  { word: 'BEAR', category: 'animals', emoji: '🐻', translation: '熊熊' },
  { word: 'LION', category: 'animals', emoji: '🦁', translation: '獅子' },
  { word: 'DUCK', category: 'animals', emoji: '🦆', translation: '鴨子' },
  { word: 'FISH', category: 'animals', emoji: '🐟', translation: '魚' },
  { word: 'FROG', category: 'animals', emoji: '🐸', translation: '青蛙' },
  { word: 'BEE', category: 'animals', emoji: '🐝', translation: '蜜蜂' },

  // Colors
  { word: 'RED', category: 'colors', emoji: '🔴', translation: '紅色' },
  { word: 'BLUE', category: 'colors', emoji: '🔵', translation: '藍色' },
  { word: 'PINK', category: 'colors', emoji: '🌸', translation: '粉紅色' },
  { word: 'GREEN', category: 'colors', emoji: '🟢', translation: '綠色' },
  { word: 'GRAY', category: 'colors', emoji: '🔘', translation: '灰色' },
  { word: 'GOLD', category: 'colors', emoji: '💛', translation: '金色' },
  { word: 'WHITE', category: 'colors', emoji: '⚪', translation: '白色' },

  // Nature
  { word: 'SUN', category: 'nature', emoji: '☀️', translation: '太陽' },
  { word: 'MOON', category: 'nature', emoji: '🌙', translation: '月亮' },
  { word: 'STAR', category: 'nature', emoji: '⭐', translation: '星星' },
  { word: 'TREE', category: 'nature', emoji: '🌳', translation: '樹木' },
  { word: 'LEAF', category: 'nature', emoji: '🍃', translation: '樹葉' },
  { word: 'WIND', category: 'nature', emoji: '💨', translation: '微風' },
  { word: 'RAIN', category: 'nature', emoji: '🌧️', translation: '下雨' },
  { word: 'SNOW', category: 'nature', emoji: '❄️', translation: '下雪' },
  { word: 'WATER', category: 'nature', emoji: '💧', translation: '水' },
  { word: 'ROCK', category: 'nature', emoji: '🪨', translation: '石頭' },

  // Daily
  { word: 'CAR', category: 'daily', emoji: '🚗', translation: '車子' },
  { word: 'APPLE', category: 'daily', emoji: '🍎', translation: '蘋果' },
  { word: 'TOY', category: 'daily', emoji: '🧸', translation: '玩具' },
  { word: 'BOOK', category: 'daily', emoji: '📖', translation: '書本' },
  { word: 'BALL', category: 'daily', emoji: '⚽', translation: '球球' },
  { word: 'MILK', category: 'daily', emoji: '🥛', translation: '牛奶' },
  { word: 'CAKE', category: 'daily', emoji: '🍰', translation: '蛋糕' },
  { word: 'SHIP', category: 'daily', emoji: '🚢', translation: '輪船' },
  { word: 'KITE', category: 'daily', emoji: '🪁', translation: '風箏' },
  { word: 'BOX', category: 'daily', emoji: '📦', translation: '箱子' },
  { word: 'BED', category: 'daily', emoji: '🛏️', translation: '床鋪' },
  { word: 'CUP', category: 'daily', emoji: '🥤', translation: '杯子' },

  // Action Words
  { word: 'RUN', category: 'actions', emoji: '🏃‍♂️', translation: '跑步' },
  { word: 'JUMP', category: 'actions', emoji: '🦘', translation: '跳躍' },
  { word: 'PLAY', category: 'actions', emoji: '🎮', translation: '遊玩' },
  { word: 'SING', category: 'actions', emoji: '🎤', translation: '唱歌' },
  { word: 'HOP', category: 'actions', emoji: '🐰', translation: '單腳跳' },
  { word: 'WALK', category: 'actions', emoji: '🚶‍♂️', translation: '走路' },
  { word: 'FLY', category: 'actions', emoji: '🦅', translation: '飛翔' },
  { word: 'SWIM', category: 'actions', emoji: '🏊‍♂️', translation: '游泳' },
  { word: 'CLAP', category: 'actions', emoji: '👏', translation: '拍手' },
  { word: 'HUG', category: 'actions', emoji: '🤗', translation: '擁抱' },
];

/**
 * Maps standard transcription terms (and speech bugs or homophones) 
 * to single upper-case english letters for maximum recognition tolerance
 * with 6-year-old high-pitched voices.
 */
export const LETTER_PHONETICS_MAP: Record<string, string> = {
  // A
  'a': 'A', 'ay': 'A', 'eh': 'A', 'eight': 'A', 'eighteen': 'A', 'hey': 'A', 'ape': 'A',
  // B
  'b': 'B', 'be': 'B', 'bee': 'B', 'beat': 'B', 'me': 'B', 'big': 'B',
  // C
  'c': 'C', 'see': 'C', 'sea': 'C', 'she': 'C', 'say': 'C', 'si': 'C', 'key': 'C',
  // D
  'd': 'D', 'dee': 'D', 'the': 'D', 'day': 'D', 'did': 'D', 'deep': 'D',
  // E
  'e': 'E', 'ee': 'E', 'he': 'E', 'eat': 'E', 'east': 'E', 'it': 'E', 'yi': 'E',
  // F
  'f': 'F', 'ef': 'F', 'after': 'F', 'have': 'F', 'for': 'F', 'if': 'F',
  // G
  'g': 'G', 'jee': 'G', 'ji': 'G', 'chi': 'G', 'shee': 'G', 'gee': 'G',
  // H
  'h': 'H', 'age': 'H', 'each': 'H', 'aitch': 'H', 'edge': 'H', 'itch': 'H',
  // I
  'i': 'I', 'eye': 'I', 'ai': 'I', 'hi': 'I', 'my': 'I', 'pie': 'I',
  // J
  'j': 'J', 'jay': 'J', 'chain': 'J', 'chey': 'J',
  // K
  'k': 'K', 'kay': 'K', 'ok': 'K', 'gay': 'K', 'cake': 'K',
  // L
  'l': 'L', 'el': 'L', 'well': 'L', 'hell': 'L',
  // M
  'm': 'M', 'em': 'M', 'am': 'M', 'meow': 'M', 'them': 'M',
  // N
  'n': 'N', 'en': 'N', 'and': 'N', 'in': 'N', 'on': 'N', 'end': 'N',
  // O
  'o': 'O', 'oh': 'O', 'old': 'O', 'all': 'O', 'ow': 'O', 'or': 'O',
  // P
  'p': 'P', 'pee': 'P', 'pea': 'P', 'pay': 'P',
  // Q
  'q': 'Q', 'cue': 'Q', 'queue': 'Q', 'cute': 'Q', 'qu': 'Q',
  // R
  'r': 'R', 'are': 'R', 'our': 'R', 'hour': 'R', 'ah': 'R',
  // S
  's': 'S', 'es': 'S', 'ass': 'S', 'ice': 'S', 'yes': 'S', 'so': 'S',
  // T
  't': 'T', 'tee': 'T', 'tea': 'T', 'to': 'T', 'two': 'T', 'tree': 'T',
  // U
  'u': 'U', 'you': 'U', 'use': 'U', 'youth': 'U',
  // V
  'v': 'V', 'vee': 'V',
  // W
  'w': 'W', 'double u': 'W', 'with': 'W', 'we': 'W',
  // X
  'x': 'X', 'ex': 'X', 'eggs': 'X', 'act': 'X', 'ask': 'X', 'axe': 'X',
  // Y
  'y': 'Y', 'why': 'Y', 'white': 'Y', 'wire': 'Y',
  // Z
  'z': 'Z', 'zee': 'Z', 'zed': 'Z', 'zero': 'Z',
};

/**
 * Returns matching letters for a given phonetic word spoken by the user.
 * Helps normalize multi-letter utterances or isolated target letters.
 */
export function normalizeSpokenText(spoken: string): string[] {
  const clean = spoken.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const tokens = clean.split(/\s+/);
  
  const results: string[] = [];
  
  for (const token of tokens) {
    // 1. Direct letter matches (e.g. "c")
    if (token.length === 1 && token >= 'a' && token <= 'z') {
      results.push(token.toUpperCase());
      continue;
    }
    
    // 2. Phonetic dictionary match (e.g. "see" -> "C")
    if (LETTER_PHONETICS_MAP[token]) {
      results.push(LETTER_PHONETICS_MAP[token]);
    }
  }
  
  return results;
}

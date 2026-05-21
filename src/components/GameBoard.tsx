import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VocabularyItem, FallingWord, GameParticle, SpeechLog, GameStats, WordCategory } from '../types';
import { VOCABULARY, WORD_CATEGORIES, LETTER_PHONETICS_MAP, normalizeSpokenText } from '../words';
import { synth } from '../sound';
import { Play, Pause, RotateCcw, Heart, Star, Mic, MicOff, Volume2, HelpCircle, Trophy, VolumeX, ShieldAlert } from 'lucide-react';

interface GameBoardProps {
  isAudioEnabled: boolean;
  onToggleAudio: () => void;
  onAnnounce: (phrase: string) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  isAudioEnabled,
  onToggleAudio,
  onAnnounce,
}) => {
  // Game Setup States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>('all');
  
  // Game Play States
  const [words, setWords] = useState<FallingWord[]>([]);
  const [particles, setParticles] = useState<GameParticle[]>([]);
  const [speechLogs, setSpeechLogs] = useState<SpeechLog[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<string>('');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    wordsCleared: 0,
    lettersCleared: 0,
    lives: 5,
    maxLives: 5,
    level: 1,
  });
  
  // Voice Input Statuses
  const [micActive, setMicActive] = useState<boolean>(false);
  const [micState, setMicState] = useState<'idle' | 'listening' | 'success' | 'miss'>('idle');
  const [assistantMessage, setAssistantMessage] = useState<string>('按下「開始玩」後，我會在這裡幫你對答案！');
  const [micPermissionError, setMicPermissionError] = useState<boolean>(false);

  // References to keep state across animation frames and continuous async loops
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isPlayingRef = useRef<boolean>(false);
  const wordsRef = useRef<FallingWord[]>([]);
  const statsRef = useRef<GameStats>(stats);
  const selectedCategoryRef = useRef<WordCategory | 'all'>('all');
  const difficultyRef = useRef<'easy' | 'medium' | 'hard'>('easy');

  // Sync state to mutable refs for continuous loop reference
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { wordsRef.current = words; }, [words]);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  useEffect(() => { selectedCategoryRef.current = selectedCategory; }, [selectedCategory]);
  useEffect(() => { difficultyRef.current = difficulty; }, [difficulty]);

  // Adjust game stats speed factor
  const getSpeedMultiplier = () => {
    switch (difficultyRef.current) {
      case 'easy': return 0.04;
      case 'medium': return 0.07;
      case 'hard': return 0.11;
      default: return 0.05;
    }
  };

  const getSpawnInterval = () => {
    const base = difficulty === 'easy' ? 4500 : difficulty === 'medium' ? 3200 : 2250;
    // Speed up slightly based on current level
    return Math.max(1500, base - (stats.level * 200));
  };

  // Setup Web Speech API continuous recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setMicActive(true);
          setMicState('listening');
          setMicPermissionError(false);
          console.log('Continuous Web Speech Active!');
        };

        recognition.onerror = (e: any) => {
          console.error('Speech recognition runtime error:', e);
          if (e.error === 'not-allowed') {
            setMicPermissionError(true);
            setMicActive(false);
          }
        };

        recognition.onend = () => {
          setMicActive(false);
          // Auto-reinforce restart if game is currently playing! Very critical UX!
          if (isPlayingRef.current) {
            try {
              recognition.start();
            } catch (err) {
              console.log('Error restarting recognition:', err);
            }
          }
        };

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          const activePhrase = (finalTranscript || interimTranscript).toLowerCase().trim();
          if (activePhrase) {
            setLatestTranscript(activePhrase);
            processSpeechInput(activePhrase);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Sync mic continuous mode with isPlaying state
  useEffect(() => {
    if (recognitionRef.current) {
      if (isPlaying) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already running
        }
      } else {
        recognitionRef.current.stop();
        setMicActive(false);
        setMicState('idle');
      }
    }
  }, [isPlaying]);

  // Main Speech Interpreter Engine: Matches Word or Chain of Letters
  const processSpeechInput = (transcriptText: string) => {
    const cleanSpoken = transcriptText.replace(/[^a-z0-9\s]/g, '').trim();
    const tokens = cleanSpoken.split(/\s+/);
    
    let matchedAny = false;
    let logMsg = '';
    
    // Create a new words array to preserve state updates safely
    let currentActiveWords = [...wordsRef.current];
    if (currentActiveWords.length === 0) return;

    // A) Try WHOLE-WORD matches first.
    // Scan falling words, prioritize lowest items (safeguard closest to floor)
    const sortedByAltitude = [...currentActiveWords].sort((a, b) => b.y - a.y);
    
    // We check if any token or the whole combined clean spoken matches the falling word
    for (const fw of sortedByAltitude) {
      if (fw.isClearing) continue;
      
      const targetWordClean = fw.word.toLowerCase();
      // Match full token (e.g. child says "cat") or if it's contained inside longer recognized strings
      if (tokens.includes(targetWordClean) || cleanSpoken.includes(targetWordClean)) {
        // MATCH FOUND! Eliminate the entire word!
        handleWordEliminated(fw.id, fw.word, fw.emoji, fw.x, fw.y);
        matchedAny = true;
        logMsg = `唸出單字: "${fw.word}" 消滅成功！`;
        break; // Max 1 word processed per chunk to avoid double clears
      }
    }

    // B) If no whole word was matched, try SEQUENCE LETTER match (C then A then T)
    if (!matchedAny) {
      // Decode single phonetics representing English characters
      const lettersSpoken = normalizeSpokenText(transcriptText);
      
      if (lettersSpoken.length > 0) {
        // Let's sweep letters on the lowest word that isn't fully cleared
        for (const fw of sortedByAltitude) {
          if (fw.isClearing) continue;

          // Find the first letter that is NOT currently destroyed
          const nextIndex = fw.letters.findIndex(l => !l.isDestroyed);
          if (nextIndex !== -1) {
            const nextTargetChar = fw.letters[nextIndex].char;
            
            // Does their spoken phonetic contain this target letter?
            if (lettersSpoken.includes(nextTargetChar)) {
              // Clear this letter!
              handleLetterEliminated(fw.id, nextIndex, nextTargetChar, fw.x, fw.y);
              matchedAny = true;
              logMsg = `唸出字母: "${nextTargetChar}" 擊碎氣球！`;
              break; // Prevent destruction of multiple words in one tick
            }
          }
        }
      }
    }

    // Visual log & Mascot Feedback
    if (matchedAny) {
      setMicState('success');
      setAssistantMessage(logMsg || '太棒了！拼讀完全正確！👏');
      setTimeout(() => setMicState('listening'), 1200);
      
      // Update speech logs in UI
      const newLog: SpeechLog = {
        id: Math.random().toString(),
        text: transcriptText,
        timestamp: new Date(),
        matchType: 'word',
        matchedValue: logMsg,
      };
      setSpeechLogs(prev => [newLog, ...prev.slice(0, 15)]);
    } else {
      // Subdued speech log to track voice attempts
      if (transcriptText.length > 3) {
        setMicState('miss');
        setAssistantMessage(`聽到了 "${transcriptText}"。試著唸大聲、慢一點哦！`);
        setTimeout(() => setMicState('listening'), 1500);
      }
    }
  };

  // Letter bubble match success
  const handleLetterEliminated = (wordId: string, index: number, char: string, x: number, y: number) => {
    setWords(prevWords => {
      return prevWords.map(fw => {
        if (fw.id === wordId) {
          const updatedLetters = [...fw.letters];
          updatedLetters[index] = { ...updatedLetters[index], isDestroyed: true };
          
          // Check if this action completed the entire word
          const isFinished = updatedLetters.every(l => l.isDestroyed);
          if (isFinished) {
            // Run full word finish deferment in next tick
            setTimeout(() => {
              handleWordEliminated(fw.id, fw.word, fw.emoji, fw.x, fw.y);
            }, 100);
          } else {
            synth.playLetterZap();
            spawnParticles(x + (index * 4), y, '#f43f5e', char);
            
            // Add slight points
            setStats(prev => ({
              ...prev,
              score: prev.score + 10,
              lettersCleared: prev.lettersCleared + 1
            }));
          }
          return { ...fw, letters: updatedLetters };
        }
        return fw;
      });
    });
  };

  // Complete word elimination (Chime, blast stars/bubbles and remove)
  const handleWordEliminated = (id: string, wordStr: string, emoji: string, x: number, y: number) => {
    synth.playWordCleared();
    onAnnounce(`${wordStr}! Good job!`);

    // Particle explosion
    spawnParticles(x, y, '#4f46e5', emoji, 12);

    // Filter or trigger clearing animation
    setWords(prev => prev.filter(w => w.id !== id));

    // Update Scores, trigger Level-ups if score goes up
    setStats(prev => {
      const nextScore = prev.score + (wordStr.length * 20) + 50;
      const nextWordsCleared = prev.wordsCleared + 1;
      // Level up for every 5 words cleared!
      const currentLevel = prev.level;
      const targetLevel = Math.floor(nextWordsCleared / 5) + 1;
      
      if (targetLevel > currentLevel) {
        synth.playLevelUp();
        onAnnounce(`Awesome! You reached Level ${targetLevel}!`);
        return {
          ...prev,
          score: nextScore,
          wordsCleared: nextWordsCleared,
          level: targetLevel,
        };
      }

      return {
        ...prev,
        score: nextScore,
        wordsCleared: nextWordsCleared,
      };
    });
  };

  // Handle word landing on floor barrier (lose 1 heart)
  const handleWordLanded = (fw: FallingWord) => {
    synth.playLifeLost();
    
    // Sparks at the ground
    spawnParticles(fw.x, 90, '#ef4444', '💥', 8);

    // Help speak tip for the missed word
    onAnnounce(`Oh no! ${fw.word} hit the ground. ${fw.word} is ${fw.translation}.`);

    setWords(prev => prev.filter(w => w.id !== fw.id));
    setStats(prev => {
      const nextLives = prev.lives - 1;
      if (nextLives <= 0) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        synth.playGameOver();
        onAnnounce(`Game over! Your score is ${prev.score}. Let's play again!`);
      }
      return { ...prev, lives: nextLives };
    });
  };

  // Random Word Generator suitable for 6-year-old child
  const spawnFallingWord = () => {
    if (!isPlayingRef.current) return;

    // Filter dictionary based on parent category selection
    const pool = selectedCategoryRef.current === 'all'
      ? VOCABULARY
      : VOCABULARY.filter(item => item.category === selectedCategoryRef.current);
    
    if (pool.length === 0) return;

    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    
    // Avoid spawning duplicate words simultaneously to prevent speech mapping confusion
    if (wordsRef.current.some(w => w.word === randomItem.word)) return;

    // Create unique letters layout
    const wordId = Math.random().toString();
    const lettersState = randomItem.word.split('').map((char, index) => ({
      char,
      isDestroyed: false,
      id: `${wordId}-${index}`,
    }));

    // Random styling categories
    const colors = ['border-pink-300 bg-pink-100', 'border-indigo-300 bg-indigo-100', 'border-amber-300 bg-amber-100', 'border-emerald-300 bg-emerald-100', 'border-sky-300 bg-sky-100'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newWord: FallingWord = {
      id: wordId,
      word: randomItem.word,
      letters: lettersState,
      x: Math.floor(Math.random() * 65) + 10, // Keep padded inside screen bounds
      y: -10, // Starting high up off-screen
      speed: (Math.random() * 0.3 + 0.35) * getSpeedMultiplier() * (1 + (statsRef.current.level * 0.08)),
      category: randomItem.category,
      emoji: randomItem.emoji,
      translation: randomItem.translation,
      colorCategory: randomColor,
      isClearing: false,
    };

    setWords(prev => [...prev, newWord]);
  };

  // Spawning logic scheduler
  useEffect(() => {
    let intervalId: any;
    if (isPlaying) {
      // Spawn instantly first
      spawnFallingWord();
      intervalId = setInterval(spawnFallingWord, getSpawnInterval());
    }
    return () => clearInterval(intervalId);
  }, [isPlaying, selectedCategory, difficulty, stats.level]);

  // Main high-performance Animation Frame game loop
  const animate = (time: number) => {
    if (previousTimeRef.current !== null) {
      // 1. Update falling words vertical positions
      if (isPlayingRef.current) {
        setWords(prevWords => {
          const updated: FallingWord[] = [];
          for (const w of prevWords) {
            const nextY = w.y + w.speed;
            if (nextY >= 90) {
              // Triggers base-hit
              handleWordLanded(w);
            } else {
              updated.push({ ...w, y: nextY });
            }
          }
          return updated;
        });
      }

      // 2. Update particle positions
      setParticles(prev => {
        return prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.02,
          }))
          .filter(p => p.alpha > 0);
      });
    }

    previousTimeRef.current = time;
    if (isPlayingRef.current || particles.length > 0) {
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  // Auto-start animation frames listener
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying]);

  // Spawn visual elements
  const spawnParticles = (xIndex: number, yIndex: number, color: string, char?: string, count = 6) => {
    const fresh: GameParticle[] = [];
    for (let i = 0; i < count; i++) {
      fresh.push({
        id: Math.random().toString(),
        x: xIndex,
        y: yIndex,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2, // burst slightly upwards
        color,
        size: Math.random() * 8 + 6,
        alpha: 1,
        char: i === 0 && char ? char : undefined, // Attach key character/emoji to main burst
      });
    }
    setParticles(prev => [...prev, ...fresh]);
  };

  // Standard Restart Game handler
  const handleRestart = () => {
    synth.playTick();
    setWords([]);
    setParticles([]);
    setLatestTranscript('');
    setStats({
      score: 0,
      wordsCleared: 0,
      lettersCleared: 0,
      lives: 5,
      maxLives: 5,
      level: 1,
    });
    setSpeechLogs([]);
    setAssistantMessage('新局開始囉！請點擊開始玩，對著麥克風大聲唸讀！');
    setIsPlaying(true);
    isPlayingRef.current = true;
    onAnnounce('Starting a new game. Have fun spelling!');
  };

  const handleTogglePlay = () => {
    synth.playTick();
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      onAnnounce('Game resumed.');
    } else {
      onAnnounce('Game paused.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="gameplay-area">
      
      {/* LEFT COLUMN: Controls, Difficulty, Preset Categories selection */}
      <div className="space-y-6 lg:col-span-1" id="gameplay-dashboard-aside">
        
        {/* Game Stats Widget panel */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-4 border-emerald-400 relative overflow-hidden" id="dashboard-score-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-emerald-50 to-transparent rounded-bl-3xl -z-10" />
          
          <h3 className="text-md font-black text-emerald-600 uppercase tracking-tight mb-4 flex items-center gap-1.5">
            <Trophy size={18} className="text-emerald-500" />
            <span>目前得分 STARS</span>
          </h3>

          <div className="space-y-4" id="stats-numerical-list">
            <div className="flex items-center justify-between bg-emerald-50 p-3 rounded-2xl border-2 border-emerald-200">
              <span className="text-emerald-800 text-xs font-black">STARS (分數):</span>
              <span className="text-3xl font-black text-emerald-600 tracking-tight">
                {stats.score}
              </span>
            </div>

            <div className="flex justify-between items-center bg-rose-50 p-3 rounded-2xl border-2 border-rose-200">
              <span className="text-rose-800 text-xs font-black">LEVEL (關卡):</span>
              <span className="bg-rose-500 text-white text-md font-black px-3.5 py-1 rounded-full shadow-sm">
                關卡 {stats.level}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-2.5">
              <span className="text-gray-500 text-xs font-bold">已解單字 Cleared:</span>
              <span className="text-gray-800 text-sm font-extrabold font-mono">
                {stats.wordsCleared} 個
              </span>
            </div>

            {/* Lives Heart Icons */}
            <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-2.5" id="lives-tracker-row">
              <span className="text-gray-500 text-xs font-bold">氣球生命 Lives:</span>
              <div className="flex gap-1" id="hearts-chain">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Heart
                    key={i}
                    size={16}
                    className={`transition duration-300 ${
                      i < stats.lives
                        ? 'text-pink-500 fill-pink-500 animate-pulse'
                        : 'text-gray-200 fill-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Categories preset list and difficulty selection */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-4 border-sky-400 space-y-4" id="dashboard-settings-card">
          <div>
            <h3 className="text-gray-800 font-extrabold text-xs mb-2">單字類別 Category</h3>
            <select
              value={selectedCategory}
              onChange={(e) => {
                synth.playTick();
                setSelectedCategory(e.target.value as any);
              }}
              className="w-full bg-indigo-50/50 border border-indigo-100 text-indigo-950 px-3 py-2.5 text-xs rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
              id="game-select-category"
            >
              <option value="all">⭐ 全部主題 (不限) ⭐</option>
              {WORD_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h3 className="text-gray-800 font-extrabold text-xs mb-2">掉落速度 Speed</h3>
            <div className="grid grid-cols-3 gap-1" id="difficulty-grid-btns">
              {(['easy', 'medium', 'hard'] as const).map(diff => (
                <button
                  key={diff}
                  onClick={() => {
                    synth.playTick();
                    setDifficulty(diff);
                  }}
                  className={`text-xs font-bold py-2 rounded-xl border transition-all cursor-pointer ${
                    difficulty === diff
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                  id={`btn-diff-${diff}`}
                >
                  {diff === 'easy' ? '🐢 慢' : diff === 'medium' ? '🐼 中' : '⚡ 快'}
                </button>
              ))}
            </div>
          </div>

          {/* Tips block */}
          <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-[10px] text-gray-500 leading-relaxed font-semibold">
            <HelpCircle size={14} className="text-indigo-400 inline mr-1 mb-0.5" />
            <span>當單字掉落時：你可以直接<b>唸出單字拼音</b>或<b>依序大聲唸字母</b>，將掉落字消滅喔！</span>
          </div>
        </div>

        {/* Microphone Permission Warning alert if blocked */}
        {micPermissionError && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-3xl text-xs text-red-700 flex gap-2" id="speech-permission-alert">
            <ShieldAlert size={16} className="text-red-500 flex-shrink-0" />
            <div className="font-semibold space-y-1">
              <p className="font-bold">麥克風被阻擋了！</p>
              <p className="text-[10px] text-red-600 leading-relaxed">請確認是否同意授予本網頁麥克風存取權。如果是在 iFrame 中預覽，建議點擊右上角「用新分頁開啟」再試一次喔！</p>
            </div>
          </div>
        )}
      </div>

      {/* CENTER COLUMN: Main Falling Words Sandbox canvas container */}
      <div className="lg:col-span-3 flex flex-col gap-4" id="gameplay-area-canvas-wrapper">
        
        {/* Mascot / Voice Assistant Banner */}
        <div className="bg-white/95 backdrop-blur shadow-sm p-4 rounded-3xl border border-indigo-50 flex items-center justify-between" id="voice-monitor-ribbon">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-full flex items-center justify-center text-white ${
              micActive ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
            }`} id="status-bubble-mic">
              <Mic size={16} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-700">語音解析：{assistantMessage}</p>
              {latestTranscript && (
                <p className="text-[10px] text-indigo-500 font-mono mt-0.5">
                  🎙️ 偵測到讀音：<span className="uppercase font-bold">"{latestTranscript}"</span>
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleRestart}
              className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200/80 transition-all border border-slate-200 flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
              title="重開一局 Restart"
              id="btn-re-start-game"
            >
              <RotateCcw size={14} />
              <span>重新開始</span>
            </button>
            <button
              onClick={handleTogglePlay}
              disabled={stats.lives <= 0}
              className={`p-2 rounded-xl transition-all border flex items-center justify-center gap-1 text-xs font-bold cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200' 
                  : 'bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700'
              }`}
              id="btn-main-play-toggle"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? '暫停遊戲' : '開始玩！'}</span>
            </button>
          </div>
        </div>

        {/* Game Stage Area */}
        <div className="relative w-full h-[500px] bg-sky-100 rounded-[2.5rem] border-4 border-white shadow-xl overflow-hidden shadow-indigo-100/40 select-none" id="falling-game-stage">
          
          {/* Background Decor: Sun and Clouds from Vibrant Palette */}
          <div className="absolute top-10 right-10 w-24 h-24 bg-amber-400 rounded-full shadow-[0_0_40px_rgba(251,191,36,0.5)] pointer-events-none" />
          <div className="absolute top-16 left-20 w-32 h-12 bg-white rounded-full opacity-80 pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-24 left-32 w-28 h-10 bg-white rounded-full opacity-80 pointer-events-none animate-pulse" style={{ animationDuration: '11s' }} />

          {/* Falling Words Rendering list */}
          <AnimatePresence>
            {words.map(fw => {
              return (
                <div
                  key={fw.id}
                  className="absolute transition-all duration-75 flex flex-col items-center select-none"
                  style={{
                    left: `${fw.x}%`,
                    top: `${fw.y}%`,
                  }}
                  id={`falling-word-block-${fw.word}`}
                >
                  {/* Connect block with hanging letter candy bubbles with thick shadows and chunky borders */}
                  <div className="flex flex-col items-center gap-1.5 p-3 px-4 bg-white rounded-[2rem] shadow-xl border-4 border-slate-700 border-b-8 border-r-8 cursor-pointer relative transition hover:scale-105" id="hanging-chain-bubble">
                    <div className="flex items-center gap-2">
                      {/* Emoji Illustration badge */}
                      <span className="text-3xl animate-pulse select-none font-sans" id="word-emoji-avatar">
                        {fw.emoji}
                      </span>

                      {/* Sequential letters row of bubbles */}
                      <div className="flex gap-1.5" id="letter-chain-row">
                        {fw.letters.map((letter, letterIdx) => {
                          const isCurrentFocus = fw.letters.findIndex(l => !l.isDestroyed) === letterIdx;
                          return (
                            <span
                              key={letter.id}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xl border-2 transition-all duration-300 ${
                                letter.isDestroyed
                                  ? 'bg-slate-100 text-slate-300 border-slate-200/50 scale-90 opacity-40'
                                  : isCurrentFocus
                                  ? 'bg-indigo-500 text-white border-indigo-700 shadow-[0_4px_0_#4338ca] scale-110 animate-bounce'
                                  : 'bg-white text-sky-500 border-sky-400 shadow-[0_4px_0_#38bdf8]'
                              }`}
                              id={`bubble-char-${letter.id}`}
                            >
                              {letter.char}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </AnimatePresence>

          {/* HTML Canvas particle overlay renderer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" id="particles-overlay">
            {particles.map(p => (
              <g key={p.id}>
                {/* Visual bubble ring */}
                <circle
                  cx={p.x * 6 + 100} // Approximate percentage convert for aesthetic layout
                  cy={p.y * 5}
                  r={p.size}
                  fill={p.color}
                  opacity={p.alpha}
                />
                {p.char && (
                  <text
                    x={p.x * 6 + 100}
                    y={p.y * 5 + 4}
                    fill="#312e81"
                    fontSize="13"
                    fontWeight="black"
                    textAnchor="middle"
                    className="font-mono"
                    opacity={p.alpha}
                  >
                    {p.char}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Floor Warning Barrier line */}
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-emerald-400 flex items-center justify-center border-t-8 border-emerald-500/30" id="floor-warning-level">
            {/* Grass humps */}
            <div className="absolute -top-4 left-0 w-full h-8 flex gap-1 pointer-events-none">
              {Array.from({ length: 14 }).map((_, idx) => (
                <div key={idx} className="flex-1 bg-emerald-400 rounded-t-full h-full" />
              ))}
            </div>
            <span className="font-extrabold text-[11px] text-emerald-950 tracking-widest text-shadow-sm flex items-center justify-center gap-1.5 animate-pulse font-sans z-10">
              🍀 草地防守線 SANDBOX BARRIER 🍀
            </span>
          </div>

          {/* GAME OVER Screen Modal Overlay */}
          {stats.lives <= 0 && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col justify-center items-center text-center p-6 text-white space-y-4" id="gameover-modal">
              <span className="text-6xl animate-bounce">🧟‍♂️</span>
              <h2 className="text-3xl font-black tracking-wide text-pink-400 shadow-sm uppercase font-sans">
                遊戲結束 ! Game Over
              </h2>
              <p className="text-sm text-gray-200 font-bold max-w-xs leading-relaxed">
                你拼對了許多六歲美國小孩會的英文單字喔！總得分為 <b>{stats.score}</b> 分。
              </p>
              
              <div className="bg-white/10 p-4 rounded-2xl border border-white/10 font-bold text-xs text-indigo-200 flex items-center gap-2">
                <Trophy className="text-yellow-400" />
                <span>消滅了 {stats.wordsCleared} 個單字，擊碎 {stats.lettersCleared} 個語音字母氣球！</span>
              </div>

              <button
                onClick={handleRestart}
                className="bg-gradient-to-tr from-pink-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white font-black text-sm px-6 py-3 rounded-full shadow-lg border border-white/20 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
                id="btn-gameover-restart"
              >
                再玩一次 Play Again
              </button>
            </div>
          )}

          {/* PAUSED Screen Overlay */}
          {!isPlaying && stats.lives > 0 && (
            <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-sm flex flex-col justify-center items-center text-center p-6 text-white space-y-3" id="paused-modal">
              <span className="text-5xl animate-spin" style={{ animationDuration: '4s' }}>🧸</span>
              <h3 className="text-2xl font-black tracking-wider text-indigo-100">幼稚園單字作戰暫停中</h3>
              <p className="text-xs text-indigo-200 leading-relaxed max-w-xs font-semibold">
                Barney 正在呼呼大睡。點擊下方的「<b>繼續玩</b>」按鈕解鎖或開啟學習哦！
              </p>
              <button
                onClick={handleTogglePlay}
                className="bg-indigo-500 hover:bg-indigo-600 border border-indigo-400 text-white text-xs font-extrabold px-5 py-2.5 rounded-full shadow cursor-pointer"
                id="btn-paused-resume"
              >
                繼續玩 Resume Game
              </button>
            </div>
          )}
        </div>

        {/* Footnote: Speech raw telemetry log list for guidance */}
        <div className="bg-slate-50 border border-slate-100/80 p-4 rounded-3xl" id="speech-telemetry-console">
          <h4 className="text-[11px] font-black tracking-widest text-gray-500 uppercase mb-2 flex items-center gap-1 font-sans">
            💬 語音識別紀錄 Real-time Speech Log Console
          </h4>
          
          <div className="space-y-1.5 max-h-[85px] overflow-y-auto pr-1" id="scrolling-speech-logs">
            {speechLogs.length === 0 ? (
              <p className="text-[10px] text-gray-400 italic font-semibold">
                目前尚無語音資料。遊戲中只要大聲朗讀 CAT 或是唸 C-A-T，語音狀態就會呈現在這裡！
              </p>
            ) : (
              speechLogs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-gray-100 text-[10px]"
                  id={`speech-log-item-${log.id}`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded uppercase font-mono font-bold">
                      "{log.text}"
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-slate-800 font-bold">{log.matchedValue}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-mono font-medium">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

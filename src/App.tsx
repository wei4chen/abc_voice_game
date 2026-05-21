import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameBoard } from './components/GameBoard';
import { WordFlashcards } from './components/WordFlashcards';
import { AudioMascot } from './components/AudioMascot';
import { GameView } from './types';
import { synth } from './sound';
import { Sparkles, Gamepad2, GraduationCap, Mic, Volume2, VolumeX, HelpCircle, ArrowRight, Star, AlertCircle, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<GameView>('menu');
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  
  // Mascot parameters
  const [mascotStatus, setMascotStatus] = useState<'idle' | 'listening' | 'success' | 'error' | 'thinking'>('idle');
  const [mascotTranscript, setMascotTranscript] = useState<string>('');
  const [mascotBubblesText, setMascotBubblesText] = useState<string>(
    '哈囉！我是小熊 Barney！讓我們一起邊玩語音遊戲，邊學習 26 個英文字母和常用單字吧！🎈'
  );

  // Initialize supportive global speech services
  const playSystemTones = useCallback((isOn: boolean) => {
    synth.toggle(isOn);
  }, []);

  // Vocalizer helper to speak English letters or praise
  const speakSpeechSynthesis = useCallback((phrase: string) => {
    if (!isAudioEnabled) return;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        // Cancel outstanding speech threads to prevent cumulative delayed queues
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = 'en-US';
        utterance.rate = 0.82; // Child-friendly, slightly articulated pacing
        utterance.pitch = 1.1; // Cute high pitch accent

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('TTS speech synthesis failure:', err);
      }
    }
  }, [isAudioEnabled]);

  // Say hello on initial landing
  useEffect(() => {
    setTimeout(() => {
      speakSpeechSynthesis("Hello there! Welcome to the Alphabet Playground. Let's learn words together!");
    }, 1200);
  }, [speakSpeechSynthesis]);

  // Tab router
  const handleNavigateView = (view: GameView) => {
    synth.playTick();
    setActiveTab(view);

    if (view === 'play') {
      speakSpeechSynthesis("Spelling action game started! Pronounce the falling words or letters to crush them.");
      setMascotBubblesText('作戰開始！唸出掉下來的字母 (例如 C-A-T) 或單字將它們打碎！');
    } else if (view === 'practice') {
      speakSpeechSynthesis("Practice sandbox. Choose any card and repeat after me!");
      setMascotBubblesText('這裡是互動練習室！點擊卡片聽聽發音，也可以對著我大聲練習唸單字哦！');
    } else {
      setMascotBubblesText('哈囉！我是小熊 Barney！點點看上面的按鈕，準備好了就開始玩吧！🧸');
    }
  };

  const handleToggleSound = () => {
    const nextState = !isAudioEnabled;
    setIsAudioEnabled(nextState);
    playSystemTones(nextState);

    if (nextState) {
      setTimeout(() => speakSpeechSynthesis("Sound simulation enabled!"), 300);
    }
  };

  return (
    <div className="min-h-screen bg-sky-50 pb-16 font-sans relative">
      
      {/* HEADER BAR */}
      <header className="bg-white/95 backdrop-blur sticky top-0 z-50 border-b-4 border-sky-200 shadow-md" id="app-landing-header">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Brand logo & Description */}
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce" style={{ animationDuration: '3s' }}>🎈</span>
            <div>
              <h1 className="text-xl font-black text-indigo-950 flex items-center gap-1.5 font-sans">
                <span>幼稚園語音 ABC 特訓教材</span>
                <span className="text-xs bg-pink-100 text-pink-700 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Toddlers 6y+
                </span>
              </h1>
              <p className="text-[10px] text-gray-500 font-semibold tracking-wide">
                Kindergarten Voice-Controlled Alphabet Learning Game
              </p>
            </div>
          </div>

          {/* Navigational Tabs / Modes Selector */}
          <div className="flex items-center gap-2" id="header-router">
            <button
              onClick={() => handleNavigateView('menu')}
              className={`px-3 py-2 text-xs font-black rounded-xl transition duration-150 cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-slate-50'
              }`}
              id="nav-btn-menu"
            >
              🏠 主畫面
            </button>
            <button
              onClick={() => handleNavigateView('practice')}
              className={`px-3 py-2 text-xs font-black rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'practice'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-100'
                  : 'text-gray-600 hover:bg-slate-50'
              }`}
              id="nav-btn-practice"
            >
              <GraduationCap size={14} />
              <span>點讀特訓 Practice</span>
            </button>
            <button
              onClick={() => handleNavigateView('play')}
              className={`px-3 py-2 text-xs font-black rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'play'
                  ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-md shadow-pink-100'
                  : 'text-gray-600 hover:bg-slate-50'
              }`}
              id="nav-btn-play"
            >
              <Gamepad2 size={14} />
              <span>單字消除挑戰 Game</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border transition ${
                isAudioEnabled
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100'
                  : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'
              }`}
              title={isAudioEnabled ? '語音與音效已開啟' : '音效已關閉'}
              id="btn-header-synth-mute"
            >
              {isAudioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="max-w-6xl mx-auto px-4 mt-6 space-y-6" id="app-main-view">
        
        {/* Animated Barney Assistant helper */}
        <div id="advisor-interactive-wrapper">
          <AudioMascot
            status={mascotStatus}
            transcript={mascotTranscript}
            assistantMessage={mascotBubblesText}
            micPermissionGranted={true}
            isAudioEnabled={isAudioEnabled}
            onToggleAudio={handleToggleSound}
          />
        </div>

        {/* Dynamic Inner Tab Router Render */}
        <div className="min-h-[450px]" id="tab-outlet-box">
          <AnimatePresence mode="wait">
            
            {/* VIEW A: LANDING PORTAL MENU */}
            {activeTab === 'menu' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                key="menu-view"
                id="landing-portal"
              >
                
                {/* Visual Intro banner with features specs */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-emerald-400 flex flex-col justify-between" id="intro-card">
                  <div className="space-y-4">
                    <span className="text-xs font-black uppercase text-pink-500 bg-pink-50 px-3 py-1.5 rounded-full tracking-wider">
                      🍭 六歲美國孩童精選單字教材
                    </span>
                    <h2 className="text-3xl font-black text-sky-700 tracking-tight leading-tight">
                      對著麥克風大聲讀英檢，<br />
                      消滅掉落的主題字母！
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed font-semibold">
                      結合<b>語音辨識技術 (Web Speech API)</b>，專為幼兒、幼兒園及小學低年級孩童設計！
                      在孩子大聲拼讀 <b>C... A... T</b> 或完美說出 <b>CAT</b> 的瞬間，字母泡泡將化為滿天星星飛舞，激發孩子口說潛能！
                    </p>

                    <div className="space-y-2.5 border-t border-indigo-25 pt-4" id="intro-bullet-rules">
                      <div className="flex gap-2 text-xs font-bold text-gray-700">
                        <span className="text-indigo-500 font-extrabold">1.</span>
                        <p>整字消滅：如果 C-A-T 落下，小孩唸出「CAT」，三個字母氣球會瞬間一起消失！</p>
                      </div>
                      <div className="flex gap-2 text-xs font-bold text-gray-700">
                        <span className="text-indigo-500 font-extrabold">2.</span>
                        <p>逐字拼讀：也可以先唸「C」消滅 C，再唸「A」消滅 A，最後唸「T」，一個一個擊碎泡泡！</p>
                      </div>
                      <div className="flex gap-2 text-xs font-bold text-gray-700 border-t border-dashed border-gray-100 pt-2 text-gray-500">
                        <span className="text-indigo-400">💡</span>
                        <p>針對高音頻童音，我們內建了極高容錯的音標轉換器（see/sea 認讀為 C，ay/hey 認讀為 A），拼讀學習無障礙！</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8" id="menu-launch-row">
                    <button
                      onClick={() => handleNavigateView('practice')}
                      className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-black text-sm px-5 py-3.5 rounded-2xl flex-1 flex items-center justify-center gap-2 border border-emerald-250 transition-all cursor-pointer"
                      id="launch-btn-practice"
                    >
                      <GraduationCap size={16} />
                      <span>先練習 (點讀)</span>
                    </button>
                    <button
                      onClick={() => handleNavigateView('play')}
                      className="bg-indigo-600 text-white hover:bg-indigo-700 font-black text-sm px-5 py-3.5 rounded-2xl flex-1 flex items-center justify-center gap-2 shadow-md shadow-indigo-100 transition-all cursor-pointer"
                      id="launch-btn-play"
                    >
                      <Gamepad2 size={16} />
                      <span>開始作戰吧！</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Kids standard preschool library preview */}
                <div className="bg-white rounded-[2.5rem] p-6 border-4 border-rose-400 shadow-xl space-y-6" id="preset-vocabulary-display">
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-700 mb-1">六歲精選單字庫 Examples</h3>
                    <p className="text-[10px] text-gray-400 font-semibold mb-3">
                      學齡兒童必備高頻圖畫字 (Dolch Sight Words)
                    </p>

                    <div className="grid grid-cols-2 gap-2" id="vocab-examples-bento">
                      <div className="bg-white rounded-2xl p-3 border-2 border-rose-200 flex items-center gap-3">
                        <span className="text-3xl">🐱</span>
                        <div>
                          <p className="font-black font-mono text-sm tracking-wide text-slate-800">CAT</p>
                          <p className="text-[10px] text-gray-400 font-bold">貓咪 (Animals)</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-3 border-2 border-rose-200 flex items-center gap-3">
                        <span className="text-3xl">🚗</span>
                        <div>
                          <p className="font-black font-mono text-sm tracking-wide text-slate-800">CAR</p>
                          <p className="text-[10px] text-gray-400 font-bold">車子 (Daily)</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-3 border-2 border-rose-200 flex items-center gap-3">
                        <span className="text-3xl">🔵</span>
                        <div>
                          <p className="font-black font-mono text-sm tracking-wide text-slate-800">BLUE</p>
                          <p className="text-[10px] text-gray-400 font-bold">藍色 (Colors)</p>
                        </div>
                      </div>
                      <div className="bg-white rounded-2xl p-3 border-2 border-rose-200 flex items-center gap-3">
                        <span className="text-3xl">🍎</span>
                        <div>
                          <p className="font-black font-mono text-sm tracking-wide text-slate-800">APPLE</p>
                          <p className="text-[10px] text-gray-400 font-bold">蘋果 (Daily)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Phonetic guide table */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-50 space-y-2 text-xs">
                    <h4 className="font-extrabold text-gray-800 flex items-center gap-1 text-[11px] uppercase tracking-wider">
                      <Star size={12} className="text-yellow-500 fill-yellow-500" />
                      拼讀大聲唸參考 (Letter Equivalents Guide)
                    </h4>
                    <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
                      以下是語音助手針對字母單獨發音的加強辨識（即使小朋友單唸一個字，也能被敏銳捕捉！）：
                    </p>
                    <div className="grid grid-cols-2 gap-y-1.5 gap-x-4 font-semibold text-[10px] text-gray-600 border-t border-gray-50 pt-2" id="phonetic-equivalent-grid">
                      <div>🔊 <b>C:</b> 可唸 "see"、"sea"、"she"</div>
                      <div>🔊 <b>A:</b> 可唸 "ay"、"hey"、"eh"</div>
                      <div>🔊 <b>T:</b> 可唸 "tee"、"tea"、"to"</div>
                      <div>🔊 <b>R:</b> 可唸 "are"、"our"、"ah"</div>
                      <div>🔊 <b>B:</b> 可唸 "bee"、"be"、"beat"</div>
                      <div>🔊 <b>L:</b> 可唸 "el"、"well"</div>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* VIEW B: INTERACTIVE PRACTICE SANDBOX */}
            {activeTab === 'practice' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                key="practice-view"
              >
                <WordFlashcards
                  isAudioEnabled={isAudioEnabled}
                  onAnnounce={speakSpeechSynthesis}
                />
              </motion.div>
            )}

            {/* VIEW C: GRAVITY FALLING ELIMINATION GAME CHALLENGE */}
            {activeTab === 'play' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                key="play-view"
              >
                <GameBoard
                  isAudioEnabled={isAudioEnabled}
                  onToggleAudio={handleToggleSound}
                  onAnnounce={speakSpeechSynthesis}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-20 border-t border-gray-100 pt-6 text-center text-[10px] text-gray-400 font-semibold leading-relaxed" id="app-landing-footer">
        <p>幼稚園語音ABC教材 © 💡 美語高容錯拼讀引擎與互動遊戲空間</p>
        <p className="mt-1">由 <b>webkitSpeechRecognition</b> 與 <b>Web Audio API</b> 驅動・音訊零延遲播放</p>
      </footer>

    </div>
  );
}

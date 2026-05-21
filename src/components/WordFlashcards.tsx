import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VOCABULARY, WORD_CATEGORIES, LETTER_PHONETICS_MAP, normalizeSpokenText } from '../words';
import { VocabularyItem, WordCategory } from '../types';
import { Volume2, Mic, MicOff, Star, Heart, Check, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { synth } from '../sound';

interface WordFlashcardsProps {
  isAudioEnabled: boolean;
  onAnnounce: (phrase: string) => void;
}

export const WordFlashcards: React.FC<WordFlashcardsProps> = ({
  isAudioEnabled,
  onAnnounce,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<WordCategory>('animals');
  const [activeCard, setActiveCard] = useState<VocabularyItem | null>(null);
  const [activePracticeWord, setActivePracticeWord] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [listeningFeedback, setListeningFeedback] = useState<string>('按下麥克風開始唸唸看🎤');
  const [practiceLettersMatched, setPracticeLettersMatched] = useState<boolean[]>([]);
  const [cardsStars, setCardsStars] = useState<Record<string, number>>({});

  const recognitionRef = useRef<any>(null);

  const filteredWords = VOCABULARY.filter(item => item.category === selectedCategory);

  // Initialize Speech Synthesis & Speech Recognition capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-US';

        rec.onstart = () => {
          setIsListening(true);
          setListeningFeedback('我正在聽你唸... Listening...');
        };

        rec.onerror = (e: any) => {
          console.error('Practice voice recognition error:', e);
          setIsListening(false);
          if (e.error === 'not-allowed') {
            setListeningFeedback('請允許麥克風權限以朗讀讀音哦！');
          } else {
            setListeningFeedback('沒聽清楚，我們再試一次？ Try again!');
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        rec.onresult = (event: any) => {
          const finalResult = event.results[0][0].transcript.toLowerCase().trim();
          const spokenClean = finalResult.replace(/[^a-z0-9]/g, '');
          
          if (activePracticeWord) {
            const targetClean = activePracticeWord.toLowerCase();
            
            // Log for debugging
            console.log(`Speech matches: comparing ${spokenClean} with ${targetClean}`);
            
            // 1. Full word match
            if (spokenClean === targetClean || spokenClean.includes(targetClean)) {
              handlePracticeSuccess();
              return;
            }

            // 2. See if they read any letters
            const normalizedLetters = normalizeSpokenText(finalResult);
            let updatedMatches = [...practiceLettersMatched];
            let matchedAny = false;

            for (const letter of normalizedLetters) {
              const letterIndex = activePracticeWord.split('').findIndex((char, idx) => char === letter && !updatedMatches[idx]);
              if (letterIndex !== -1) {
                updatedMatches[letterIndex] = true;
                matchedAny = true;
              }
            }

            if (matchedAny) {
              setPracticeLettersMatched(updatedMatches);
              synth.playLetterZap();
              
              // If all letters are matched after this
              const allMatched = updatedMatches.every(v => v);
              if (allMatched) {
                handlePracticeSuccess();
              } else {
                setListeningFeedback(`拼對了字母！繼續唸其他字母哦！`);
              }
            } else {
              setListeningFeedback(`你唸了 "${finalResult}"。跟著點擊 🔊 聽聽發音！`);
            }
          }
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [activePracticeWord, practiceLettersMatched]);

  const handlePracticeSuccess = () => {
    synth.playWordCleared();
    setListeningFeedback('⭐ 太優秀了！發音完全正確！ Excellent! ⭐');
    
    if (activePracticeWord) {
      setPracticeLettersMatched(Array(activePracticeWord.length).fill(true));
      setCardsStars(prev => ({
        ...prev,
        [activePracticeWord]: (prev[activePracticeWord] || 0) + 1
      }));
      
      // Speak back supportive message
      onAnnounce(`Wonderful! You pronounced ${activePracticeWord} correctly!`);
    }
  };

  const handleSpeakWord = (wordItem: VocabularyItem) => {
    synth.playTick();
    setActiveCard(wordItem);
    
    // Spelling out letters in sequence then saying the word
    const spellPhonetic = wordItem.word.split('').join(', ');
    const phrase = `${spellPhonetic}... Spells ${wordItem.word}!`;
    
    onAnnounce(phrase);

    // Setup for practice
    setActivePracticeWord(wordItem.word);
    setPracticeLettersMatched(Array(wordItem.word.length).fill(false));
    setListeningFeedback('點擊麥克風 🎙️ 試著唸出單字或字母！');
    
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const handleStartPracticeVoice = () => {
    synth.playTick();
    if (!recognitionRef.current) {
      alert('瀏覽器不支援語音辨識服務。建議搭配 Google Chrome 瀏覽器操作最流暢哦！');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech recognition failed to start:', e);
      }
    }
  };

  return (
    <div className="space-y-6" id="flashcard-system">
      <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-4 border-emerald-400" id="deck-selector-box">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 justify-center sm:justify-start">
          <BookOpen className="text-emerald-500" />
          <span className="font-sans font-black">單字點讀與發音特訓 Practice Sandbox</span>
        </h2>

        {/* Category Selection Tab Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5" id="practice-cat-tabs">
          {WORD_CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  synth.playTick();
                  setSelectedCategory(cat.id);
                  setActiveCard(null);
                  setActivePracticeWord(null);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-2xl border-2 text-sm font-bold transition duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-500 text-white border-indigo-700 shadow-[0_4px_0_#4338ca] scale-102'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
                id={`practice-tab-${cat.id}`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="practice-layout-grid">
        {/* Vocabulary Deck Scroll List */}
        <div className="lg:col-span-2 bg-sky-50 border-4 border-sky-200 rounded-[2.5rem] p-5 min-h-[400px] max-h-[550px] overflow-y-auto" id="deck-list-container">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="practice-cards-grid">
            {filteredWords.map((item, index) => {
              const points = cardsStars[item.word] || 0;
              const isActive = activePracticeWord === item.word;

              return (
                <motion.div
                  key={`${item.word}-${index}`}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSpeakWord(item)}
                  className={`bg-white rounded-[2rem] p-4 border-4 flex flex-col items-center justify-between shadow-md cursor-pointer transition relative overflow-hidden group ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-50/10 shadow-lg'
                      : 'border-slate-200 hover:border-indigo-200 hover:shadow-lg'
                  }`}
                  id={`practice-card-${item.word}`}
                >
                  {/* Category theme accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    item.category === 'animals' ? 'bg-emerald-400' :
                    item.category === 'colors' ? 'bg-purple-400' :
                    item.category === 'nature' ? 'bg-amber-400' :
                    item.category === 'daily' ? 'bg-indigo-400' : 'bg-pink-400'
                  }`} />

                  {/* Star point badges */}
                  {points > 0 && (
                    <div className="absolute top-3 right-3 flex items-center bg-yellow-100 border border-yellow-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-yellow-700 gap-0.5">
                      <Star size={10} className="fill-yellow-500 text-yellow-500" />
                      <span>{points}</span>
                    </div>
                  )}

                  <div className="text-4xl my-2 transform transition duration-300 group-hover:scale-110">
                    {item.emoji}
                  </div>
                  
                  <div className="text-center">
                    <div className="text-lg font-black font-mono tracking-wider text-slate-800">
                      {item.word}
                    </div>
                    <div className="text-xs text-gray-500 font-semibold mt-0.5">
                      {item.translation}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 w-full">
                    <button className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl py-1 text-xs font-bold flex items-center justify-center gap-1 border border-indigo-100 transition duration-150">
                      <Volume2 size={12} />
                      發音
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Selected Word Interactive Studio / Practice Room */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border-4 border-rose-400 flex flex-col justify-between" id="active-practice-studio">
          {activeCard ? (
            <div className="space-y-6 h-full flex flex-col justify-between" id="active-deck-room">
              <div className="text-center space-y-4">
                <span className="text-xs font-black text-rose-500 block uppercase tracking-widest">
                  ★ Active Word 練習單字 ★
                </span>

                {/* Big decorative emoji bubble */}
                <motion.div
                  key={activeCard.word}
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="w-24 h-24 bg-white border-4 border-rose-300 rounded-full mx-auto flex items-center justify-center text-5xl shadow-md relative"
                >
                  <span>{activeCard.emoji}</span>
                  <div className="absolute -bottom-2 bg-rose-500 text-white font-black text-xs px-2.5 py-0.5 rounded-full border-2 border-white shadow-sm">
                    {activeCard.translation}
                  </div>
                </motion.div>

                {/* Main letters breakdown block with status indicator */}
                <div className="flex justify-center gap-2 scale-110 py-2">
                  {activeCard.word.split('').map((char, index) => {
                    const isMatched = practiceLettersMatched[index];
                    return (
                      <motion.div
                        key={`${char}-${index}`}
                        animate={isMatched ? { y: [-6, 0], scale: [1, 1.1, 1] } : {}}
                        className={`w-12 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-2xl border-4 transition-all shadow-md ${
                          isMatched
                            ? 'bg-emerald-400 text-slate-900 border-emerald-600 shadow-[0_4px_0_#059669]'
                            : 'bg-white text-sky-500 border-sky-400 shadow-[0_4px_0_#38bdf8]'
                        }`}
                      >
                        {char}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Speak Helper interface panel */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-center space-y-4" id="microphone-voice-studio">
                <p className="text-xs font-semibold text-gray-600 block">
                  語音陪讀小幫手 Voice Recognition Assist
                </p>

                {/* Big cute microphone bubble button */}
                <button
                  onClick={handleStartPracticeVoice}
                  className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center border-2 shadow transition duration-200 transform hover:scale-105 active:scale-95 cursor-pointer ${
                    isListening
                      ? 'bg-red-500 text-white border-red-400 animate-pulse'
                      : 'bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white border-indigo-400'
                  }`}
                  id="btn-voice-practice"
                >
                  {isListening ? <MicOff size={32} /> : <Mic size={32} />}
                </button>

                <div className="text-sm font-bold text-slate-700 min-h-[2.5rem] flex items-center justify-center px-2">
                  <span className={isListening ? 'text-indigo-600 animate-pulse' : 'text-slate-600'}>
                    {listeningFeedback}
                  </span>
                </div>

                <div className="text-[10px] text-gray-400 bg-white border border-gray-25 px-2 py-1.5 rounded-xl flex items-center gap-1 justify-center leading-relaxed font-medium">
                  <AlertCircle size={12} className="text-indigo-400 flex-shrink-0" />
                  <span>支援拼讀！你可以大聲唸出 <b>{activeCard.word}</b>，也可按顺序大聲字母 <b>{activeCard.word.split('').join('、')}</b> 哦！</span>
                </div>
              </div>

              {/* Footer action */}
              <button
                onClick={() => {
                  synth.playTick();
                  const speakPhrase = `${activeCard.word}. Repeat after me ... ${activeCard.word}`;
                  onAnnounce(speakPhrase);
                }}
                className="w-full bg-slate-100 text-slate-700 font-bold text-sm py-2 px-3 rounded-2xl border border-slate-200/80 hover:bg-slate-200/50 flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer"
              >
                <Volume2 size={16} />
                <span>唸給我聽 Hear pronunciation</span>
              </button>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center text-center p-6 text-gray-400 space-y-4" id="practice-empty-box">
              <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-dashed border-slate-200 text-3xl">
                🧸
              </div>
              <div className="space-y-1">
                <p className="font-bold text-gray-700 text-sm">單字互動點讀模式</p>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed font-semibold">
                  點擊左邊任意一個氣球單字卡，和 Barney 一起邊聽邊練習讀音吧！
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

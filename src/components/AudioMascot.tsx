import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, Sparkles, Smile, Star } from 'lucide-react';

interface AudioMascotProps {
  status: 'idle' | 'listening' | 'success' | 'error' | 'thinking';
  transcript: string;
  assistantMessage: string;
  micPermissionGranted: boolean | null;
  onToggleMic?: () => void;
  isAudioEnabled?: boolean;
  onToggleAudio?: () => void;
}

export const AudioMascot: React.FC<AudioMascotProps> = ({
  status,
  transcript,
  assistantMessage,
  micPermissionGranted,
  onToggleMic,
  isAudioEnabled = true,
  onToggleAudio,
}) => {
  const [mascotEmoji, setMascotEmoji] = useState('🐻');
  const [mascotName, setMascotName] = useState('Barney');
  const [waveBars, setWaveBars] = useState<number[]>([15, 15, 15, 15, 15]);

  // Rotate fun mascots if desired, otherwise stick to standard Barney the cuddly study bear
  useEffect(() => {
    switch (status) {
      case 'listening':
        setMascotEmoji('🐨'); // Curious koala listening
        break;
      case 'success':
        setMascotEmoji('🦁'); // Proud happy lion
        break;
      case 'error':
        setMascotEmoji('🐼'); // Puzzled soft panda helper
        break;
      case 'thinking':
        setMascotEmoji('🦊'); // Intelligent helper fox
        break;
      default:
        setMascotEmoji('🐻'); // Barney the teddy bear
        break;
    }
  }, [status]);

  // Animate speech visualizer waves when actively listening
  useEffect(() => {
    let interval: any;
    if (status === 'listening') {
      interval = setInterval(() => {
        setWaveBars(
          Array.from({ length: 6 }, () => Math.floor(Math.random() * 32) + 8)
        );
      }, 100);
    } else {
      setWaveBars([15, 15, 15, 15, 15, 15]);
    }
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-white/95 backdrop-blur shadow-lg border border-pink-100 p-4 rounded-3xl max-w-full md:max-w-xl mx-auto transition-all" id="audio-mascot-container">
      {/* Mascot Visual avatar */}
      <div className="relative flex-shrink-0">
        <motion.div
          animate={
            status === 'listening'
              ? { scale: [1, 1.05, 1], y: [0, -3, 0] }
              : status === 'success'
              ? { scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }
              : { y: [0, -2, 0] }
          }
          transition={{
            repeat: status === 'listening' ? Infinity : 0,
            duration: status === 'listening' ? 1.5 : 0.6,
            ease: 'easeInOut',
          }}
          className="w-20 h-20 bg-gradient-to-tr from-pink-100 to-indigo-100 rounded-full flex items-center justify-center text-5xl shadow-inner border border-white relative cursor-pointer group"
          onClick={onToggleMic}
          id="mascot-avatar"
        >
          <span>{mascotEmoji}</span>

          {/* Active status indicator badge */}
          <div className="absolute -bottom-1 -right-1 flex gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                micPermissionGranted === false
                  ? 'bg-red-500'
                  : status === 'listening'
                  ? 'bg-green-500 animate-pulse'
                  : 'bg-indigo-500'
              }`}
            >
              {micPermissionGranted === false ? (
                <MicOff size={12} className="text-white" />
              ) : (
                <Mic size={12} className="text-white" />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Speech Chat Bubble and status info */}
      <div className="flex-1 min-w-0 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
          <span className="text-sm font-bold text-gray-800 tracking-wide bg-gray-100/80 px-2 py-0.5 rounded-full" id="mascot-name-badge">
            {mascotName}
          </span>
          
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 border ${
              status === 'listening'
                ? 'bg-green-50 text-green-700 border-green-200 animate-pulse'
                : status === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
            id="mascot-status-badge"
          >
            {status === 'listening' ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-ping" />
                正在聽聲音... Listening
              </>
            ) : status === 'success' ? (
              <>
                <Sparkles size={12} className="text-yellow-500 animate-spin" />
                好棒！答對了！
              </>
            ) : (
              <>準備好囉 Ready</>
            )}
          </span>
        </div>

        {/* Real-time speech balloon content */}
        <div className="relative bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm text-gray-700 font-medium min-h-[3.5rem] flex flex-col justify-center shadow-inner" id="mascot-bubble">
          {/* Solder clip for Speech Bubbles pointing left on desktop, top on mobile */}
          <div className="hidden md:block absolute left-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-50 border-l border-b border-gray-100 rotate-45" />
          <div className="md:hidden absolute top-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-50 border-t border-l border-gray-100 rotate-45" />

          <p className="leading-snug text-slate-800" id="assistant-primary-msg">
            {assistantMessage}
          </p>

          {/* Subtext showing current live raw speech transcript */}
          <AnimatePresence mode="popLayout">
            {transcript && (
              <motion.p
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-indigo-500 font-mono mt-1 italic font-semibold border-t border-dashed border-gray-200 pt-1 flex items-center justify-center md:justify-start gap-1"
                id="voice-raw-transcript"
              >
                <span>🎙️ 聽到了：</span>
                <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded tracking-wider uppercase">
                  "{transcript}"
                </span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Buttons to manually manage audio volume output and microphone toggle */}
      <div className="flex flex-row md:flex-col gap-2 justify-center mt-1 md:mt-0" id="mascot-control-bar">
        {onToggleMic && (
          <button
            onClick={onToggleMic}
            className={`p-2.5 rounded-2xl shadow hover:shadow-md transition duration-200 flex items-center justify-center border ${
              status === 'listening'
                ? 'bg-red-500 text-white border-red-400 hover:bg-red-600'
                : 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
            }`}
            title={status === 'listening' ? '暫停麥克風' : '開啟麥克風'}
            id="btn-toggle-microphone"
          >
            {status === 'listening' ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {onToggleAudio && (
          <button
            onClick={onToggleAudio}
            className={`p-2.5 rounded-2xl shadow hover:shadow-md transition duration-200 flex items-center justify-center border ${
              isAudioEnabled
                ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
            }`}
            title={isAudioEnabled ? '關閉遊戲聲音' : '開啟遊戲聲音'}
            id="btn-toggle-synth"
          >
            <Volume2 size={18} className={isAudioEnabled ? 'animate-bounce' : ''} />
          </button>
        )}
      </div>

      {/* Visual audio wave visualizer */}
      {status === 'listening' && (
        <div className="hidden lg:flex items-center gap-1 p-2" id="speech-wave-visualization">
          {waveBars.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: `${h}px` }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              className="w-1.5 bg-gradient-to-t from-indigo-500 to-pink-500 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};

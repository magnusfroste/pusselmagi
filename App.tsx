import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Theme, Piece, PlayerStats } from './types';
import { generatePraise, getThemeImagePrompt } from './services/geminiService';
import { PuzzlePiece } from './components/PuzzlePiece';
import { Confetti } from './components/Confetti';
import { Play, Star, Trophy, ArrowLeft, RefreshCw, Volume2, VolumeX, Eye, EyeOff, Loader2, Lock, Unlock, Calculator } from 'lucide-react';

// -- Constants --
const THEMES: { id: Theme; label: string; color: string; icon: string }[] = [
  { id: 'animals', label: 'Djur', color: 'bg-orange-500', icon: '🦁' },
  { id: 'space', label: 'Rymden', color: 'bg-indigo-600', icon: '🚀' },
  { id: 'nature', label: 'Natur', color: 'bg-emerald-500', icon: '🌲' },
  { id: 'fantasy', label: 'Sagor', color: 'bg-purple-600', icon: '🦄' },
];

const DIFFICULTY_LEVELS = [
  { id: '2x2', rows: 2, cols: 2, label: 'Lätt', sub: '4 bitar', reward: 10, color: 'bg-lime-500 ring-lime-400' },
  { id: '2x3', rows: 2, cols: 3, label: 'Klurig', sub: '6 bitar', reward: 15, color: 'bg-green-500 ring-green-400' },
  { id: '3x3', rows: 3, cols: 3, label: 'Medel', sub: '9 bitar', reward: 25, color: 'bg-teal-500 ring-teal-400' },
  { id: '3x4', rows: 3, cols: 4, label: 'Utmaning', sub: '12 bitar', reward: 35, color: 'bg-cyan-600 ring-cyan-500' },
  { id: '4x4', rows: 4, cols: 4, label: 'Svår', sub: '16 bitar', reward: 50, color: 'bg-blue-600 ring-blue-500' },
  { id: '4x5', rows: 4, cols: 5, label: 'Mästare', sub: '20 bitar', reward: 75, color: 'bg-indigo-600 ring-indigo-500' },
  { id: '5x5', rows: 5, cols: 5, label: 'Expert', sub: '25 bitar', reward: 100, color: 'bg-purple-600 ring-purple-500' },
  { id: '6x6', rows: 6, cols: 6, label: 'Legend', sub: '36 bitar', reward: 150, color: 'bg-fuchsia-600 ring-fuchsia-500' },
];

const SNAP_THRESHOLD = 15; // Percent

// -- Singleton Audio Context for iOS Compatibility --
let globalAudioCtx: AudioContext | null = null;

const initAudio = () => {
  if (!globalAudioCtx) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
      globalAudioCtx = new AudioContext();
    }
  }
  // iOS requires resuming context after user interaction
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume();
  }
  return globalAudioCtx;
};

const playSound = (type: 'snap' | 'win' | 'click' | 'unlock' | 'error') => {
  try {
    const ctx = initAudio();
    if (!ctx) return;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'snap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } else if (type === 'unlock') {
      // Mechanical unlock sound (using the main oscillator)
      osc.type = 'square';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);

      // Magical Sparkles (additional oscillators)
      const now = ctx.currentTime;
      [1046.50, 1318.51, 1568.0, 2093.00].forEach((freq, i) => {
         const sparkOsc = ctx.createOscillator();
         const sparkGain = ctx.createGain();
         sparkOsc.connect(sparkGain);
         sparkGain.connect(ctx.destination);
         
         sparkOsc.type = 'sine';
         sparkOsc.frequency.value = freq;
         
         const startTime = now + 0.1 + (i * 0.06);
         sparkGain.gain.setValueAtTime(0, startTime);
         sparkGain.gain.linearRampToValueAtTime(0.05, startTime + 0.05); // low volume for high pitch
         sparkGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.0);
         
         sparkOsc.start(startTime);
         sparkOsc.stop(startTime + 1.0);
      });
    } else if (type === 'win') {
      // Simple arpeggio
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const oscNode = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscNode.type = 'triangle';
        oscNode.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0, now + i * 0.1);
        gainNode.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
        
        oscNode.start(now + i * 0.1);
        oscNode.stop(now + i * 0.1 + 0.5);
      });
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export default function App() {
  // -- State --
  const [screen, setScreen] = useState<'menu' | 'theme' | 'game' | 'win'>('menu');
  const [theme, setTheme] = useState<Theme>('animals');
  const [gridConfig, setGridConfig] = useState({ rows: 2, cols: 2 });
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [imgUrl, setImgUrl] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [stats, setStats] = useState<PlayerStats>({ totalScore: 0, stars: 0, completedPuzzles: 0, highestUnlockedLevelIndex: 0 });
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [praise, setPraise] = useState('');
  const [loadingPraise, setLoadingPraise] = useState(false);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [justUnlockedLevel, setJustUnlockedLevel] = useState(false);

  // Math Challenge State
  const [showMathModal, setShowMathModal] = useState(false);
  const [pendingLevelIndex, setPendingLevelIndex] = useState<number | null>(null);
  const [mathProblem, setMathProblem] = useState({ q: '', a: 0 });
  const [mathInput, setMathInput] = useState('');
  
  // Refs for Drag Logic
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerOffset = useRef({ x: 0, y: 0 });
  const timerRef = useRef<number | null>(null);
  const mathInputRef = useRef<HTMLInputElement>(null);

  // -- Initialization --
  useEffect(() => {
    const savedStats = localStorage.getItem('pusselMagiStats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      // Backwards compatibility for stats without highestUnlockedLevelIndex
      if (typeof parsed.highestUnlockedLevelIndex === 'undefined') {
        parsed.highestUnlockedLevelIndex = 0;
      }
      setStats(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pusselMagiStats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (showMathModal && mathInputRef.current) {
      mathInputRef.current.focus();
    }
  }, [showMathModal]);

  // -- Game Logic --

  const handleLevelSelect = (selectedTheme: Theme, levelIndex: number) => {
    if (levelIndex <= stats.highestUnlockedLevelIndex) {
      // Level is unlocked
      const lvl = DIFFICULTY_LEVELS[levelIndex];
      startGame(selectedTheme, lvl.rows, lvl.cols);
    } else {
      // Level is locked - Show Math Challenge
      if (!isMuted) playSound('click');
      const num1 = Math.floor(Math.random() * 8) + 2; // 2-9
      const num2 = Math.floor(Math.random() * 8) + 2; // 2-9
      setMathProblem({ q: `${num1} x ${num2}`, a: num1 * num2 });
      setPendingLevelIndex(levelIndex);
      setMathInput('');
      setShowMathModal(true);
    }
  };

  const verifyMathAnswer = () => {
    if (parseInt(mathInput) === mathProblem.a && pendingLevelIndex !== null) {
      if (!isMuted) playSound('unlock');
      // Unlock up to this level
      setStats(prev => ({
        ...prev,
        highestUnlockedLevelIndex: Math.max(prev.highestUnlockedLevelIndex, pendingLevelIndex)
      }));
      setShowMathModal(false);
      
      // Start the game immediately
      const lvl = DIFFICULTY_LEVELS[pendingLevelIndex];
      startGame(theme, lvl.rows, lvl.cols);
    } else {
      if (!isMuted) playSound('error');
      // Shake animation logic could go here
      setMathInput('');
    }
  };

  const startGame = useCallback((selectedTheme: Theme, rows: number, cols: number) => {
    if (!isMuted) playSound('click');
    setTheme(selectedTheme);
    setGridConfig({ rows, cols });
    setScreen('game');
    setIsPlaying(false); // Wait for image load
    setImageLoaded(false);
    setTimeElapsed(0);
    setPraise('');
    setShowHint(false);
    setJustUnlockedLevel(false);
    
    // Generate Image URL
    const seed = Math.random().toString(36).substring(7);
    const baseSize = 800;
    const aspect = cols / rows;
    const imgW = aspect >= 1 ? baseSize : Math.round(baseSize * aspect);
    const imgH = aspect >= 1 ? Math.round(baseSize / aspect) : baseSize;
    const newImgUrl = `https://picsum.photos/seed/${seed}${selectedTheme}/${imgW}/${imgH}`;
    setImgUrl(newImgUrl);

    // Create Pieces
    const newPieces: Piece[] = [];
    const pieceWidth = 100 / cols;
    const pieceHeight = 100 / rows;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        newPieces.push({
          id: y * cols + x,
          correctX: x * pieceWidth,
          correctY: y * pieceHeight,
          // Random start position
          currentX: Math.random() * (100 - pieceWidth),
          currentY: Math.random() * (100 - pieceHeight),
          isPlaced: false,
        });
      }
    }
    setPieces(newPieces);
  }, [isMuted, theme]);

  // Handle Image Load
  const handleImageLoad = () => {
    setImageLoaded(true);
    setIsPlaying(true);
    if (timerRef.current) clearInterval(timerRef.current);
    // @ts-ignore
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
  };

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    const piece = pieces.find(p => p.id === id);
    if (!piece || piece.isPlaced || !boardRef.current) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const boardRect = boardRef.current.getBoundingClientRect();
    const clickXPercent = ((e.clientX - boardRect.left) / boardRect.width) * 100;
    const clickYPercent = ((e.clientY - boardRect.top) / boardRect.height) * 100;
    pointerOffset.current = {
      x: clickXPercent - piece.currentX,
      y: clickYPercent - piece.currentY
    };
    setDraggingId(id);
    if (!isMuted) playSound('click');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingId === null || !boardRef.current) return;
    e.preventDefault();
    const boardRect = boardRef.current.getBoundingClientRect();
    const xPercent = ((e.clientX - boardRect.left) / boardRect.width) * 100;
    const yPercent = ((e.clientY - boardRect.top) / boardRect.height) * 100;
    const pieceWidth = 100 / gridConfig.cols;
    const pieceHeight = 100 / gridConfig.rows;
    let newX = xPercent - pointerOffset.current.x;
    let newY = yPercent - pointerOffset.current.y;
    newX = Math.max(0, Math.min(100 - pieceWidth, newX));
    newY = Math.max(0, Math.min(100 - pieceHeight, newY));
    setPieces(prev => prev.map(p => 
      p.id === draggingId ? { ...p, currentX: newX, currentY: newY } : p
    ));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId === null) return;
    const piece = pieces.find(p => p.id === draggingId);
    if (piece) {
      const dist = Math.sqrt(
        Math.pow(piece.currentX - piece.correctX, 2) + 
        Math.pow(piece.currentY - piece.correctY, 2)
      );
      if (dist < SNAP_THRESHOLD) {
        setPieces(prev => prev.map(p => 
          p.id === draggingId ? { ...p, currentX: p.correctX, currentY: p.correctY, isPlaced: true } : p
        ));
        if (navigator.vibrate) navigator.vibrate(50);
        if (!isMuted) playSound('snap');
      }
    }
    setDraggingId(null);
  };

  // Check Win Condition
  useEffect(() => {
    if (pieces.length > 0 && pieces.every(p => p.isPlaced) && isPlaying) {
      handleWin();
    }
  }, [pieces, isPlaying]);

  const handleWin = async () => {
    setIsPlaying(false);
    if (!isMuted) playSound('win');
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Calculate Score
    const currentLevelIndex = DIFFICULTY_LEVELS.findIndex(l => l.rows === gridConfig.rows && l.cols === gridConfig.cols);
    const levelConfig = DIFFICULTY_LEVELS[currentLevelIndex] || DIFFICULTY_LEVELS[0];
    const totalPieces = gridConfig.rows * gridConfig.cols;
    const timeBonus = Math.max(10, 100 - timeElapsed); 
    const roundScore = levelConfig.reward + timeBonus;
    const parTime = totalPieces * 5; 
    let stars = 1;
    if (timeElapsed < parTime) stars = 3;
    else if (timeElapsed < parTime * 2) stars = 2;

    // Progression Logic
    let unlockedNew = false;
    let nextLevelIndex = stats.highestUnlockedLevelIndex;
    
    // If we completed the highest currently unlocked level, unlock the next one
    if (currentLevelIndex === stats.highestUnlockedLevelIndex && currentLevelIndex < DIFFICULTY_LEVELS.length - 1) {
       unlockedNew = true;
       nextLevelIndex = currentLevelIndex + 1;
       setJustUnlockedLevel(true);
       if (!isMuted) setTimeout(() => playSound('unlock'), 1000); // Delayed sound for unlock
    }

    const newStats = {
      totalScore: stats.totalScore + roundScore,
      completedPuzzles: stats.completedPuzzles + 1,
      stars: stats.stars + stars,
      highestUnlockedLevelIndex: nextLevelIndex
    };
    
    setStats(newStats);
    setScreen('win');

    setLoadingPraise(true);
    const praiseText = await generatePraise(theme, timeElapsed, gridConfig.rows, gridConfig.cols);
    setPraise(praiseText);
    setLoadingPraise(false);
  };

  // -- Render Helpers --

  const MathModal = () => {
     if (!showMathModal) return null;
     return (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in touch-none">
         <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl border-4 border-indigo-500">
           <div className="bg-indigo-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
             <Calculator size={40} className="text-indigo-600" />
           </div>
           <h3 className="text-2xl font-bold text-slate-800 mb-2">Lås upp nivån</h3>
           <p className="text-slate-600 mb-6">Är du redo för en större utmaning? Lös mattefrågan!</p>
           
           <div className="text-4xl font-black text-indigo-600 mb-6 font-mono">
             {mathProblem.q} = ?
           </div>
           
           <input 
             ref={mathInputRef}
             type="number" 
             pattern="\d*"
             value={mathInput}
             onChange={(e) => setMathInput(e.target.value)}
             className="w-full text-center text-3xl p-4 border-4 border-slate-200 rounded-xl mb-6 focus:border-indigo-500 outline-none text-slate-800 font-bold"
             placeholder="Svar"
             onKeyDown={(e) => e.key === 'Enter' && verifyMathAnswer()}
           />
           
           <div className="flex gap-4">
             <button 
               onClick={() => setShowMathModal(false)}
               className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-xl font-bold"
             >
               Avbryt
             </button>
             <button 
               onClick={verifyMathAnswer}
               className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg active:scale-95 transition"
             >
               Lås upp
             </button>
           </div>
         </div>
       </div>
     );
  };

  const MenuScreen = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 p-4 animate-fade-in text-center scroll-container">
      <h1 className="text-5xl sm:text-7xl font-black text-yellow-300 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] mb-8 tracking-wider transform -rotate-2">
        PusselMagi
      </h1>
      
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border-4 border-white/30">
        <div className="flex justify-around mb-8">
            <div className="flex flex-col items-center text-yellow-300">
                <Star size={40} fill="currentColor" />
                <span className="font-bold text-xl">{stats.stars}</span>
            </div>
             <div className="flex flex-col items-center text-yellow-300">
                <Trophy size={40} fill="currentColor" />
                <span className="font-bold text-xl">{stats.completedPuzzles}</span>
            </div>
             <div className="flex flex-col items-center text-yellow-300">
                <div className="text-2xl font-black">{stats.totalScore}</div>
                <span className="text-xs font-bold text-blue-100 uppercase">Poäng</span>
            </div>
        </div>

        <button 
          onClick={() => { 
            // Crucial for iOS: Initialize audio on first user gesture
            if(!isMuted) {
              initAudio(); 
              playSound('click'); 
            }
            setScreen('theme'); 
          }}
          className="w-full bg-green-500 hover:bg-green-400 text-white text-3xl font-black py-6 rounded-2xl shadow-[0_8px_0_rgb(21,128,61)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-4 group"
        >
          <Play size={36} className="group-hover:scale-125 transition-transform" fill="currentColor"/>
          SPELA
        </button>

        <p className="mt-6 text-blue-100 font-medium opacity-80">Ett magiskt äventyr för små genier</p>
      </div>
      <button onClick={() => { initAudio(); setIsMuted(!isMuted); }} className="absolute top-4 right-4 p-3 bg-white/20 rounded-full hover:bg-white/30 text-white z-50">
        {isMuted ? <VolumeX /> : <Volume2 />}
      </button>
    </div>
  );

  const ThemeScreen = () => (
    <div className="flex flex-col min-h-screen bg-slate-900 p-4">
      {showMathModal && <MathModal />}
      <div className="flex items-center mb-6">
        <button onClick={() => { if(!isMuted) playSound('click'); setScreen('menu'); }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 active:scale-95 transition">
          <ArrowLeft size={32} />
        </button>
        <div className="ml-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white leading-none">Välj Utmaning</h2>
          <p className="text-slate-400 text-sm">Klura ut pusslet för att nå nästa nivå!</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 content-start overflow-y-auto pb-8 scroll-container">
        {THEMES.map(t => (
          <div key={t.id} className="flex flex-col gap-3 p-4 bg-slate-800/50 rounded-3xl border-2 border-white/5 shadow-xl">
             <div className={`h-20 ${t.color} rounded-2xl flex items-center justify-center gap-4 shadow-inner mb-2`}>
               <span className="text-5xl drop-shadow-md">{t.icon}</span>
               <h3 className="text-3xl font-black text-white/90 tracking-wide uppercase">{t.label}</h3>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {DIFFICULTY_LEVELS.map((lvl, index) => {
                  const isLocked = index > stats.highestUnlockedLevelIndex;
                  return (
                    <button
                      key={lvl.id}
                      onClick={() => handleLevelSelect(t.id, index)}
                      className={`
                        relative overflow-hidden
                        ${isLocked ? 'bg-slate-700 opacity-80 cursor-pointer' : `${lvl.color} cursor-pointer`} 
                        py-3 px-2 rounded-xl transition transform 
                        ${!isLocked ? 'hover:scale-105 active:scale-95 hover:bg-opacity-100 bg-opacity-90 shadow-lg' : 'hover:bg-slate-600'}
                        border-b-4 border-black/20 flex flex-col items-center justify-center h-20 text-white
                      `}
                    >
                      {isLocked ? (
                        <>
                          <Lock className="mb-1 text-slate-400" size={24} />
                          <span className="text-xs font-bold text-slate-400">Låst</span>
                        </>
                      ) : (
                        <>
                          <span className="font-bold text-sm sm:text-base leading-tight">{lvl.label}</span>
                          <span className="text-[10px] sm:text-xs opacity-90">{lvl.sub}</span>
                          <div className="mt-1 flex gap-1">
                            {Array.from({ length: Math.ceil((lvl.rows * lvl.cols) / 10) }).map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60"></div>
                            ))}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
             </div>
          </div>
        ))}
      </div>
    </div>
  );

  const GameScreen = () => {
    // Calculate styles for the responsive board
    const aspectRatio = gridConfig.cols / gridConfig.rows;
    
    return (
    <div className="flex flex-col h-screen bg-slate-800 touch-none overflow-hidden fixed inset-0">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-slate-900 shadow-md z-20">
        <button onClick={() => { if(!isMuted) playSound('click'); setScreen('theme'); }} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition">
           <ArrowLeft size={24} />
        </button>
        <div className="flex gap-2 items-center">
             <div className="flex gap-2 font-mono font-bold text-xl text-yellow-400 bg-black/30 px-4 py-2 rounded-lg">
                <span>⏱️ {timeElapsed}s</span>
             </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowHint(!showHint)} 
                className={`p-3 rounded-xl transition ${showHint ? 'bg-yellow-400 text-slate-900' : 'bg-white/10 text-white'}`}
                title="Visa bild"
            >
                {showHint ? <Eye size={24} /> : <EyeOff size={24} />}
            </button>
            <button onClick={() => startGame(theme, gridConfig.rows, gridConfig.cols)} className="p-3 bg-white/10 rounded-xl hover:bg-white/20 active:scale-95 transition">
               <RefreshCw size={24} />
            </button>
        </div>
      </div>

      {/* Board Container */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden bg-slate-800/50">
          
          {/* Loading Indicator */}
          {!imageLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-slate-800 text-white">
                  <Loader2 size={48} className="animate-spin text-blue-400 mb-4" />
                  <p className="font-bold text-lg animate-pulse">Laddar pusslet...</p>
                  {/* Hidden image to trigger load */}
                  <img src={imgUrl} alt="preload" className="hidden" onLoad={handleImageLoad} onError={handleImageLoad} />
              </div>
          )}

          {/* Guide Image (Ghost) */}
          <div 
            className="absolute pointer-events-none filter grayscale transition-all duration-500" 
            style={{
               width: `min(90vw, ${90 * aspectRatio}vh)`,
               height: `min(75vh, ${75 / aspectRatio}vw)`,
               maxWidth: '90vw',
               maxHeight: '75vh',
               aspectRatio: `${aspectRatio}`,
               backgroundImage: `url(${imgUrl})`,
               backgroundSize: 'cover',
               opacity: showHint ? 0.4 : 0.05
            }}
          />

          <div 
            ref={boardRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`relative shadow-2xl rounded-lg border-4 border-slate-600 box-content mx-auto transition-opacity duration-500 ${!imageLoaded ? 'opacity-0' : 'opacity-100'} bg-slate-700/50`}
            style={{
              // Dynamic sizing to maintain aspect ratio and fit in viewport
              width: `min(90vw, ${75 * aspectRatio}vh)`,
              height: `min(75vh, ${90 / aspectRatio}vw)`,
              // Fallbacks/Constraints
              maxWidth: '90vw',
              maxHeight: '75vh',
              aspectRatio: `${gridConfig.cols} / ${gridConfig.rows}`,
            }}
          >
             {/* Grid lines for visual help */}
             <div className="absolute inset-0 grid pointer-events-none opacity-20 border-white/10"
                style={{
                  gridTemplateColumns: `repeat(${gridConfig.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${gridConfig.rows}, 1fr)`,
                }}
             >
                {Array.from({length: gridConfig.rows * gridConfig.cols}).map((_, i) => (
                   <div key={i} className="border border-white/30" />
                ))}
             </div>

             {/* Pieces */}
             {pieces.map(piece => (
               <PuzzlePiece 
                 key={piece.id} 
                 piece={piece} 
                 imgUrl={imgUrl}
                 rows={gridConfig.rows}
                 cols={gridConfig.cols}
                 containerSize={boardRef.current?.offsetWidth || 0}
                 onPointerDown={handlePointerDown}
                 isDragging={draggingId === piece.id}
               />
             ))}
          </div>
      </div>
    </div>
    );
  };

  const WinScreen = () => {
    // Calculate stars for display
    const totalPieces = gridConfig.rows * gridConfig.cols;
    const parTime = totalPieces * 5; 
    let earnedStars = 1;
    if (timeElapsed < parTime) earnedStars = 3;
    else if (timeElapsed < parTime * 2) earnedStars = 2;

    return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in text-center scroll-container">
      <Confetti />
      
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl transform transition-all scale-100 border-4 border-yellow-400">
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-400 p-4 rounded-full border-4 border-white shadow-xl">
           <Trophy size={48} className="text-white animate-bounce" />
        </div>

        <h2 className="text-4xl font-black text-slate-800 mt-8 mb-2">Pussel Klarat!</h2>
        
        {justUnlockedLevel && (
           <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-yellow-900 px-4 py-2 rounded-full font-bold mb-4 animate-bounce inline-block shadow-lg">
             🎉 NY NIVÅ UPPLÅST! 🎉
           </div>
        )}

        <div className="flex justify-center gap-2 mb-6">
           {Array.from({length: 3}).map((_, i) => (
             <Star 
               key={i} 
               size={48} 
               className={`${i < earnedStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} transition-all delay-${i*200} duration-500`}
             />
           ))}
        </div>

        <div className="bg-blue-50 p-6 rounded-xl mb-6 min-h-[100px] flex items-center justify-center">
           {loadingPraise ? (
             <div className="flex items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="animate-spin" size={20}/>
                <span>Magikern tänker...</span>
             </div>
           ) : (
             <p className="text-xl font-bold text-blue-800 italic animate-pop">"{praise}"</p>
           )}
        </div>

        <div className="grid grid-cols-2 gap-4">
           <button 
             onClick={() => { if(!isMuted) playSound('click'); setScreen('theme'); }} 
             className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-xl transition"
           >
             Meny
           </button>
           <button 
             onClick={() => startGame(theme, gridConfig.rows, gridConfig.cols)} 
             className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-1 transition"
           >
             Spela Igen
           </button>
        </div>
      </div>
    </div>
    );
  };

  return (
    <>
      {screen === 'menu' && <MenuScreen />}
      {screen === 'theme' && <ThemeScreen />}
      {screen === 'game' && <GameScreen />}
      {screen === 'win' && (
        <>
          {/* Show the game behind the overlay */}
          <GameScreen />
          <WinScreen />
        </>
      )}
    </>
  );
}
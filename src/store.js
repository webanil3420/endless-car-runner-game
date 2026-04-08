import { create } from 'zustand'

const getGuestId = () => {
  let id = localStorage.getItem('guestId')
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('guestId', id)
  }
  return id
}

export const useGameStore = create((set, get) => ({
  speed: 0,
  baseSpeed: 0,
  score: 0,
  coins: 0,
  distance: 0,
  gameState: 'start',
  gameId: 0,
  playerPos: { x: 0, z: 0 },
  controls: {
    forward: false,
    backward: false,
    left: false,
    right: false,
  },
  cameraMode: 'follow', // 'follow', 'top', 'first'
  guestId: getGuestId(),
  leaderboard: [],
  apiLoading: false,
  apiError: null,
  
  startGame: () => set((state) => ({ gameState: 'playing', score: 0, coins: 0, distance: 0, speed: 0, playerPos: { x: 0, z: 0 }, gameId: state.gameId + 1 })),
  setControl: (key, value) => set((state) => ({
    controls: { ...state.controls, [key]: value }
  })),
  cycleCamera: () => set((state) => {
    const modes = ['follow', 'top', 'first']
    const currentIdx = modes.indexOf(state.cameraMode)
    return { cameraMode: modes[(currentIdx + 1) % modes.length] }
  }),
  gameOver: async () => {
    set({ gameState: 'gameover' });
    
    // Play synthesized crash sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) { /* ignore audio error */ }

    const state = get();
    // Fire and forget save score to backend
    try {
      set({ apiLoading: true, apiError: null });
      await fetch('http://localhost:5000/api/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: state.guestId,
          score: state.score,
          coins: state.coins,
          distance: Math.floor(state.distance)
        })
      });
      // Fetch updated leaderboard
      const res = await fetch('http://localhost:5000/api/leaderboard');
      const data = await res.json();
      set({ leaderboard: data, apiLoading: false });
    } catch(err) {
      set({ apiError: 'Failed to connect to backend.', apiLoading: false });
      console.error(err);
    }
  },
  fetchLeaderboard: async () => {
    try {
      set({ apiLoading: true, apiError: null });
      const res = await fetch('http://localhost:5000/api/leaderboard');
      const data = await res.json();
      set({ leaderboard: data, apiLoading: false });
    } catch(err) {
      set({ apiError: 'Failed to connect to backend.', apiLoading: false });
      console.error(err);
    }
  },
  togglePause: () => set((state) => ({
    gameState: state.gameState === 'playing' ? 'paused' : (state.gameState === 'paused' ? 'playing' : state.gameState)
  })),
  addCoin: () => {
    // Play synthesized coin sound
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch(e) { /* ignore */ }
    
    set((state) => ({ coins: state.coins + 1 }));
  },
  
  updateScoreAndDistance: (dist) => set((state) => {
    return {
      distance: state.distance + dist,
      score: Math.floor(state.distance + state.coins * 10),
      // Prevent automatically overriding speed since the player now controls it manually
      speed: state.speed
    }
  }),
}))

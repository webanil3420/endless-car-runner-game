import { create } from 'zustand'

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
  
  startGame: () => set((state) => ({ gameState: 'playing', score: 0, coins: 0, distance: 0, speed: 0, playerPos: { x: 0, z: 0 }, gameId: state.gameId + 1 })),
  setControl: (key, value) => set((state) => ({
    controls: { ...state.controls, [key]: value }
  })),
  cycleCamera: () => set((state) => {
    const modes = ['follow', 'top', 'first']
    const currentIdx = modes.indexOf(state.cameraMode)
    return { cameraMode: modes[(currentIdx + 1) % modes.length] }
  }),
  gameOver: () => set({ gameState: 'gameover' }),
  togglePause: () => set((state) => ({
    gameState: state.gameState === 'playing' ? 'paused' : (state.gameState === 'paused' ? 'playing' : state.gameState)
  })),
  addCoin: () => set((state) => ({ coins: state.coins + 1 })),
  
  updateScoreAndDistance: (dist) => set((state) => {
    return {
      distance: state.distance + dist,
      score: Math.floor(state.distance + state.coins * 10),
      // Prevent automatically overriding speed since the player now controls it manually
      speed: state.speed
    }
  }),
}))

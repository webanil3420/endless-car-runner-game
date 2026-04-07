import React, { Suspense, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Sky, ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei'
import { useGameStore } from './store'

import { Player } from './components/Player'
import { RoadManager } from './components/RoadManager'
import { TrafficManager } from './components/TrafficManager'

function HUD() {
  const { speed, score, coins, distance, gameState, startGame, setControl } = useGameStore()

  const handleTouchStart = (key) => setControl(key, true)
  const handleTouchEnd = (key) => setControl(key, false)

  return (
    <div className="ui-container">
      {/* Top HUD */}
      <div className="hud-top">
        <div style={{ display: 'flex', gap: '15px' }}>
          <button className="pause-btn" onClick={useGameStore.getState().togglePause}>
            {gameState === 'paused' ? '▶' : '||'}
          </button>
          <button className="pause-btn" onClick={useGameStore.getState().cycleCamera} style={{ fontSize: '12px' }}>CAM</button>
        </div>
        <div className="hud-panel score-display">
          <div className="score-item">
            <span className="score-label">Coins</span>
            <span className="score-value" style={{ color: '#ffd700' }}>{coins}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Score</span>
            <span className="score-value">{score}</span>
          </div>
          <div className="score-item">
            <span className="score-label">Distance</span>
            <span className="score-value">{Math.floor(distance)}m</span>
          </div>
        </div>
      </div>

      {/* Speedometer */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="speedometer">
          <span className="speed-value">{Math.floor(speed * 2)}</span>
          <span className="speed-unit">KM/H</span>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="on-screen-controls">
          <div className="control-group">
            <button
              className="control-btn"
              onMouseDown={() => handleTouchStart('left')}
              onMouseUp={() => handleTouchEnd('left')}
              onMouseLeave={() => handleTouchEnd('left')}
              onTouchStart={() => handleTouchStart('left')}
              onTouchEnd={() => handleTouchEnd('left')}
            >L</button>
            <button
              className="control-btn"
              onMouseDown={() => handleTouchStart('right')}
              onMouseUp={() => handleTouchEnd('right')}
              onMouseLeave={() => handleTouchEnd('right')}
              onTouchStart={() => handleTouchStart('right')}
              onTouchEnd={() => handleTouchEnd('right')}
            >R</button>
          </div>
          <div className="control-group">
            <button
              className="control-btn brake"
              onMouseDown={() => handleTouchStart('backward')}
              onMouseUp={() => handleTouchEnd('backward')}
              onMouseLeave={() => handleTouchEnd('backward')}
              onTouchStart={() => handleTouchStart('backward')}
              onTouchEnd={() => handleTouchEnd('backward')}
            >BRAKE</button>
            <button
              className="control-btn acc"
              onMouseDown={() => handleTouchStart('forward')}
              onMouseUp={() => handleTouchEnd('forward')}
              onMouseLeave={() => handleTouchEnd('forward')}
              onTouchStart={() => handleTouchStart('forward')}
              onTouchEnd={() => handleTouchEnd('forward')}
            >ACC</button>
          </div>
        </div>
      )}

      {/* Screens */}
      {gameState === 'paused' && (
        <div className="game-over-screen" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="game-over-title" style={{ color: 'white', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>PAUSED</div>
          <button className="restart-btn" onClick={useGameStore.getState().togglePause}>RESUME</button>
        </div>
      )}

      {gameState === 'start' && (
        <div className="game-over-screen" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="game-title">HIGHWAY RUSH</div>
          <p style={{ color: 'white', marginBottom: 20 }}>Endless Car Runner</p>
          <button className="restart-btn" onClick={startGame}>START DRIVING</button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="game-over-screen">
          <div className="game-over-title">CRASHED!</div>
          <div className="game-over-stats">
            Distance: {Math.floor(distance)}m <br />
            Coins Earned: {coins} <br />
            Final Score: {score}
          </div>
          <button className="restart-btn" onClick={startGame}>PLAY AGAIN</button>
        </div>
      )}
    </div>
  )
}

function GameScene() {
  const gameState = useGameStore(s => s.gameState)
  const gameId = useGameStore(s => s.gameId)
  const cameraRef = useRef()

  useFrame((state, delta) => {
    // Smoother camera follow can be added here if needed, 
    // but we can also use state.camera directly in Player.jsx
  })

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 4, 8]} fov={60} />

      {/* Lighting and Environment */}
      <ambientLight intensity={0.5} />
      <directionalLight
        castShadow
        position={[100, 100, 50]}
        intensity={2}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <Environment preset="city" />
      <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />

      {/* Fog for depth */}
      <fog attach="fog" args={['#aaccff', 50, 400]} />
      <color attach="background" args={['#aaccff']} />

      <group key={gameId}>
        {/* Physics World */}
        <Physics timeStep="vary" paused={gameState !== 'playing'}>
          <Player />
          <TrafficManager />
        </Physics>

        {/* Non-physics visuals */}
        <RoadManager />
      </group>

      {/* Fake shadow under player */}
      <ContactShadows position={[0, 0.05, 0]} opacity={0.6} scale={10} blur={2} far={2} />
    </>
  )
}

function App() {
  return (
    <>
      <Canvas shadows dpr={[1, 2]} gl={{ powerPreference: "high-performance", antialias: false }}>
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  )
}

export default App

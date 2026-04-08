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

  useEffect(() => {
    // Also fetch leaderboard when HUD first mounts
    useGameStore.getState().fetchLeaderboard()
  }, [])

  return (
    <div className="ui-container">
      {/* Top HUD */}
      <div className="hud-top" style={{ zIndex: 20 }}>
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
          <span className="speed-value">{Math.floor(speed)}</span>
          <span className="speed-unit">KM/H</span>
        </div>
      )}

      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          {/* Invisible touch areas for L/R turning */}
          <div 
            style={{position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 1, pointerEvents: 'auto'}}
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={() => handleTouchEnd('left')}
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={() => handleTouchEnd('left')}
            onMouseLeave={() => handleTouchEnd('left')}
          />
          <div 
            style={{position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 1, pointerEvents: 'auto'}}
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={() => handleTouchEnd('right')}
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={() => handleTouchEnd('right')}
            onMouseLeave={() => handleTouchEnd('right')}
          />
          <div className="on-screen-controls" style={{ zIndex: 20 }}>
            <div className="control-group">
              <button
                className="control-btn"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={() => handleTouchStart('left')}
                onMouseUp={() => handleTouchEnd('left')}
                onMouseLeave={() => handleTouchEnd('left')}
                onTouchStart={() => handleTouchStart('left')}
                onTouchEnd={() => handleTouchEnd('left')}
              >L</button>
              <button
                className="control-btn"
                style={{ pointerEvents: 'auto' }}
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
                style={{ pointerEvents: 'auto' }}
                onMouseDown={() => handleTouchStart('backward')}
                onMouseUp={() => handleTouchEnd('backward')}
                onMouseLeave={() => handleTouchEnd('backward')}
                onTouchStart={() => handleTouchStart('backward')}
                onTouchEnd={() => handleTouchEnd('backward')}
              >BRAKE</button>
              <button
                className="control-btn acc"
                style={{ pointerEvents: 'auto' }}
                onMouseDown={() => handleTouchStart('forward')}
                onMouseUp={() => handleTouchEnd('forward')}
                onMouseLeave={() => handleTouchEnd('forward')}
                onTouchStart={() => handleTouchStart('forward')}
                onTouchEnd={() => handleTouchEnd('forward')}
              >ACC</button>
            </div>
          </div>
        </>
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
          
          {useGameStore.getState().apiLoading && (
            <div style={{ color: '#aaa', marginBottom: '20px' }}>Connecting to Database...</div>
          )}
          
          {useGameStore.getState().apiError && (
             <div style={{ color: '#ff4444', marginBottom: '30px', textAlign: 'center', background: 'rgba(50,0,0,0.5)', padding: '15px', borderRadius: '10px' }}>
                Database Offline ❌<br/>
                <small style={{ color: '#ccc' }}>Please install & run MongoDB</small>
             </div>
          )}
          
          {!useGameStore.getState().apiLoading && !useGameStore.getState().apiError && useGameStore.getState().leaderboard.length === 0 && (
             <div style={{ color: '#ffd700', marginBottom: '20px' }}>No scores in Database yet! Play to be first!</div>
          )}

          {!useGameStore.getState().apiError && useGameStore.getState().leaderboard.length > 0 && (
             <div style={{ color: 'white', marginBottom: '30px', textAlign: 'center', zIndex: 10, background: 'rgba(0,0,0,0.5)', padding: '15px', borderRadius: '10px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#ffd700' }}>🏆 Global Top Scores (Live DB)</h3>
                <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '14px' }}>
                  {useGameStore.getState().leaderboard.slice(0, 5).map((l, i) => (
                    <div key={i} style={{ margin: '5px 0' }}>
                      <span style={{color: '#aaa', fontSize: '11px'}}>{l.guestId.substr(0,8)}</span> • {l.score} pts ({Math.floor(l.distance)}m)
                    </div>
                  ))}
                </div>
             </div>
          )}

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
          
          {useGameStore.getState().leaderboard.length > 0 && (
             <div style={{ color: 'white', marginBottom: '20px', textAlign: 'center', zIndex: 10 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', textDecoration: 'underline' }}>Top Scores</h3>
                <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '14px' }}>
                  {useGameStore.getState().leaderboard.slice(0, 3).map((l, i) => (
                    <div key={i}>{i+1}. {l.score} pts ({l.distance}m, {l.coins} coins)</div>
                  ))}
                </div>
             </div>
          )}

          <button className="restart-btn" style={{ zIndex: 10 }} onClick={startGame}>PLAY AGAIN</button>
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

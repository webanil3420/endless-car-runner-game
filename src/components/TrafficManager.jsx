import React, { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { ProceduralCar } from './Models'

const POOL_SIZE = 12
const COIN_POOL_SIZE = 8
const SPAWN_Z = -500
const DESPAWN_Z = 50
const LANES = [-5, 0, 5]
const COLORS = ['#33ff55', '#3355ff', '#ffff33', '#ff9933', '#ffffff', '#222222']

function Coin({ lane, zOffset }) {
  const ref = useRef()
  const isPlaying = useGameStore(s => s.gameState === 'playing')
  const [collected, setCollected] = useState(false)

  useFrame((state, delta) => {
    if (!isPlaying || !ref.current || collected) return
    const { speed, playerPos } = useGameStore.getState()
    
    ref.current.position.z += speed * delta
    ref.current.rotation.y += delta * 3

    if (ref.current.position.z > DESPAWN_Z) {
      ref.current.position.z = SPAWN_Z - Math.random() * 500
      ref.current.position.x = LANES[Math.floor(Math.random() * LANES.length)]
      setCollected(false)
    }

    // Manual hit check
    if (!collected) {
      const pX = playerPos.x
      const pZ = playerPos.z
      const cX = ref.current.position.x
      const cZ = ref.current.position.z
      if (Math.abs(cX - pX) < 1.5 && Math.abs(cZ - pZ) < 2.5) {
        setCollected(true)
        useGameStore.getState().addCoin()
      }
    }
  })

  return (
    <group position={[lane, 1, SPAWN_Z + zOffset]} ref={ref} visible={!collected}>
      <mesh castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.3} emissive="#ffd700" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

function TrafficCar({ data }) {
  const bodyRef = useRef()
  const isPlaying = useGameStore(s => s.gameState === 'playing')
  const { type, lane, zOffset, isPolice, isAmbulance, carColor, baseSpeed } = data

  const targetLaneRef = useRef(data.lane)

  useFrame((state, delta) => {
    if (!isPlaying || !bodyRef.current) return
    const { speed, playerPos } = useGameStore.getState()
    const pos = bodyRef.current.position
    
    let currentZ = pos.z + (speed - baseSpeed) * delta
    let currentX = pos.x

    if (currentZ > DESPAWN_Z || currentZ < SPAWN_Z - 500) {
      currentZ = SPAWN_Z - Math.random() * 200
      const newLane = LANES[Math.floor(Math.random() * LANES.length)]
      currentX = newLane
      targetLaneRef.current = newLane
    }
    
    // High chance to switch lanes to create aggressive dynamic traffic (like overtaking)
    if (Math.random() < 0.003) {
      const otherLanes = [-5, 0, 5].filter(l => l !== targetLaneRef.current)
      targetLaneRef.current = otherLanes[Math.floor(Math.random() * otherLanes.length)]
    }

    // Smoothly animate the lane change
    currentX = THREE.MathUtils.lerp(currentX, targetLaneRef.current, delta * 3)

    bodyRef.current.position.set(currentX, 0.6, currentZ)

    // Manual check for collision
    const pX = playerPos.x
    const pZ = playerPos.z
    const halfWidthTraffic = 0.9
    const halfLengthTraffic = type === 'truck' ? 2.5 : 2
    const halfWidthPlayer = 0.85
    const halfLengthPlayer = 1.9

    if (Math.abs(currentX - pX) < (halfWidthTraffic + halfWidthPlayer) - 0.3) {
      if (Math.abs(currentZ - pZ) < (halfLengthTraffic + halfLengthPlayer) - 0.5) {
        useGameStore.getState().gameOver()
      }
    }
  })

  return (
    <group 
      ref={bodyRef} 
      position={[lane, 0.6, SPAWN_Z + zOffset]} 
      name="traffic"
    >
      <ProceduralCar 
        carColor={isAmbulance ? '#ffffff' : carColor} 
        isTruck={type === 'truck'} 
        isPolice={isPolice || isAmbulance} 
      />
    </group>
  )
}

export function TrafficManager() {
  const vehicles = useMemo(() => Array.from({ length: POOL_SIZE }).map((_, i) => {
    const isAmbulance = Math.random() > 0.9
    return {
      id: i,
      lane: LANES[Math.floor(Math.random() * LANES.length)],
      zOffset: (Math.random() * SPAWN_Z) - (i * 120),
      type: Math.random() > 0.8 ? 'truck' : 'car',
      isAmbulance,
      isPolice: Math.random() > 0.9,
      carColor: COLORS[Math.floor(Math.random() * COLORS.length)],
      baseSpeed: isAmbulance ? 80 + Math.random() * 40 : 30 + Math.random() * 30
    }
  }), [])

  const coins = useMemo(() => Array.from({ length: COIN_POOL_SIZE }).map((_, i) => ({
    id: i,
    lane: LANES[Math.floor(Math.random() * LANES.length)],
    zOffset: (Math.random() * SPAWN_Z) - (i * 150) - 200
  })), [])

  return (
    <group>
      {vehicles.map(v => <TrafficCar key={`car-${v.id}`} data={v} />)}
      {coins.map(c => <Coin key={`coin-${c.id}`} lane={c.lane} zOffset={c.zOffset} />)}
    </group>
  )
}

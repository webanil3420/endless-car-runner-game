import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../store'

const SEGMENT_LENGTH = 300
const SEGMENT_COUNT = 6

function RoadSegment({ zOffset }) {
  const groupRef = useRef()
  const isPlaying = useGameStore(s => s.gameState === 'playing')

  const scenery = useMemo(() => {
    const items = []
    for (let i = 0; i < 20; i++) {
      const isLeft = Math.random() > 0.5
      const x = isLeft ? -10 - Math.random() * 20 : 10 + Math.random() * 20
      const z = (Math.random() - 0.5) * SEGMENT_LENGTH
      const scale = 1 + Math.random() * 1.5
      const type = Math.random() > 0.2 ? 'tree' : 'pole'
      items.push({ x, z, scale, type, isLeft })
    }
    const markings = []
    for (let z = -SEGMENT_LENGTH / 2; z < SEGMENT_LENGTH / 2; z += 10) {
      markings.push(z)
    }
    return { items, markings }
  }, [])

  useFrame((state, delta) => {
    if (!isPlaying || !groupRef.current) return
    const { speed } = useGameStore.getState()
    groupRef.current.position.z += speed * delta
    if (groupRef.current.position.z > SEGMENT_LENGTH) {
      groupRef.current.position.z -= SEGMENT_LENGTH * SEGMENT_COUNT
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, zOffset]}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[16, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.6} metalness={0.1} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-38, -0.1, 0]}>
        <planeGeometry args={[60, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#2d4c1e" roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[38, -0.1, 0]}>
        <planeGeometry args={[60, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#2d4c1e" roughness={0.9} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-7.5, 0.01, 0]}>
        <planeGeometry args={[0.2, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[7.5, 0.01, 0]}>
        <planeGeometry args={[0.2, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      {scenery.markings.map((z, i) => (
        <group key={`marks-${i}`}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.5, 0.02, z]}>
            <planeGeometry args={[0.2, 4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.5, 0.02, z]}>
            <planeGeometry args={[0.2, 4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.4} />
          </mesh>
        </group>
      ))}
      <mesh receiveShadow castShadow position={[-8.5, 0.5, 0]}>
        <boxGeometry args={[0.2, 1, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh receiveShadow castShadow position={[8.5, 0.5, 0]}>
        <boxGeometry args={[0.2, 1, SEGMENT_LENGTH]} />
        <meshStandardMaterial color="#888" roughness={0.3} metalness={0.8} />
      </mesh>
      {scenery.items.map((item, i) => (
        <group key={`scene-${i}`} position={[item.x, 0, item.z]}>
          {item.type === 'tree' ? (
            <group scale={item.scale}>
              <mesh position={[0, 1, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.3, 0.5, 2]} />
                <meshStandardMaterial color="#3b2d1d" />
              </mesh>
              <mesh position={[0, 3, 0]} castShadow receiveShadow>
                <coneGeometry args={[2, 4, 8]} />
                <meshStandardMaterial color="#1f4016" roughness={0.8} />
              </mesh>
              <mesh position={[0, 5, 0]} castShadow receiveShadow>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color="#28521c" roughness={0.8} />
              </mesh>
            </group>
          ) : (
            <group>
              <mesh position={[0, 3, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.1, 0.1, 6]} />
                <meshStandardMaterial color="#555" />
              </mesh>
              <mesh position={[item.isLeft ? 1 : -1, 5.8, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.2, 0.2]} />
                <meshStandardMaterial color="#555" />
              </mesh>
              <mesh position={[item.isLeft ? 2 : -2, 5.7, 0]} castShadow>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

export function RoadManager() {
  const updateStore = useGameStore(s => s.updateScoreAndDistance)
  const isPlaying = useGameStore(s => s.gameState === 'playing')

  useFrame((state, delta) => {
    if (isPlaying) {
      const { speed } = useGameStore.getState()
      updateStore(speed * delta)
    }
  })

  return (
    <group>
      {Array.from({ length: SEGMENT_COUNT }).map((_, i) => (
        <RoadSegment key={i} zOffset={-i * SEGMENT_LENGTH} />
      ))}
    </group>
  )
}

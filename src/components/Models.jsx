import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function ProceduralCar({ 
  carColor = '#ffffff', 
  isPolice = false, 
  isTruck = false, 
  steerAmountRef, 
  wheelRotationRef 
}) {
  const wheelsRef = useRef([])

  useFrame(() => {
    if (steerAmountRef && wheelRotationRef && wheelsRef.current.length > 0) {
      wheelsRef.current.forEach((wheel, i) => {
        if (!wheel) return
        const isFront = i < 2
        // Rotation for rolling
        wheel.children[0].rotation.x = wheelRotationRef.current
        // Steering for front wheels
        if (isFront) {
          wheel.rotation.y = steerAmountRef.current * 0.5
        }
      })
    }
  })

  return (
    <group castShadow receiveShadow>
      {isTruck ? (
        <group position={[0, 1.25, 0]}>
          <mesh castShadow receiveShadow position={[0, -0.25, 1.5]}>
            <boxGeometry args={[2.5, 2, 2.5]} />
            <meshStandardMaterial color={carColor} roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0, -1]}>
            <boxGeometry args={[2.5, 2.5, 5]} />
            <meshStandardMaterial color="#888" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, 2.8]} rotation={[-0.1, 0, 0]}>
            <planeGeometry args={[2, 1]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
          </mesh>
        </group>
      ) : (
        <group position={[0, 0.6, 0]}>
          <mesh castShadow receiveShadow position={[0, 0, 0]}>
            <boxGeometry args={[1.8, 0.5, 4]} />
            <meshStandardMaterial color={carColor} roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <boxGeometry args={[1.4, 0.6, 2]} />
            <meshStandardMaterial color={carColor} roughness={0.2} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, 0.85]} rotation={[-0.5, 0, 0]}>
            <planeGeometry args={[1.2, 0.7]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.5, -1.25]} rotation={[0.5, 0, 0]}>
            <planeGeometry args={[1.2, 0.7]} />
            <meshStandardMaterial color="#111" roughness={0.1} metalness={0.8} />
          </mesh>
          <mesh position={[0.6, 0, -2.01]}>
            <planeGeometry args={[0.4, 0.2]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
          </mesh>
          <mesh position={[-0.6, 0, -2.01]}>
            <planeGeometry args={[0.4, 0.2]} />
            <meshStandardMaterial color="red" emissive="red" emissiveIntensity={2} />
          </mesh>
          <mesh position={[0.6, 0, 2.01]}>
            <planeGeometry args={[0.4, 0.2]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={isPolice ? 0 : 5} />
          </mesh>
          <mesh position={[-0.6, 0, 2.01]}>
            <planeGeometry args={[0.4, 0.2]} />
            <meshStandardMaterial color="white" emissive="white" emissiveIntensity={isPolice ? 0 : 5} />
          </mesh>
          {isPolice && (
            <group position={[0, 0.85, -0.2]}>
              <mesh position={[-0.3, 0, 0]}>
                <boxGeometry args={[0.4, 0.1, 0.2]} />
                <meshStandardMaterial color="red" emissive="red" emissiveIntensity={5} />
              </mesh>
              <mesh position={[0.3, 0, 0]}>
                <boxGeometry args={[0.4, 0.1, 0.2]} />
                <meshStandardMaterial color="blue" emissive="blue" emissiveIntensity={5} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* Wheels */}
      {[[0.9, -1.2], [-0.9, -1.2], [0.9, 1.2], [-0.9, 1.2]].map((pos, i) => (
        <group 
          key={i} 
          ref={el => wheelsRef.current[i] = el}
          position={[pos[0], 0.35, isTruck ? pos[1] * 1.5 : pos[1]]}
        >
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
            <meshStandardMaterial color="#111" roughness={1} />
            <mesh position={[0, 0.11, 0]}>
              <boxGeometry args={[0.4, 0.05, 0.05]} />
              <meshStandardMaterial color="#444" />
            </mesh>
          </mesh>
        </group>
      ))}
    </group>
  );
}

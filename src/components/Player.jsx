import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { ProceduralCar } from './Models'

export function Player() {
  const bodyRef = useRef()
  const gameState = useGameStore((state) => state.gameState)
  const cameraMode = useGameStore((state) => state.cameraMode)
  const isPlaying = gameState === 'playing'
  const setGameOver = useGameStore((state) => state.gameOver)
  const setControl = useGameStore((state) => state.setControl)

  const steerAmountRef = useRef(0)
  const wheelRotationRef = useRef(0)
  const currentXRef = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') setControl('left', true)
      if (e.code === 'ArrowRight' || e.code === 'KeyD') setControl('right', true)
      if (e.code === 'ArrowUp' || e.code === 'KeyW') setControl('forward', true)
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setControl('backward', true)
      if (e.code === 'KeyC') useGameStore.getState().cycleCamera()
    }
    const handleKeyUp = (e) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') setControl('left', false)
      if (e.code === 'ArrowRight' || e.code === 'KeyD') setControl('right', false)
      if (e.code === 'ArrowUp' || e.code === 'KeyW') setControl('forward', false)
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setControl('backward', false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setControl])

  useFrame((state, delta) => {
    if (!isPlaying || !bodyRef.current) return

    const { controls, speed } = useGameStore.getState()

    let newSpeed = speed
    if (controls.forward) {
      newSpeed += 60 * delta 
    } else if (controls.backward) {
      newSpeed -= 150 * delta 
    } else {
      newSpeed -= 20 * delta 
    }
    newSpeed = Math.max(0, Math.min(newSpeed, 220))
    useGameStore.setState({ speed: newSpeed })

    let targetSteer = 0
    if (controls.left) targetSteer = -1
    if (controls.right) targetSteer = 1

    steerAmountRef.current = THREE.MathUtils.lerp(steerAmountRef.current, targetSteer, 0.1)
    
    const velocityX = steerAmountRef.current * 30
    currentXRef.current += velocityX * delta
    currentXRef.current = Math.max(-6.5, Math.min(6.5, currentXRef.current))

    bodyRef.current.position.set(currentXRef.current, 0.6, 0)
    
    // Send to store for collision checks
    useGameStore.setState({ playerPos: { x: currentXRef.current, z: 0 } })

    const targetTilt = -steerAmountRef.current * 0.12
    const targetYRot = -steerAmountRef.current * 0.15
    const euler = new THREE.Euler(0, targetYRot, targetTilt)
    const quaternion = new THREE.Quaternion().setFromEuler(euler)
    bodyRef.current.quaternion.copy(quaternion)

    wheelRotationRef.current += newSpeed * 0.5 * delta

    let targetCamPos = new THREE.Vector3()
    let targetLookAt = new THREE.Vector3()

    if (cameraMode === 'follow') {
      // Increase X tracking multipliers to 0.85 so camera rigidly tracks the car left/right,
      // keeping it centered. This prevents the car falling off-screen on narrow mobile aspect ratios!
      targetCamPos.set(currentXRef.current * 0.85, 4, 8)
      targetLookAt.set(currentXRef.current * 0.85, 1, -10)
    } else if (cameraMode === 'top') {
      targetCamPos.set(0, 30, 0)
      targetLookAt.set(0, 0, -10)
    } else if (cameraMode === 'first') {
      targetCamPos.set(currentXRef.current, 1.2, 0.5)
      targetLookAt.set(currentXRef.current + (steerAmountRef.current * 2), 1, -20)
    }

    state.camera.position.lerp(targetCamPos, 0.1)
    state.camera.lookAt(targetLookAt)

   
  })

  return (
    <group ref={bodyRef} position={[0, 0.6, 0]} name="player">
      <ProceduralCar 
        carColor="#ff3366" 
        steerAmountRef={steerAmountRef} 
        wheelRotationRef={wheelRotationRef} 
      />
    </group>
  )
}

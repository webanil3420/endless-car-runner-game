import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../store'
import { ProceduralCar } from './Models'

function useEngineSound(speed, isPlaying, isPaused) {
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const filterRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    const shouldPlay = isPlaying && !isPaused;
    
    if (shouldPlay && !audioCtxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Auto-resume if the browser suspends it initially
      if (ctx.state === 'suspended') {
         ctx.resume().catch(() => {});
      }
      
      audioCtxRef.current = ctx;

      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth'; // Sawtooth returns, but we will filter it heavily so it's smooth, not broken!
      
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine'; // Sub-bass

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 100;
      filter.Q.value = 1;

      const gain = ctx.createGain();
      gain.gain.value = 0; // starts silent

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      filterRef.current = filter;
      gainNodeRef.current = gain;
      
    } else if (!shouldPlay && audioCtxRef.current) {
       audioCtxRef.current.close().catch(() => {});
       audioCtxRef.current = null;
    }
    
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isPlaying, isPaused]);

  useEffect(() => {
    // If context exists, update frequencies and volumes
    if (audioCtxRef.current && osc1Ref.current) {
      if (speed < 1) {
        // Complete silence when stopped
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.1);
        return;
      }

      // Ensure the context resumes if suspended (e.g. by mobile browser policies)
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }

      const baseFreq = 40; 
      const targetFreq = baseFreq + (speed * 0.4); 
      
      osc1Ref.current.frequency.setTargetAtTime(targetFreq, audioCtxRef.current.currentTime, 0.1);
      osc2Ref.current.frequency.setTargetAtTime(targetFreq * 0.5, audioCtxRef.current.currentTime, 0.1);
      
      const targetFilter = 150 + speed * 2.0;
      filterRef.current.frequency.setTargetAtTime(targetFilter, audioCtxRef.current.currentTime, 0.1);

      // Vastly increased volume so it's audible on mobile! (Maxes out around 0.6)
      const targetGain = 0.2 + (speed / 220) * 0.4;
      gainNodeRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current.currentTime, 0.1);
    }
  }, [speed]);
}

export function Player() {
  const bodyRef = useRef()
  const gameState = useGameStore((state) => state.gameState)
  const cameraMode = useGameStore((state) => state.cameraMode)
  const isPlaying = gameState === 'playing'
  const isPaused = gameState === 'paused'
  const setGameOver = useGameStore((state) => state.gameOver)
  const setControl = useGameStore((state) => state.setControl)
  const speed = useGameStore((state) => state.speed)

  useEngineSound(speed, isPlaying, isPaused)

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
      // Lowering the Y-aim from 1 to -0.5 tilts camera down, which pushes the car higher up on the screen,
      // keeping it away from the overlapping bottom mobile UI!
      targetLookAt.set(currentXRef.current * 0.85, -0.5, -10)
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

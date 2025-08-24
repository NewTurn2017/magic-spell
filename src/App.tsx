import { useRef, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTensorFlowHandTracking } from './hooks/useTensorFlowHandTracking'
import { useCameraDevice } from './hooks/useCameraDevice'
import { CameraSelector } from './components/CameraSelector'
import { MagicSpellSystem } from './components/MagicSpellSystem'
import { HandSkeleton3D } from './components/HandSkeleton3D'
import { useStore } from './store/useStore'

function App() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const displayVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mana, setMana] = useState(100)
  const [experience, setExperience] = useState(0)
  const [level, setLevel] = useState(1)

  // Use unified camera device hook
  const {
    devices,
    selectedDeviceId,
    stream,
    error: cameraError,
    isLoading: cameraLoading,
    initializeCamera,
    stopCamera,
    changeDevice,
  } = useCameraDevice()

  // Use TensorFlow hand tracking with the shared stream
  const {
    handData,
    error: trackingError,
    initialize,
    stop,
    isModelReady,
  } = useTensorFlowHandTracking(stream)
  const { cameraEnabled } = useStore()

  const error = cameraError || trackingError

  // Initialize camera and hand tracking when enabled
  useEffect(() => {
    let mounted = true

    const setupCamera = async () => {
      if (!mounted) return

      if (cameraEnabled && !stream) {
        await initializeCamera()
      } else if (!cameraEnabled && stream) {
        stopCamera()
        stop()
      }
    }

    setupCamera()

    return () => {
      mounted = false
    }
  }, [cameraEnabled, stream, initializeCamera, stopCamera, stop])

  // Initialize hand tracking when stream is ready
  useEffect(() => {
    if (stream && videoRef.current && isModelReady) {
      initialize(videoRef.current)
    }

    return () => {
      if (!cameraEnabled) {
        stop()
      }
    }
  }, [stream, isModelReady, initialize, stop, cameraEnabled])

  // Set up display video when stream is available
  useEffect(() => {
    if (stream && displayVideoRef.current) {
      displayVideoRef.current.srcObject = stream
      displayVideoRef.current.play()
    }
  }, [stream])

  useEffect(() => {
    // Add keyboard shortcut for camera toggle
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'c') {
        useStore.getState().setCameraEnabled(!useStore.getState().cameraEnabled)
      }
    }

    window.addEventListener('keypress', handleKeyPress)
    return () => window.removeEventListener('keypress', handleKeyPress)
  }, [])

  // Handle experience and level up
  const handleExperienceGain = (exp: number) => {
    setExperience((prev) => {
      const newExp = prev + exp
      if (newExp >= 100) {
        setLevel((l) => l + 1)
        return newExp - 100
      }
      return newExp
    })
  }

  // Handle mana regeneration
  useEffect(() => {
    const interval = setInterval(() => {
      setMana((prev) => Math.min(100, prev + 2))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className='relative min-h-screen bg-black overflow-hidden'>
      {/* Main Camera View with Magic Overlay */}
      <div className='fixed inset-0 z-0'>
        {cameraEnabled ? (
          <>
            {/* Camera Feed - Mirrored for natural view */}
            <video
              ref={displayVideoRef}
              className='absolute inset-0 w-full h-full object-cover scale-x-[-1]'
              autoPlay
              playsInline
              muted
            />

            {/* Magic Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className='absolute inset-0 w-full h-full pointer-events-none'
              style={{ mixBlendMode: 'screen' }}
            />
          </>
        ) : (
          <div className='absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900' />
        )}
      </div>

      {/* Hidden Video for Hand Tracking */}
      <video ref={videoRef} className='hidden' autoPlay playsInline />

      {/* Hand Skeleton Visualization */}
      {cameraEnabled && <HandSkeleton3D handData={handData} />}

      {/* Magic Spell System Overlay */}
      <div className='absolute inset-0 pointer-events-none z-10'>
        <MagicSpellSystem
          handData={handData}
          onManaChange={setMana}
          onExperienceGain={handleExperienceGain}
          mana={mana}
        />
      </div>

      {/* Game UI Overlay */}
      <div className='relative z-20'>
        {/* Camera Toggle Button */}
        <div className='fixed top-6 left-6'>
          <button
            onClick={() => useStore.getState().setCameraEnabled(!cameraEnabled)}
            className={`px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 ${
              cameraEnabled
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30'
            }`}
          >
            {cameraEnabled ? '📷 Camera Active' : '📷 Enable Camera'}
          </button>
        </div>

        {/* Camera Selector - Only when camera is enabled */}
        {cameraEnabled && devices.length > 1 && (
          <div className='fixed top-6 left-48 bg-black/60 backdrop-blur-lg rounded-xl p-3 border border-purple-500/30'>
            <CameraSelector
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onDeviceChange={changeDevice}
              isLoading={cameraLoading}
            />
          </div>
        )}

        {/* Minimal Stats Display */}
        <div className='fixed top-6 right-6 space-y-2'>
          {/* Level */}
          <div className='bg-black/60 backdrop-blur-lg rounded-lg px-4 py-2 border border-yellow-500/30'>
            <span className='text-yellow-400 font-bold'>Lv.{level}</span>
            <span className='text-white/60 text-sm ml-2'>{experience}/100</span>
          </div>
          
          {/* Mana */}
          <div className='bg-black/60 backdrop-blur-lg rounded-lg px-4 py-2 border border-cyan-500/30'>
            <span className='text-cyan-400 font-bold'>MP</span>
            <span className='text-white/60 text-sm ml-2'>{mana}/100</span>
          </div>
        </div>


        {/* Center Screen - Welcome Message (only when camera is off) */}
        {!cameraEnabled && (
          <div className='fixed inset-0 flex items-center justify-center pointer-events-none z-30'>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className='text-center'
            >
              <h2 className='text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 mb-6'>
                Magic Hands
              </h2>
              <p className='text-2xl text-white/80 mb-8'>
                🎬 영화 같은 마법 경험을 시작하세요!
              </p>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className='text-xl text-yellow-400'
              >
                📷 카메라를 활성화하여 시작
              </motion.div>
            </motion.div>
          </div>
        )}

        {/* Spell Guide - Minimal Bottom Display */}
        {cameraEnabled && (
          <div className='fixed bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-none'>
            <div className='bg-black/60 backdrop-blur-lg rounded-xl px-4 py-2 border border-purple-500/30'>
              <p className='text-white/70 text-xs'>
                ✊ 차지 → 👉 파이어볼 | ✌️ 워터 | 🤘 라이트닝 → ✋ 발사
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='fixed bottom-20 left-1/2 transform -translate-x-1/2 p-4 bg-red-900/90 backdrop-blur-lg border border-red-500 rounded-lg text-red-200 max-w-md text-center z-50'
          >
            <p className='font-semibold mb-2'>⚠️ 카메라 오류</p>
            <p className='text-sm'>{error}</p>
          </motion.div>
        )}
      </div>

      {/* Achievement Notification */}
      <AnimatePresence>
        {experience >= 100 && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className='fixed top-20 right-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-xl shadow-2xl z-50'
          >
            <div className='font-bold text-lg'>🎉 Level Up!</div>
            <div className='text-sm'>You reached Level {level + 1}!</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App

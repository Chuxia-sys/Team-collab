'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'team-collab-notification-sound'

// Create a simple beep using Web Audio API
function playBeep(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  // Configure the beep - a pleasant notification tone
  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
  oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.08) // Slide up
  oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.12) // End higher

  // Smooth volume envelope
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02)
  gainNode.gain.linearRampToValueAtTime(0.12, audioContext.currentTime + 0.1)
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.25)
}

export function useNotificationSound() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored === 'true'
    } catch {
      return false
    }
  })

  const audioContextRef = useRef<AudioContext | null>(null)

  // Create audio context lazily (requires user interaction first)
  const getAudioContext = useCallback((): AudioContext | null => {
    if (!enabled) return null
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      }
      // Resume if suspended (autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume()
      }
      return audioContextRef.current
    } catch {
      return null
    }
  }, [enabled])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    const ctx = getAudioContext()
    if (!ctx) return
    try {
      playBeep(ctx)
    } catch {
      // Silently fail if audio can't play
    }
  }, [getAudioContext])

  // Toggle notification sound
  const toggleNotificationSound = useCallback((value?: boolean) => {
    const newValue = value !== undefined ? value : !enabled
    setEnabled(newValue)
    try {
      localStorage.setItem(STORAGE_KEY, String(newValue))
    } catch {
      // localStorage may not be available
    }
    // If enabling, create audio context on this user interaction
    if (newValue && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      } catch {
        // Web Audio API not available
      }
    }
  }, [enabled])

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  return {
    notificationSoundEnabled: enabled,
    toggleNotificationSound,
    playNotificationSound,
  }
}

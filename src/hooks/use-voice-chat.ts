'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useRealtimeStore } from '@/stores/realtimeStore'

// STUN servers for NAT traversal
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

interface PeerConnection {
  connection: RTCPeerConnection
  userId: string
  username: string
  isMuted: boolean
}

interface UseVoiceChatOptions {
  channelId: string | null
  workspaceId: string | null
  userId: string
  username: string
  avatar: string | null
  initiallyMuted?: boolean
}

export function useVoiceChat({
  channelId,
  workspaceId,
  userId,
  username,
  avatar,
  initiallyMuted = false,
}: UseVoiceChatOptions) {
  const [isInVoice, setIsInVoice] = useState(false)
  const [isMuted, setIsMuted] = useState(initiallyMuted)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [listenOnly, setListenOnly] = useState(false)

  // Refs
  const localStreamRef = useRef<MediaStream | null>(null)
  const peersRef = useRef<Map<string, PeerConnection>>(new Map())
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map())
  const pendingSignalsRef = useRef<Array<{ userId: string; username: string; signal: any }>>([])

  // Socket emits from store
  const socketEmits = useRealtimeStore((s) => s.socketEmits)

  // Get voice participants from store (stable selector to avoid infinite loops)
  const EMPTY_ARRAY = useRef<Array<{ userId: string; username: string; avatar: string | null; isMuted: boolean }>>([]).current
  const participants = useRealtimeStore(
    (s) => (channelId ? s.voiceParticipants[channelId] : undefined) ?? EMPTY_ARRAY,
  )
  const addVoiceParticipant = useRealtimeStore((s) => s.addVoiceParticipant)
  const removeVoiceParticipant = useRealtimeStore((s) => s.removeVoiceParticipant)
  const setVoiceParticipants = useRealtimeStore((s) => s.setVoiceParticipants)

  // ---- Signal listener (receives forwarded WebRTC signals from other peers) ----
  useEffect(() => {
    const handleSignal = (event: Event) => {
      const detail = (event as CustomEvent).detail as {
        userId: string
        username: string
        signal: any
      }
      // Process the signal immediately if we have the connection, otherwise queue it
      const peer = peersRef.current.get(detail.userId)
      if (peer) {
        handleSignalForPeer(detail.userId, detail.username, detail.signal)
      } else {
        // Queue for when the peer connection is created
        pendingSignalsRef.current.push(detail)
      }
    }

    window.addEventListener('voice-signal', handleSignal)
    return () => window.removeEventListener('voice-signal', handleSignal)
  }, [])


  // ---- Handle incoming WebRTC signal ----
  const handleSignalForPeer = useCallback(
    async (fromUserId: string, fromUsername: string, signal: any) => {
      try {
        let peer = peersRef.current.get(fromUserId)

        if (signal.type === 'offer') {
          // We received an offer — create peer if needed and set remote, then answer
          if (!peer) {
            peer = await createPeerConnection(fromUserId, fromUsername, false)
          }
          await peer.connection.setRemoteDescription(new RTCSessionDescription(signal))
          const answer = await peer.connection.createAnswer()
          await peer.connection.setLocalDescription(answer)
          socketEmits?.emitVoiceSignal(channelId || '', fromUserId, answer)
        } else if (signal.type === 'answer') {
          // We received an answer to our offer
          if (peer) {
            await peer.connection.setRemoteDescription(new RTCSessionDescription(signal))
          }
        } else if (signal.candidate) {
          // We received an ICE candidate
          if (peer) {
            await peer.connection.addIceCandidate(new RTCIceCandidate(signal))
          }
        }
      } catch (err) {
        console.error('[VoiceChat] Signal error:', err)
      }
    },
    [channelId, socketEmits]
  )

  // ---- Create a peer connection to another user ----
  const createPeerConnection = useCallback(
    async (targetUserId: string, targetUsername: string, isInitiator: boolean): Promise<PeerConnection> => {
      // Close existing connection if any
      const existing = peersRef.current.get(targetUserId)
      if (existing) {
        existing.connection.close()
        peersRef.current.delete(targetUserId)
      }

      const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })

      // Add local tracks
      if (localStreamRef.current) {
        for (const track of localStreamRef.current.getTracks()) {
          connection.addTrack(track, localStreamRef.current)
        }
      }

      const peer: PeerConnection = {
        connection,
        userId: targetUserId,
        username: targetUsername,
        isMuted: isMuted,
      }

      // Handle ICE candidates
      connection.onicecandidate = (event) => {
        if (event.candidate && channelId) {
          socketEmits?.emitVoiceSignal(channelId, targetUserId, event.candidate)
        }
      }

      // Handle connection state changes
      connection.onconnectionstatechange = () => {
        if (
          connection.connectionState === 'disconnected' ||
          connection.connectionState === 'failed' ||
          connection.connectionState === 'closed'
        ) {
          // Remove the audio element
          const audioEl = audioElementsRef.current.get(targetUserId)
          if (audioEl) {
            audioEl.pause()
            audioEl.srcObject = null
            audioElementsRef.current.delete(targetUserId)
          }
          peersRef.current.delete(targetUserId)
        }
      }

      // Handle incoming remote stream
      connection.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (!remoteStream) return

        // Create or update audio element for this peer
        let audioEl = audioElementsRef.current.get(targetUserId)
        if (!audioEl) {
          audioEl = new Audio()
          audioEl.autoplay = true
          audioEl.volume = 1.0
          audioElementsRef.current.set(targetUserId, audioEl)
        }
        audioEl.srcObject = remoteStream
        audioEl.play().catch((err) => {
          console.warn('[VoiceChat] Audio play failed (browser autoplay policy):', err)
        })
      }

      peersRef.current.set(targetUserId, peer)

      // If initiator, create and send offer
      if (isInitiator && localStreamRef.current) {
        try {
          const offer = await connection.createOffer()
          await connection.setLocalDescription(offer)
          socketEmits?.emitVoiceSignal(channelId || '', targetUserId, offer)
        } catch (err) {
          console.error('[VoiceChat] Offer creation error:', err)
        }
      }

      return peer
    },
    [channelId, isMuted, socketEmits]
  )

  // ---- Join voice channel ----
  const joinVoice = useCallback(async () => {
    if (!channelId || !workspaceId || !socketEmits) return

    setError(null)
    setIsConnecting(true)

    let stream: MediaStream | null = null
    let micDenied = false

    // Try to get microphone access
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
    } catch (err: any) {
      console.warn('[VoiceChat] Mic access failed, joining in listen-only mode:', err.message)
      micDenied = true
    }

    if (stream) {
      localStreamRef.current = stream
      // Apply initial mute state
      if (initiallyMuted) {
        stream.getAudioTracks().forEach((track) => { track.enabled = false })
      }
    }

    // Emit join event — server responds with 'voice-user-joined' updating the store.
    // The effect watching `participants` will auto-connect to existing peers.
    socketEmits.emitVoiceJoin(channelId, workspaceId, !stream || initiallyMuted)

    setIsInVoice(true)
    setIsMuted(!stream || initiallyMuted)
    setListenOnly(micDenied)
    if (micDenied) {
      setError('Microphone not available — joined in listen-only mode. You can hear others but they won\'t hear you.')
    }
    setIsConnecting(false)
  }, [channelId, workspaceId, socketEmits, initiallyMuted])

  // ---- Leave voice channel ----
  const leaveVoice = useCallback(async () => {
    if (!channelId || !workspaceId || !socketEmits) return

    // Close all peer connections
    for (const [, peer] of peersRef.current) {
      peer.connection.close()
    }
    peersRef.current.clear()

    // Stop all audio elements
    for (const [, audioEl] of audioElementsRef.current) {
      audioEl.pause()
      audioEl.srcObject = null
    }
    audioElementsRef.current.clear()

    // Stop local media stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }

    // Notify server
    socketEmits.emitVoiceLeave(channelId, workspaceId)

    // Remove self from participants
    removeVoiceParticipant(channelId, userId)
    setIsInVoice(false)
    setIsMuted(false)
    setListenOnly(false)
    setError(null)
  }, [channelId, workspaceId, socketEmits, userId, removeVoiceParticipant])

  // ---- Toggle mute ----
  const toggleMute = useCallback(() => {
    if (!channelId || !socketEmits) return

    const newMuted = !isMuted

    // Toggle local audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted
      })
    }

    setIsMuted(newMuted)
    socketEmits.emitVoiceToggleMute(channelId, newMuted)
  }, [channelId, isMuted, socketEmits])

  // ---- Cleanup on unmount ----
  useEffect(() => {
    return () => {
      // Leave voice channel if component unmounts while connected
      if (isInVoice && channelId && workspaceId && socketEmits) {
        // Close all peer connections
        for (const [, peer] of peersRef.current) {
          peer.connection.close()
        }
        peersRef.current.clear()
        for (const [, audioEl] of audioElementsRef.current) {
          audioEl.pause()
          audioEl.srcObject = null
        }
        audioElementsRef.current.clear()
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((track) => track.stop())
          localStreamRef.current = null
        }
        socketEmits.emitVoiceLeave(channelId, workspaceId)
      }
    }
  }, [isInVoice, channelId, workspaceId, socketEmits])

  // ---- Watch for new participants joining after us ----
  // When a new participant appears in the store, connect to them
  useEffect(() => {
    if (!isInVoice || !channelId) return

    const currentParticipantIds = Array.from(peersRef.current.keys())
    const newParticipants = participants.filter(
      (p) => p.userId !== userId && !currentParticipantIds.includes(p.userId)
    )

    for (const participant of newParticipants) {
      createPeerConnection(participant.userId, participant.username, true)
    }
  }, [participants, isInVoice, channelId, userId, createPeerConnection])

  return {
    isInVoice,
    isMuted,
    isConnecting,
    listenOnly,
    error,
    participants,
    joinVoice,
    leaveVoice,
    toggleMute,
  }
}

// Web Audio API sound effects

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioContext
}

function playSound(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3
) {
  try {
    const ctx = getAudioContext()

    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available, silently fail
  }
}

// Light tap sound when player jumps
export function playTapSound() {
  playSound(500, 0.06, 'sine', 0.15)
}

// Score point — ascending ding
export function playScoreSound() {
  playSound(660, 0.08, 'sine', 0.2)
  setTimeout(() => playSound(880, 0.06, 'sine', 0.15), 40)
}

// Color change — shimmery dual tone
export function playColorChangeSound() {
  playSound(400, 0.15, 'sine', 0.2)
  setTimeout(() => playSound(600, 0.12, 'sine', 0.18), 60)
}

// Death — low descending buzz
export function playDeathSound() {
  playSound(200, 0.3, 'sawtooth', 0.25)
  setTimeout(() => playSound(120, 0.25, 'sawtooth', 0.2), 100)
}

// Resume audio context on user interaction (required by browsers)
export function initAudio() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
  } catch {
    // Audio not available
  }
}

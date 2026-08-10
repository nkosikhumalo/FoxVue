// Live transcript UI for the Dojo app (voice-to-text).
// Uses `useSpeechToText` to capture what the user says and renders interim
// and final transcript text.

import { useEffect } from 'react'
import useSpeechToText from '../hooks/useSpeechToText'

export default function Transcript({
  lang = 'en-US',
  onFinalTranscript,
  setInterimText,
}) {
  const speech = useSpeechToText({
    lang,
    onFinal: (finalText) => {
      if (typeof onFinalTranscript === 'function') onFinalTranscript(finalText)
    },
  })

  useEffect(() => {
    if (typeof setInterimText === 'function') {
      setInterimText(speech.interimTranscript)
    }
  }, [speech.interimTranscript, setInterimText])

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 8 }}>
        {speech.supported ? (
          <strong>Listening UI</strong>
        ) : (
          <strong>
            Speech recognition not supported in this browser.
          </strong>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={speech.startListening}
          disabled={!speech.supported || speech.listening}
        >
          Start
        </button>
        <button
          type="button"
          onClick={speech.stopListening}
          disabled={!speech.supported || !speech.listening}
        >
          Stop
        </button>
      </div>

      <div
        style={{
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: 12,
          background: 'var(--bg-raised)',
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Interim</div>
        <div style={{ minHeight: 20 }}>{speech.interimTranscript}</div>
        <div style={{ fontWeight: 600, marginTop: 12, marginBottom: 6 }}>
          Final
        </div>
        <div style={{ minHeight: 20 }}>{speech.finalTranscript}</div>
      </div>
    </section>
  )
}

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../store/store'
import Navbar from '../Components/shared/Navbar'
import VoiceVisualizer from '../Components/VoiceVisualizer'
import useMediaRecorder from '../hooks/useMediaRecorder'
import { evaluateAnswer, transcribeAudio } from '../services/api'
import '../styles/Interview.css'

export default function Interview() {
  const { state, dispatch } = useInterviewStore()
  const navigate = useNavigate()

  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const [editMode, setEditMode] = useState(false)
  const [editText, setEditText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [autoSubmit, setAutoSubmit] = useState(false)
  // Refs so handleAudioStop always reads the latest values without stale closures
  const transcriptRef = useRef(state.finalTranscript)
  transcriptRef.current = state.finalTranscript
  const autoSubmitRef = useRef(autoSubmit)
  autoSubmitRef.current = autoSubmit
  const sessionIdRef = useRef(state.sessionId)
  sessionIdRef.current = state.sessionId
  const currentQuestionRef = useRef(state.currentQuestion)
  currentQuestionRef.current = state.currentQuestion

  const question = state.currentQuestion
  const evaluation = state.evaluation
  const totalQuestions = state.questions.length
  const currentIndex = state.questionIndex
  const isLastQuestion = currentIndex >= totalQuestions - 1

  // Called when MediaRecorder stops — send blob to backend for transcription
  const handleAudioStop = useCallback(async (blob) => {
    setTranscribing(true)
    try {
      const text = await transcribeAudio(blob)
      if (text) {
        const combined = (transcriptRef.current + ' ' + text).trim()
        dispatch({ type: 'SET_FINAL_TRANSCRIPT', transcript: combined })

        // If auto-submit is on, immediately evaluate after transcription
        if (autoSubmitRef.current && sessionIdRef.current && currentQuestionRef.current) {
          setTranscribing(false)
          setSubmitting(true)
          try {
            const result = await evaluateAnswer({
              sessionId: sessionIdRef.current,
              question: currentQuestionRef.current,
              transcript: combined,
            })
            dispatch({ type: 'SET_EVALUATION', evaluation: result })
          } catch (e) {
            console.error('Evaluate error:', e.response?.data?.error || e.message)
          } finally {
            setSubmitting(false)
          }
          return
        }
      }
    } catch (e) {
      console.error('Transcription error:', e.response?.data?.error || e.message)
    } finally {
      setTranscribing(false)
    }
  }, [dispatch])

  const recorder = useMediaRecorder({ onStop: handleAudioStop })

  // Timer — ticks while recording
  useEffect(() => {
    if (recorder.recording) {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [recorder.recording])

  const canSubmit = useMemo(
    () => state.finalTranscript.trim().length > 0,
    [state.finalTranscript]
  )

  function handleStartRecording() {
    setElapsed(0)
    recorder.start()
  }

  function handleStopRecording() {
    recorder.stop()
  }

  function handleEditToggle() {
    if (!editMode) {
      setEditText(state.finalTranscript)
      setEditMode(true)
    } else {
      dispatch({ type: 'SET_FINAL_TRANSCRIPT', transcript: editText.trim() })
      setEditMode(false)
    }
  }

  async function handleSubmit() {
    if (!state.sessionId || !question || !canSubmit) return
    setSubmitting(true)
    try {
      const result = await evaluateAnswer({
        sessionId: state.sessionId,
        question,
        transcript: state.finalTranscript,
      })
      dispatch({ type: 'SET_EVALUATION', evaluation: result })
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to evaluate. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNextQuestion() {
    dispatch({ type: 'NEXT_QUESTION' })
    setElapsed(0)
    setEditMode(false)
  }

  function handleNewInterview() {
    dispatch({ type: 'RESET' })
    navigate('/setup')
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const scoreTier = evaluation
    ? evaluation.score >= 8 ? 'high' : evaluation.score >= 5 ? 'medium' : 'low'
    : null

  const isRecording = recorder.recording
  const isBusy = isRecording || transcribing

  if (!state.sessionId || !question) {
    return (
      <div className="iv-page">
        <Navbar />
        <div className="iv-body" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex', flex: 1 }}>
          <div style={{ textAlign: 'center', color: 'var(--text)' }}>
            <p>No active session. Please set up an interview first.</p>
            <button className="iv-submit-btn" style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 2rem' }} onClick={() => navigate('/setup')}>
              Go to Setup
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="iv-page">
      <Navbar />
      <div className="iv-mesh" aria-hidden />

      <div className="iv-body">

        <div className="iv-question-bar">
          <div className="iv-question-bar__left">
            {question.skill && <span className="iv-badge">{question.skill}</span>}
            {question.category && <span className="iv-badge iv-badge--ai">{question.category}</span>}
          </div>
          <div className="iv-question-bar__right">
            <span className="iv-progress">Question {currentIndex + 1} of {totalQuestions}</span>
            <button className="iv-btn" onClick={() => navigate('/history')}>History</button>
            <button className="iv-btn" onClick={handleNewInterview}>New</button>
          </div>
        </div>

        <div className="iv-question-card">
          <p className="iv-question-label">Question {currentIndex + 1}</p>
          <h2 className="iv-question-text">{question.text}</h2>
        </div>

        <div className="iv-main">

          {/* LEFT — Recording */}
          <div className="iv-panel iv-panel--record">
            <div className="iv-panel__header">
              <span className="iv-panel__title">Your Response</span>
              <span className={`iv-timer ${isRecording ? 'iv-timer--active' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTime(elapsed)}
              </span>
            </div>

            <div className="iv-viz-wrap">
              <VoiceVisualizer isActive={isRecording} />
            </div>

            <div className="iv-record-controls">
              {!isRecording ? (
                <button
                  className="iv-record-btn iv-record-btn--start"
                  onClick={handleStartRecording}
                  disabled={transcribing || submitting}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8" /></svg>
                  {transcribing ? 'Transcribing...' : submitting ? 'Evaluating...' : 'Start Recording'}
                </button>
              ) : (
                <button className="iv-record-btn iv-record-btn--stop" onClick={handleStopRecording}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2" /></svg>
                  Stop Recording
                </button>
              )}
            </div>

            {/* Auto-submit toggle */}
            <label className="iv-auto-submit-toggle">
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={e => setAutoSubmit(e.target.checked)}
                disabled={isRecording || transcribing || submitting}
              />
              <span>Auto-submit to AI after recording</span>
            </label>

            {/* Status indicator */}
            {(transcribing || submitting) && (
              <div className="iv-transcribing">
                <span className="iv-spinner-dark" />
                {transcribing ? 'Transcribing your answer...' : 'Evaluating with AI...'}
              </div>
            )}

            {/* Mic error */}
            {recorder.error && (
              <p className="iv-warning">{recorder.error}</p>
            )}

            <div className="iv-transcript-wrap">
              <div className="iv-transcript-header">
                <span className="iv-transcript-label">Transcript</span>
                <div className="iv-transcript-actions">
                  {canSubmit && !editMode && (
                    <button className="iv-text-btn" onClick={handleEditToggle}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                  )}
                  {editMode && (
                    <>
                      <button className="iv-text-btn iv-text-btn--save" onClick={handleEditToggle}>Save</button>
                      <button className="iv-text-btn" onClick={() => setEditMode(false)}>Cancel</button>
                    </>
                  )}
                  {canSubmit && !editMode && (
                    <button className="iv-text-btn iv-text-btn--danger" onClick={() => {
                      dispatch({ type: 'SET_FINAL_TRANSCRIPT', transcript: '' })
                      setElapsed(0)
                    }}>Clear</button>
                  )}
                </div>
              </div>

              {editMode ? (
                <textarea className="iv-transcript-editor" value={editText}
                  onChange={e => setEditText(e.target.value)} rows={6} autoFocus />
              ) : (
                <div className="iv-transcript-box">
                  {state.finalTranscript ? (
                    <p className="iv-transcript-text">{state.finalTranscript}</p>
                  ) : (
                    <p className="iv-transcript-placeholder">
                      {transcribing
                        ? 'Processing your recording...'
                        : 'Press Start Recording and speak your answer...'}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button className="iv-submit-btn" onClick={handleSubmit}
              disabled={!canSubmit || submitting || editMode || !!evaluation || isBusy}>
              {submitting
                ? <><span className="iv-spinner" />Evaluating with AI...</>
                : <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>Submit Answer</>
              }
            </button>
          </div>

          {/* RIGHT — AI Response */}
          <div className="iv-panel iv-panel--ai">
            <div className="iv-panel__header">
              <span className="iv-panel__title">AI Feedback</span>
              {evaluation && (
                <span className={`iv-score-badge iv-score-badge--${scoreTier}`}>
                  {evaluation.score}/10
                </span>
              )}
            </div>

            {!evaluation ? (
              <div className="iv-ai-empty">
                <div className="iv-ai-empty__icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <p>Record your answer and submit to get AI feedback.</p>
                <ul>
                  <li>Clarity & communication score</li>
                  <li>Technical accuracy</li>
                  <li>Strengths & weaknesses</li>
                  <li>Sample answer</li>
                  <li>Follow-up question</li>
                </ul>
              </div>
            ) : (
              <div className="iv-ai-response">
                <div className="iv-ai-score-row">
                  <div className={`iv-score-circle iv-score-circle--${scoreTier}`}>
                    <span className="iv-score-num">{evaluation.score}</span>
                    <span className="iv-score-sub">/10</span>
                  </div>
                  <div className="iv-score-meta">
                    <div className="iv-score-breakdown">
                      <span>Clarity <strong>{evaluation.clarity}/10</strong></span>
                      <span>Technical <strong>{evaluation.technicalScore}/10</strong></span>
                      <span>Communication <strong>{evaluation.communication}/10</strong></span>
                    </div>
                    <p className="iv-score-desc">{evaluation.summary}</p>
                  </div>
                </div>

                {evaluation.strengths?.length > 0 && (
                  <div className="iv-ai-section">
                    <h4>Strengths</h4>
                    <ul className="iv-eval-list iv-eval-list--good">
                      {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}

                {evaluation.weaknesses?.length > 0 && (
                  <div className="iv-ai-section">
                    <h4>Areas to Improve</h4>
                    <ul className="iv-eval-list iv-eval-list--warn">
                      {evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                {evaluation.sampleAnswer && (
                  <div className="iv-ai-section">
                    <h4>Sample Answer</h4>
                    <p>{evaluation.sampleAnswer}</p>
                  </div>
                )}

                {evaluation.followUp && (
                  <div className="iv-followup">
                    <span className="iv-followup__label">Follow-up Question</span>
                    <p className="iv-followup__text">{evaluation.followUp}</p>
                  </div>
                )}

                {isLastQuestion ? (
                  <button className="iv-next-btn" onClick={() => navigate('/history')}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    View Full Results
                  </button>
                ) : (
                  <button className="iv-next-btn" onClick={handleNextQuestion}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                    Next Question ({currentIndex + 2}/{totalQuestions})
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


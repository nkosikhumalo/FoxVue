import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteSession, fetchAllSessions, fetchHistory } from '../services/api'
import Navbar from '../Components/shared/Navbar'
import { formatDateTime } from '../utils/DateFormatting'
import '../styles/History.css'

function tier(s) {
    return s >= 8 ? 'high' : s >= 5 ? 'medium' : 'low'
}

export default function History() {
    const navigate = useNavigate()
    const [sessions, setSessions] = useState(null)
    const [sessionsLoading, setSessionsLoading] = useState(true)
    const [sessionsError, setSessionsError] = useState(null)
    const [selected, setSelected] = useState(null)
    const [detail, setDetail] = useState(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [expanded, setExpanded] = useState(null)
    const [deletingId, setDeletingId] = useState(null)

    useEffect(() => {
        fetchAllSessions()
            .then(setSessions)
            .catch(() => setSessionsError('Could not load history. Make sure the backend is running.'))
            .finally(() => setSessionsLoading(false))
    }, [])

    useEffect(() => {
        if (!selected) return
        setDetail(null)
        setExpanded(null)
        setDetailLoading(true)
        fetchHistory(selected.sessionId)
            .then(setDetail)
            .catch(() => setDetail({ history: [] }))
            .finally(() => setDetailLoading(false))
    }, [selected])

    async function handleDelete(sessionId, e) {
        e?.stopPropagation()
        if (!window.confirm('Delete this interview session? This cannot be undone.')) return

        setDeletingId(sessionId)
        try {
            await deleteSession(sessionId)
            setSessions(prev => (prev || []).filter(s => s.sessionId !== sessionId))
            if (selected?.sessionId === sessionId) {
                setSelected(null)
                setDetail(null)
            }
        } catch {
            alert('Failed to delete session. Please try again.')
        } finally {
            setDeletingId(null)
        }
    }

    if (selected) {
        const avg = detail?.history?.length
            ? Math.round(detail.history.reduce((a, e) => a + e.feedback.score, 0) / detail.history.length)
            : null

        return (
            <div className="history-page">
                <Navbar />
                <div className="history-page__mesh" aria-hidden />
                <div className="history-page__container">
                    <div className="history-page__hero history-page__hero--detail">
                        <button className="history-page__back-btn" onClick={() => setSelected(null)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                            All Sessions
                        </button>
                        <div className="history-page__hero-main">
                            <div>
                                <h1>{selected.jobTitle || 'Interview Session'}</h1>
                                <p>{formatDateTime(selected.createdAt)}</p>
                            </div>
                            <button
                                className="history-page__delete-btn"
                                onClick={(e) => handleDelete(selected.sessionId, e)}
                                disabled={deletingId === selected.sessionId}
                            >
                                {deletingId === selected.sessionId ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>

                    <div className="history-page__stats">
                        <div className="history-page__stat-card">
                            <span className="history-page__stat-value">{selected.answerCount}</span>
                            <span className="history-page__stat-label">Questions Answered</span>
                        </div>
                        <div className="history-page__stat-card">
                            <span className="history-page__stat-value" data-score={tier(avg)}>{avg ?? '—'}</span>
                            <span className="history-page__stat-label">Avg Score /10</span>
                        </div>
                        <div className="history-page__stat-card">
                            <span className="history-page__stat-value">
                                {detail?.history?.filter(e => e.feedback.star === 'Strong' || e.feedback.star === 'Good').length ?? '—'}
                            </span>
                            <span className="history-page__stat-label">Strong Answers</span>
                        </div>
                    </div>

                    {selected.jobDescription && (
                        <details className="history-page__job-details">
                            <summary>Job Description</summary>
                            <pre className="history-page__job-text">{selected.jobDescription}</pre>
                        </details>
                    )}

                    <div className="history-page__scroll">
                        {detailLoading && (
                            <div className="history-page__loading">
                                <div className="history-page__spinner" />
                                <p>Loading answers...</p>
                            </div>
                        )}

                        {detail && detail.history.length === 0 && (
                            <div className="history-page__empty">
                                <div className="history-page__empty-icon">MIC</div>
                                <h2>No Answers Recorded</h2>
                                <p>No answers were submitted in this session.</p>
                            </div>
                        )}

                        {detail && detail.history.length > 0 && (
                            <div className="history-page__entries">
                                {detail.history.map((entry, i) => {
                                    const score = entry.feedback.score
                                    const isOpen = expanded === i
                                    return (
                                        <div key={i} className={`history-page__entry${isOpen ? ' history-page__entry--open' : ''}`}>
                                            <button className="history-page__entry-header" onClick={() => setExpanded(isOpen ? null : i)}>
                                                <div className="history-page__entry-left">
                                                    <span className="history-page__entry-num">Q{i + 1}</span>
                                                    <div className="history-page__entry-info">
                                                        <span className="history-page__entry-question">{entry.question.text}</span>
                                                        <span className="history-page__entry-meta">
                                                            {entry.question.skill && <>{entry.question.skill} · </>}
                                                            {entry.question.category} · {formatDateTime(entry.answeredAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="history-page__entry-right">
                                                    <span className={`history-page__score-badge history-page__score-badge--${tier(score)}`}>
                                                        {score}/10
                                                    </span>
                                                    <span className={`history-page__star-badge history-page__star-badge--${entry.feedback.star === 'Strong' || entry.feedback.star === 'Good' ? 'strong' : 'weak'
                                                        }`}>
                                                        {entry.feedback.star}
                                                    </span>
                                                    <svg
                                                        className={`history-page__chevron${isOpen ? ' history-page__chevron--open' : ''}`}
                                                        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                                    >
                                                        <polyline points="6 9 12 15 18 9" />
                                                    </svg>
                                                </div>
                                            </button>

                                            {isOpen && (
                                                <div className="history-page__entry-body">
                                                    {entry.feedback.summary && (
                                                        <div className="history-page__feedback-block">
                                                            <h4>Feedback</h4>
                                                            <p>{entry.feedback.summary}</p>
                                                        </div>
                                                    )}
                                                    {entry.transcript && (
                                                        <div className="history-page__transcript-block">
                                                            <h4>Your Answer</h4>
                                                            <p>{entry.transcript}</p>
                                                        </div>
                                                    )}
                                                    {entry.feedback.fillerWords &&
                                                        Object.values(entry.feedback.fillerWords).some(v => v > 0) && (
                                                            <div className="history-page__filler-block">
                                                                <h4>Filler Words</h4>
                                                                <div className="history-page__filler-tags">
                                                                    {Object.entries(entry.feedback.fillerWords)
                                                                        .filter(([, v]) => v > 0)
                                                                        .map(([w, c]) => (
                                                                            <span key={w} className="history-page__filler-tag">{w} × {c}</span>
                                                                        ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="history-page">
            <Navbar />
            <div className="history-page__mesh" aria-hidden />
            <div className="history-page__container">

                <div className="history-page__hero">
                    <div className="history-page__icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <h1>Interview History</h1>
                        <p>All your past sessions. Click any to review answers and feedback.</p>
                    </div>
                </div>

                <div className="history-page__scroll">
                    {sessionsLoading && (
                        <div className="history-page__loading">
                            <div className="history-page__spinner" />
                            <p>Loading your sessions...</p>
                        </div>
                    )}

                    {sessionsError && (
                        <div className="history-page__error">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            {sessionsError}
                        </div>
                    )}

                    {sessions && sessions.length === 0 && (
                        <div className="history-page__empty">
                            <div className="history-page__empty-icon">NO SESSIONS</div>
                            <h2>No Sessions Yet</h2>
                            <p>Complete your first interview to see history here.</p>
                        </div>
                    )}

                    {sessions && sessions.length > 0 && (
                        <div className="history-page__sessions-list">
                            {sessions.map((s) => (
                                <div key={s.sessionId} className="history-page__session-card">
                                    <button className="history-page__session-main" onClick={() => setSelected(s)}>
                                        <div className="history-page__session-left">
                                            <span className="history-page__session-title">{s.jobTitle || 'Interview Session'}</span>
                                            <span className="history-page__session-meta">
                                                {formatDateTime(s.createdAt)} · {s.answerCount} answer{s.answerCount !== 1 ? 's' : ''}
                                            </span>
                                            {s.jobDescription && (
                                                <span className="history-page__session-desc">
                                                    {s.jobDescription.slice(0, 90)}{s.jobDescription.length > 90 ? '...' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="history-page__session-right">
                                            {s.answerCount > 0 && (
                                                <span className={`history-page__score-badge history-page__score-badge--${tier(s.avgScore)}`}>
                                                    {s.avgScore}/10 avg
                                                </span>
                                            )}
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 18l6-6-6-6" />
                                            </svg>
                                        </div>
                                    </button>
                                    <button
                                        className="history-page__delete-btn history-page__delete-btn--icon"
                                        title="Delete session"
                                        aria-label="Delete session"
                                        onClick={(e) => handleDelete(s.sessionId, e)}
                                        disabled={deletingId === s.sessionId}
                                    >
                                        {deletingId === s.sessionId ? (
                                            <span className="history-page__delete-spinner" />
                                        ) : (
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                                <path d="M10 11v6M14 11v6" />
                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button className="history-page__cta history-page__cta--corner" onClick={() => navigate('/setup')}>
                    New Session
                </button>
            </div>
        </div>
    )
}

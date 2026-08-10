// Feedback modal UI for the Dojo app.
// Renders a critique/score returned by the Go backend after the user submits
// their transcript for a given question.

export default function FeedbackModal({ feedback, onClose }) {
  if (!feedback) return null

  const fillerWords =
    feedback?.fillerWords && typeof feedback.fillerWords === 'object'
      ? feedback.fillerWords
      : {}

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: 'min(720px, 100%)',
          background: 'var(--bg-card)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Dojo Feedback</h2>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <strong>Score:</strong> {feedback.score}
        </div>

        {feedback.star && (
          <div style={{ marginTop: 8 }}>
            <strong>STAR completeness:</strong> {feedback.star}
          </div>
        )}

        {feedback.summary && (
          <p style={{ marginTop: 12, lineHeight: 1.4 }}>{feedback.summary}</p>
        )}

        {fillerWords && Object.keys(fillerWords).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong>Filler word counts:</strong>
            <ul style={{ marginTop: 8 }}>
              {Object.entries(fillerWords).map(([word, count]) => (
                <li key={word}>
                  {word}: {count}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

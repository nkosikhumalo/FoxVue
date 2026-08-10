// Small UI component for rendering tags (e.g., categories or skills).

export default function SkillTag({ label }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid var(--border)',
        background: 'var(--bg-raised)',
        color: 'var(--text)',
        fontSize: 12,
      }}
    >
      {label}
    </span>
  )
}

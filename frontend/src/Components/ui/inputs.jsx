// Generic reusable UI input components (buttons, text fields, etc.).
// These are presentational-only and should not perform business logic.

export function TextInput({ value, onChange, placeholder = '' }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        borderRadius: 10,
        padding: 12,
        border: '1px solid var(--border)',
        background: 'var(--bg-raised)',
        color: 'var(--text-h)',
      }}
    />
  )
}

export function PrimaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid var(--blue)',
        background: 'var(--blue)',
        color: 'white',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listAPIKeys, saveAPIKey, testAPIKey, activateAPIKey, deleteAPIKey } from '../services/api'
import Navbar from '../Components/shared/Navbar'
import '../styles/ApiProviders.css'

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', description: 'Gemini Flash / Pro via Google AI Studio', placeholder: 'AIzaSy...', docsUrl: 'https://aistudio.google.com/app/apikey', icon: 'G' },
  { id: 'openai', name: 'OpenAI', description: 'GPT-4o, GPT-4 Turbo and other OpenAI models', placeholder: 'sk-...', docsUrl: 'https://platform.openai.com/api-keys', icon: 'O' },
  { id: 'anthropic', name: 'Anthropic Claude', description: 'Claude 3.5 Sonnet, Haiku and Opus', placeholder: 'sk-ant-...', docsUrl: 'https://console.anthropic.com/settings/keys', icon: 'A' },
  { id: 'aws', name: 'AWS Bedrock', description: 'Amazon Bedrock - Claude, Titan and more', placeholder: 'AKIA...', docsUrl: 'https://console.aws.amazon.com/iam/', icon: 'W' },
]

export default function ApiProviders() {
  const navigate = useNavigate()
  const [keys, setKeys] = useState([])
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState({})
  const [showKey, setShowKey] = useState({})
  const [saving, setSaving] = useState({})
  const [testing, setTesting] = useState({})
  const [activating, setActivating] = useState({})
  const [deleting, setDeleting] = useState({})
  const [testResult, setTestResult] = useState({})

  const isGuest = Boolean(sessionStorage.getItem('dojo_guest')) &&
    !localStorage.getItem('dojo_token') &&
    !sessionStorage.getItem('dojo_token')

  useEffect(() => {
    if (isGuest) { setLoading(false); return }
    listAPIKeys().then(setKeys).catch(() => setKeys([])).finally(() => setLoading(false))
  }, [isGuest])

  const keyFor = (provider) => keys.find(k => k.provider === provider)

  async function handleSave(provider) {
    const val = (inputs[provider] || '').trim()
    if (!val) return
    setSaving(s => ({ ...s, [provider]: true }))
    setTestResult(r => ({ ...r, [provider]: null }))
    try {
      const saved = await saveAPIKey(provider, val)
      setKeys(prev => [...prev.filter(k => k.provider !== provider), saved])
      setInputs(i => ({ ...i, [provider]: '' }))
    } catch (e) {
      setTestResult(r => ({ ...r, [provider]: { valid: false, error: e.response?.data?.error || 'Save failed.' } }))
    } finally {
      setSaving(s => ({ ...s, [provider]: false }))
    }
  }

  async function handleTest(provider) {
    const k = keyFor(provider)
    if (!k) return
    setTesting(t => ({ ...t, [provider]: true }))
    setTestResult(r => ({ ...r, [provider]: null }))
    try {
      const result = await testAPIKey(k.id)
      setTestResult(r => ({ ...r, [provider]: result }))
      setKeys(await listAPIKeys())
    } catch {
      setTestResult(r => ({ ...r, [provider]: { valid: false, error: 'Test request failed.' } }))
    } finally {
      setTesting(t => ({ ...t, [provider]: false }))
    }
  }

  async function handleActivate(provider) {
    const k = keyFor(provider)
    if (!k) return
    setActivating(a => ({ ...a, [provider]: true }))
    try {
      await activateAPIKey(k.id)
      setKeys(await listAPIKeys())
    } finally {
      setActivating(a => ({ ...a, [provider]: false }))
    }
  }

  async function handleDelete(provider) {
    const k = keyFor(provider)
    if (!k || !window.confirm('Remove this API key?')) return
    setDeleting(d => ({ ...d, [provider]: true }))
    try {
      await deleteAPIKey(k.id)
      setKeys(prev => prev.filter(x => x.provider !== provider))
      setTestResult(r => ({ ...r, [provider]: null }))
    } finally {
      setDeleting(d => ({ ...d, [provider]: false }))
    }
  }

  return (
    <div className="ap-page">
      <Navbar />
      <div className="ap-mesh" aria-hidden />
      <div className="ap-body">
        <div className="ap-header">
          <div className="ap-header__icon">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h1>API Providers</h1>
            <p>Add your own API keys. Keys are AES-256 encrypted and never exposed after saving.</p>
          </div>
        </div>

        <div className="ap-notice">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>The platform works with our default keys. Adding your own key activates it immediately and uses your personal quota.</span>
        </div>

        {isGuest ? (
          <div className="ap-guest-wall">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <h2>Account required</h2>
            <p>API key management is only available to registered users. Create a free account to bring your own API keys and unlock your personal quota.</p>
            <button className="ap-btn ap-btn--save" style={{ width: 'auto', padding: '0.75rem 2rem', fontSize: '1rem' }} onClick={() => navigate('/login')}>
              Create a free account
            </button>
          </div>
        ) : loading ? (
          <div className="ap-loading"><div className="ap-spinner" /><p>Loading...</p></div>
        ) : (
          <div className="ap-grid">
            {PROVIDERS.map(p => {
              const saved = keyFor(p.id)
              const result = testResult[p.id]
              const isActive = saved?.isActive
              return (
                <div key={p.id} className={`ap-card${isActive ? ' ap-card--active' : ''}`}>
                  <div className="ap-card__header">
                    <span className="ap-card__icon">{p.icon}</span>
                    <div className="ap-card__title-wrap">
                      <span className="ap-card__name">{p.name}</span>
                      <span className="ap-card__desc">{p.description}</span>
                    </div>
                    {isActive && <span className="ap-badge-active">Active</span>}
                  </div>

                  {saved && (
                    <div className="ap-saved-row">
                      <div className="ap-saved-key">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                        <code>{saved.keyHint}</code>
                        <span className={`ap-status ap-status--${saved.status}`}>
                          {saved.status === 'valid' ? 'Valid' : saved.status === 'invalid' ? 'Invalid' : 'Untested'}
                        </span>
                      </div>
                      <div className="ap-saved-actions">
                        <button className="ap-btn ap-btn--test" onClick={() => handleTest(p.id)} disabled={testing[p.id]}>
                          {testing[p.id] ? <><span className="ap-spinner-sm" />Testing...</> : 'Test Key'}
                        </button>
                        {!isActive && (
                          <button className="ap-btn ap-btn--activate" onClick={() => handleActivate(p.id)} disabled={activating[p.id]}>
                            {activating[p.id] ? <span className="ap-spinner-sm" /> : 'Activate'}
                          </button>
                        )}
                        <button className="ap-btn ap-btn--delete" onClick={() => handleDelete(p.id)} disabled={deleting[p.id]} aria-label="Remove">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {result && (
                    <div className={`ap-result ${result.valid ? 'ap-result--ok' : 'ap-result--err'}`}>
                      {result.valid ? 'Key is valid and working' : `${result.error || 'Key is invalid'}`}
                    </div>
                  )}

                  <div className="ap-input-row">
                    <div className="ap-input-wrap">
                      <input
                        type={showKey[p.id] ? 'text' : 'password'}
                        placeholder={saved ? `Replace (${p.placeholder})` : p.placeholder}
                        value={inputs[p.id] || ''}
                        onChange={e => setInputs(i => ({ ...i, [p.id]: e.target.value }))}
                        autoComplete="off"
                        spellCheck={false}
                      />
                      <button type="button" className="ap-eye-btn" onClick={() => setShowKey(s => ({ ...s, [p.id]: !s[p.id] }))}>
                        {showKey[p.id]
                          ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                          : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        }
                      </button>
                    </div>
                    <button
                      className={`ap-btn ap-btn--save ${saved ? 'ap-btn--save-replace' : 'ap-btn--save-new'}`}
                      onClick={() => handleSave(p.id)}
                      disabled={!inputs[p.id]?.trim() || saving[p.id]}
                    >
                      {saving[p.id] ? <><span className="ap-spinner-sm" />Saving...</> : saved ? 'Replace' : 'Save Key'}
                    </button>
                  </div>

                  <a className="ap-docs-link" href={p.docsUrl} target="_blank" rel="noopener noreferrer">
                    Get {p.name} API key
                  </a>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

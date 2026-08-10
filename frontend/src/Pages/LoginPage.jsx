import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiLogin, apiSignup, apiForgotPassword } from '../services/api'
import './LoginPage.css'

function EyeIcon({ open }) {
  return open ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function LeftPanel() {
  return (
    <div className="lp-panel">
      <div className="lp-panel__inner">
        <div className="lp-panel__brand">
          <img src="/favicon.png" alt="FoxVue" width={56} height={56} className="lp-panel__logo" />
          <span>FoxVue</span>
        </div>

        <div className="lp-panel__body">
          <h2 className="lp-panel__heading">
            Stop winging interviews.<br />
            <span>Start winning them.</span>
          </h2>
          <p className="lp-panel__desc">
            Practicing in your head doesn't cut it. FoxVue puts you in a real AI-driven interview
            so the nerves, the blanking, the rambling — you work through all of it before it counts.
          </p>

          <ul className="lp-panel__list">
            <li>
              <span className="lp-panel__dot" />
              <div>
                <strong>Speak, don't type</strong>
                <span>Live voice sessions with real-time transcription. Answer like you would in the room.</span>
              </div>
            </li>
            <li>
              <span className="lp-panel__dot" />
              <div>
                <strong>See exactly where you lost points</strong>
                <span>STAR-method scoring breaks down every answer — what landed and what fell flat.</span>
              </div>
            </li>
            <li>
              <span className="lp-panel__dot" />
              <div>
                <strong>Your AI key, your rules</strong>
                <span>Bring your own Gemini key. Full control over cost, data, and privacy.</span>
              </div>
            </li>
          </ul>
        </div>

        <p className="lp-panel__footer">
          Free to try &mdash; no card, no catch.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState('login')

  const [email, setEmail] = useState(() => localStorage.getItem('dojo_remembered_email') || '')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(() => Boolean(localStorage.getItem('dojo_remembered_email')))
  const [busy, setBusy] = useState(false)
  const [loginError, setLoginError] = useState(searchParams.get('error') || '')
  const [loginSuccess] = useState(
    searchParams.get('verified') === '1'
      ? 'Email verified! You can now sign in.'
      : searchParams.get('trialEnded') === '1'
        ? 'Your free trial has ended. Create an account to keep going.'
        : ''
  )

  const [suName, setSuName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suBusy, setSuBusy] = useState(false)
  const [suError, setSuError] = useState('')
  const [suSent, setSuSent] = useState(false)

  const [fgEmail, setFgEmail] = useState('')
  const [fgBusy, setFgBusy] = useState(false)
  const [fgError, setFgError] = useState('')

  function handleLogin(e) {
    e.preventDefault()
    setLoginError('')
    if (!email || !password) { setLoginError('Please fill in all fields.'); return }
    setBusy(true)
    apiLogin(email, password)
      .then((data) => {
        if (remember) {
          localStorage.setItem('dojo_token', data.token)
          localStorage.setItem('dojo_remembered_email', email)
        } else {
          sessionStorage.setItem('dojo_token', data.token)
          localStorage.removeItem('dojo_token')
          localStorage.removeItem('dojo_remembered_email')
        }
        navigate('/setup')
      })
      .catch((err) => setLoginError(err.response?.data?.error || 'Wrong credentials. Check your email and password.'))
      .finally(() => setBusy(false))
  }

  function handleSignup(e) {
    e.preventDefault()
    setSuError('')
    if (!suName.trim()) { setSuError('Please enter your name.'); return }
    if (!suEmail.trim()) { setSuError('Please enter your email.'); return }
    setSuBusy(true)
    apiSignup(suName.trim(), suEmail.trim())
      .then(() => setSuSent(true))
      .catch((err) => setSuError(err.response?.data?.error || 'Failed to register. Please try again.'))
      .finally(() => setSuBusy(false))
  }

  function handleForgot(e) {
    e.preventDefault()
    setFgError('')
    if (!fgEmail || !/\S+@\S+\.\S+/.test(fgEmail)) { setFgError('Please enter a valid email.'); return }
    setFgBusy(true)
    apiForgotPassword(fgEmail)
      .then(() => setView('forgot-sent'))
      .catch((err) => setFgError(err.response?.data?.error || 'Something went wrong. Please try again.'))
      .finally(() => setFgBusy(false))
  }

  function handleGuest() {
    sessionStorage.setItem('dojo_guest', '1')
    navigate('/setup')
  }

  if (view === 'login') return (
    <div className="lp-page">
      <LeftPanel />
      <div className="lp-right">
        <div className="lp-form-wrap">
          <h1 className="lp-form-title">Welcome back</h1>
          <p className="lp-form-sub">Sign in to your account</p>

          <div className="lp-card">
            {loginSuccess && <p className="lp-success">{loginSuccess}</p>}
            <form onSubmit={handleLogin} noValidate>
              <div className="lp-field">
                <label htmlFor="lp-email">Email</label>
                <input id="lp-email" type="email" autoComplete="email"
                  placeholder="you@example.com" value={email}
                  onChange={e => { setEmail(e.target.value); setLoginError('') }} />
              </div>
              <div className="lp-field">
                <label htmlFor="lp-pw">Password</label>
                <div className="lp-input-wrap">
                  <input id="lp-pw" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                    placeholder="••••••••" value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError('') }} />
                  <button type="button" className="lp-eye" onClick={() => setShowPw(v => !v)}
                    tabIndex={-1} aria-label={showPw ? 'Hide password' : 'Show password'}>
                    <EyeIcon open={showPw} />
                  </button>
                </div>
              </div>
              <div className="lp-row">
                <label className="lp-remember">
                  <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                  Remember me
                </label>
                <button type="button" className="lp-link" onClick={() => setView('forgot')}>
                  Forgot password?
                </button>
              </div>
              {loginError && <p className="lp-error">{loginError}</p>}
              <button className="lp-submit" type="submit" disabled={busy}>
                {busy ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="lp-divider">or</div>

            <button type="button" className="lp-guest" onClick={handleGuest}>
              Try for free — no account needed
            </button>
          </div>

          <p className="lp-switch">
            No account?{' '}
            <button type="button" className="lp-link" onClick={() => setView('signup')}>Create one</button>
          </p>
        </div>
      </div>
    </div>
  )

  if (view === 'signup') return (
    <div className="lp-page">
      <LeftPanel />
      <div className="lp-right">
        <div className="lp-form-wrap">
          <h1 className="lp-form-title">Create an account</h1>
          <p className="lp-form-sub">We'll send a verification link to your email</p>

          <div className="lp-card">
            {suSent ? (
              <div className="lp-sent">
                <div className="lp-sent__icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3>Check your email</h3>
                <p>We sent a verification code to <strong>{suEmail}</strong>. Follow the link to set your password.</p>
                <div className="lp-sent__actions">
                  <button className="lp-submit" type="button"
                    onClick={() => navigate(`/verify-email?email=${encodeURIComponent(suEmail)}`)}>
                    Enter code manually
                  </button>
                  <button type="button" className="lp-guest" onClick={() => setView('login')}>
                    Back to sign in
                  </button>
                </div>
              </div>
            ) : (
              <>
                <form onSubmit={handleSignup} noValidate>
                  <div className="lp-field">
                    <label htmlFor="su-name">Full Name</label>
                    <input id="su-name" type="text" autoComplete="name"
                      placeholder="Alex Johnson" value={suName}
                      onChange={e => { setSuName(e.target.value); setSuError('') }} />
                  </div>
                  <div className="lp-field">
                    <label htmlFor="su-email">Email</label>
                    <input id="su-email" type="email" autoComplete="email"
                      placeholder="you@example.com" value={suEmail}
                      onChange={e => { setSuEmail(e.target.value); setSuError('') }} />
                  </div>
                  {suError && <p className="lp-error">{suError}</p>}
                  <button className="lp-submit" type="submit" disabled={suBusy}>
                    {suBusy ? <><span className="lp-spinner" />Sending code…</> : 'Create account'}
                  </button>
                </form>
                <div className="lp-divider">or</div>
                <button type="button" className="lp-guest" onClick={handleGuest}>
                  Try for free — no account needed
                </button>
              </>
            )}
          </div>

          {!suSent && (
            <p className="lp-switch">
              Already have an account?{' '}
              <button type="button" className="lp-link" onClick={() => setView('login')}>Sign in</button>
            </p>
          )}
        </div>
      </div>
    </div>
  )

  if (view === 'forgot') return (
    <div className="lp-page">
      <LeftPanel />
      <div className="lp-right">
        <div className="lp-form-wrap">
          <h1 className="lp-form-title">Reset password</h1>
          <p className="lp-form-sub">We'll send a reset link to your email</p>

          <div className="lp-card">
            <form onSubmit={handleForgot} noValidate>
              <div className="lp-field">
                <label htmlFor="fg-email">Email address</label>
                <input id="fg-email" type="email" autoComplete="email"
                  placeholder="you@example.com" value={fgEmail}
                  onChange={e => { setFgEmail(e.target.value); setFgError('') }} autoFocus />
              </div>
              {fgError && <p className="lp-error">{fgError}</p>}
              <button className="lp-submit" type="submit" disabled={fgBusy}>
                {fgBusy ? <><span className="lp-spinner" />Sending…</> : 'Send reset link'}
              </button>
            </form>
          </div>

          <p className="lp-switch">
            <button type="button" className="lp-link lp-link--back" onClick={() => setView('login')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )

  if (view === 'forgot-sent') return (
    <div className="lp-page">
      <LeftPanel />
      <div className="lp-right">
        <div className="lp-form-wrap">
          <div className="lp-card">
            <div className="lp-sent">
              <div className="lp-sent__icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <h3>Check your inbox</h3>
              <p>Sent a reset link to <strong>{fgEmail}</strong>. Check your spam if you don't see it.</p>
              <div className="lp-sent__actions">
                <button className="lp-submit" type="button" onClick={() => { setFgEmail(''); setView('forgot') }}>
                  Try a different email
                </button>
                <button type="button" className="lp-guest" onClick={() => setView('login')}>
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return null
}

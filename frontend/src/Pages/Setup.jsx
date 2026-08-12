import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useInterviewStore } from '../store/store'
import { generateQuestions, getQuota } from '../services/api'
import Navbar from '../Components/shared/Navbar'
import '../styles/Setup.css'

const MIN_CHARS = 50
const MIN_WORDS = 8

const GENERATION_ERROR = "We couldn't generate questions right now. Please try again."
const PRESETS = [
  {
    label: 'Frontend Engineer',
    title: 'Frontend Engineer',
    desc: `We're looking for a Frontend Engineer to build fast, accessible, and polished user interfaces.\n\nResponsibilities:\n- Build and maintain React components and pages\n- Collaborate with designers to implement pixel-perfect UIs\n- Optimize for performance and cross-browser compatibility\n- Write clean, testable JavaScript/TypeScript\n\nRequired skills:\n- 3+ years with React and modern JS (ES6+)\n- Strong CSS and responsive design skills\n- Experience with REST APIs and state management (Redux, Zustand)\n- Familiarity with testing (Jest, React Testing Library)`,
  },
  {
    label: 'Fullstack Go',
    title: 'Fullstack Go Developer',
    desc: `We need a Fullstack Developer comfortable owning features end-to-end, from REST API design in Go to building the React frontend.\n\nResponsibilities:\n- Design and build REST APIs in Go\n- Build React UIs that consume those APIs\n- Write SQL queries and manage PostgreSQL schemas\n- Deploy and monitor services on cloud infrastructure\n\nRequired skills:\n- 2+ years with Go (Gin or Echo preferred)\n- Solid React and TypeScript skills\n- PostgreSQL and basic DevOps (Docker, CI/CD)`,
  },
  {
    label: 'DevOps / SRE',
    title: 'DevOps / Site Reliability Engineer',
    desc: `Looking for a DevOps/SRE to own our infrastructure reliability, deployment pipelines, and observability stack.\n\nResponsibilities:\n- Manage Kubernetes clusters and Helm charts\n- Build and maintain CI/CD pipelines (GitHub Actions)\n- Set up monitoring with Prometheus, Grafana, and alerting\n- Respond to incidents and drive post-mortems\n\nRequired skills:\n- Strong Kubernetes and Docker experience\n- Terraform or Pulumi for infrastructure as code\n- Scripting in Bash or Python\n- Experience with AWS or GCP`,
  },
  {
    label: 'Java Developer',
    title: 'Java Backend Developer',
    desc: `We're hiring a Java Backend Developer to build and scale microservices powering our core product.\n\nResponsibilities:\n- Develop microservices using Spring Boot\n- Design and optimise relational database schemas\n- Write unit and integration tests\n- Participate in code reviews and architecture discussions\n\nRequired skills:\n- 3+ years with Java and Spring Boot\n- Experience with JPA/Hibernate and PostgreSQL or MySQL\n- Familiarity with message queues (Kafka or RabbitMQ)\n- REST API design best practices`,
  },
  {
    label: 'Data Engineer',
    title: 'Data Engineer',
    desc: `We're looking for a Data Engineer to build reliable data pipelines and keep our analytics infrastructure running smoothly.\n\nResponsibilities:\n- Design and maintain ETL/ELT pipelines\n- Work with data warehouses (Snowflake, BigQuery, or Redshift)\n- Collaborate with analysts and ML engineers on data needs\n- Monitor pipeline health and data quality\n\nRequired skills:\n- Strong SQL and Python skills\n- Experience with Airflow or dbt\n- Familiarity with cloud storage (S3, GCS)\n- Understanding of data modelling and warehouse design`,
  },
]

function validate(desc) {
  const t = desc.trim()
  if (!t) return 'Job description is required.'
  if (t.split(/\s+/).filter(Boolean).length < MIN_WORDS)
    return 'Please enter a real job description — at least 8 words.'
  if (t.length < MIN_CHARS)
    return `Too short. Add ${MIN_CHARS - t.length} more characters.`
  return null
}

export default function Setup() {
  const { dispatch } = useInterviewStore()
  const navigate = useNavigate()
  const [jobTitle, setJobTitle] = useState('')
  const [jobDesc, setJobDesc] = useState('')
  const [activePreset, setActivePreset] = useState(null)
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [loadingStep, setLoadingStep] = useState(0)
  const [quota, setQuota] = useState(null)

  useEffect(() => {
    const hasToken = localStorage.getItem('dojo_token') || sessionStorage.getItem('dojo_token')
    if (hasToken) {
      getQuota().then(setQuota).catch(() => { })
    }
  }, [])

  const isAdmin = quota?.limit === -1
  const descError = touched ? validate(jobDesc) : null
  const isReady = !validate(jobDesc)

  const LOADING_MSGS = [
    'Reading job description...',
    'Identifying key skills...',
    'Crafting tailored questions...',
    'Almost ready...',
  ]

  function handlePreset(preset) {
    if (activePreset === preset.label) {
      setActivePreset(null)
      setJobTitle('')
      setJobDesc('')
    } else {
      setActivePreset(preset.label)
      setJobTitle(preset.title)
      setJobDesc(preset.desc)
      setError(null)
      setTouched(false)
    }
  }

  async function handleStart() {
    setTouched(true)
    const err = validate(jobDesc)
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    setLoadingStep(0)
    setLoadingMsg(LOADING_MSGS[0])

    let step = 0
    const msgInterval = setInterval(() => {
      step = Math.min(step + 1, LOADING_MSGS.length - 1)
      setLoadingStep(step)
      setLoadingMsg(LOADING_MSGS[step])
    }, 4000)

    try {
      dispatch({ type: 'SET_JOB_TITLE', jobTitle: jobTitle.trim() })
      dispatch({ type: 'SET_JOB_DESCRIPTION', jobDescription: jobDesc.trim() })

      const data = await generateQuestions(null, jobTitle.trim(), jobDesc.trim())

      if (!data?.sessionId || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error(GENERATION_ERROR)
      }

      dispatch({
        type: 'START_SESSION',
        sessionId: data.sessionId,
        questions: data.questions,
      })

      navigate('/interview')
    } catch (e) {
      if (e.response?.status === 402) {
        const code = e.response?.data?.code
        if (code === 'TRIAL_EXHAUSTED' || code === 'TRIAL_INVALID') {
          navigate('/login?trialEnded=1')
          return
        }
        navigate('/api-providers')
        return
      }
      setError(GENERATION_ERROR)
    } finally {
      clearInterval(msgInterval)
      setLoading(false)
      setLoadingMsg('')
      setLoadingStep(0)
    }
  }

  return (
    <div className="setup-page">
      <Navbar />
      <div className="setup-mesh" aria-hidden />
      <div className="setup-body">

        <div className="setup-left">
          <div className="setup-heading">
            <h1>Create Interview Session</h1>
            <p>Select a preset or paste your own job description below</p>
          </div>

          <div className="setup-presets">
            <div className="setup-presets__label">Quick presets</div>
            <div className="setup-presets__list">
              {PRESETS.map(preset => (
                <button
                  key={preset.label}
                  className={`setup-preset-chip${activePreset === preset.label ? ' setup-preset-chip--active' : ''}`}
                  onClick={() => handlePreset(preset)}
                  type="button"
                >
                  <span className="setup-preset-chip__check">✓</span>
                  {activePreset !== preset.label && <span className="setup-preset-chip__plus">+</span>}
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="setup-right">
          <div className="setup-card">
            <div className="setup-card__belt" aria-hidden />

            <div className="setup-field">
              <label htmlFor="job-title">
                Job Title <span className="setup-optional">(optional)</span>
              </label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={e => { setJobTitle(e.target.value); setActivePreset(null) }}
                placeholder="e.g., Senior Frontend Engineer"
              />
            </div>

            <div className="setup-field">
              <label htmlFor="job-desc">
                Job Description <span className="setup-required">*</span>
              </label>
              <textarea
                id="job-desc"
                className={descError || error ? 'has-error' : ''}
                value={jobDesc}
                onChange={e => { setJobDesc(e.target.value); setActivePreset(null); if (error) setError(null) }}
                onBlur={() => setTouched(true)}
                rows={12}
                placeholder="Paste the full job description here — responsibilities, required skills, tech stack, team info. The more detail you provide, the better your interview questions will be."
              />
              <div className="setup-field__footer">
                {(descError || error) ? (
                  <span className="setup-field__error">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {descError || error}
                  </span>
                ) : (
                  <span className={`setup-field__hint${jobDesc.length >= MIN_CHARS ? ' setup-field__hint--ok' : ''}`}>
                    {jobDesc.length >= MIN_CHARS ? '✓ Looks good' : `${MIN_CHARS - jobDesc.length} more characters needed`}
                  </span>
                )}
                <span className="setup-field__count">{jobDesc.length} / 2000</span>
              </div>
            </div>

            {quota && quota.plan === 'free' && !isAdmin && (
              <div className={`setup-quota ${quota.exceeded ? 'setup-quota--exceeded' : quota.remaining === 1 ? 'setup-quota--warning' : ''}`}>
                {quota.exceeded ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      You've used all {quota.limit} free sessions.{' '}
                      <button className="setup-quota__link" onClick={() => navigate('/api-providers')}>add your own API key</button>
                      {' '}to continue.
                    </span>
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      {quota.remaining} of {quota.limit} free session{quota.limit !== 1 ? 's' : ''} remaining.{' '}
                      {quota.remaining === 1 && (
                        <button className="setup-quota__link" onClick={() => navigate('/api-providers')}>Add API key</button>
                      )}
                    </span>
                  </>
                )}
              </div>
            )}

            <button
              className="setup-submit"
              onClick={handleStart}
              disabled={!isReady || loading || (quota?.exceeded && !isAdmin)}
            >
              {loading ? (
                <>
                  <span className="setup-spinner" />
                  {loadingMsg}
                  <span className="setup-loading-dots">
                    <span /><span /><span />
                  </span>
                </>
              ) : (
                <>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                  Generate Interview Questions
                </>
              )}
            </button>
          </div>
        </div>

        <div className="setup-sidebar">
          <aside className="setup-tips">
            <strong>Tips for better questions</strong>
            <ul>
              <li>Include the tech stack (React, Node.js, PostgreSQL, etc.)</li>
              <li>Mention seniority level and key responsibilities</li>
              <li>Add required skills or certifications</li>
            </ul>
          </aside>

          <button className="setup-api-key" type="button" onClick={() => navigate('/api-providers')}>
            <span>
              <strong>API Key</strong>
              <small>Manage your provider keys</small>
            </span>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  )
}

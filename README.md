<div align="center">

<a href="https://github.com/nkosikhumalo/Interview-Dojo">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=42&duration=3000&pause=1000&color=2496ED&center=true&vCenter=true&width=600&lines=FoxVue;Practice.+Speak.+Score.;Land+the+job." alt="FoxVue" />
</a>

<br/>

<p style="font-size:1.1rem; color:#64748b; max-width:520px; margin:0 auto;">
AI-powered mock interviews. Paste a job description, speak your answer, get a full breakdown. No fluff.
</p>

<br/>

[![Go](https://img.shields.io/badge/Go_1.25-00ADD8?style=for-the-badge&logo=go&logoColor=white)](https://go.dev)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL_16-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)

<br/>

<img src="docs/images/Generated Image August 13, 2026 - 4_33PM.png" alt="FoxVue" width="100%" />

<br/>

![wave](https://capsule-render.vercel.app/api?type=waving&color=2496ED&height=80&section=header&fontSize=0)

</div>

---

<div align="center">

<a href="#stack">Stack</a> &nbsp;·&nbsp;
<a href="#features">Features</a> &nbsp;·&nbsp;
<a href="#how-it-works">How it Works</a> &nbsp;·&nbsp;
<a href="#project-structure">Structure</a> &nbsp;·&nbsp;
<a href="#running-locally">Run Locally</a> &nbsp;·&nbsp;
<a href="#running-with-docker">Docker</a> &nbsp;·&nbsp;
<a href="#environment-variables">Env Vars</a> &nbsp;·&nbsp;
<a href="#api-reference">API</a> &nbsp;·&nbsp;
<a href="#authentication">Auth</a> &nbsp;·&nbsp;
<a href="#database">Database</a> &nbsp;·&nbsp;
<a href="#cicd-pipeline">CI/CD</a> &nbsp;·&nbsp;
<a href="#deployment">Deploy</a>

</div>

---

<div align="center">

```
Paste job description  →  speak your answer  →  get scored
```

</div>

FoxVue generates tailored interview questions using Gemini AI, records your voice, transcribes it live, and returns a full breakdown — STAR rating, clarity score, technical depth, strengths, weaknesses, and a sample answer.

---

<h2 id="stack" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Stack</h2>

Each technology was chosen for a specific reason — nothing is here for the sake of it.

| Layer | Technology | Why |
|---|---|---|
| Backend | Go 1.25 + Gin | Fast, low memory, great for concurrent voice and AI workloads |
| Frontend | React 19 + Vite 8 | Component model fits the interview UI well, Vite keeps builds fast |
| Database | PostgreSQL 16 | Relational — users, sessions, and answers have clear relationships |
| AI | Gemini AI (multi-key fallback) | Generates questions and scores answers. Multiple keys prevent quota blocks |
| Auth | JWT + OAuth (Google, Microsoft) | JWT keeps the backend stateless. OAuth lets users skip the signup form |
| Email | SMTP via Gmail | Email verification and password reset — keeps accounts secure |
| Containers | Docker + Docker Hub | Consistent builds across dev and prod, images stored on Docker Hub |
| Frontend Deploy | Vercel | Zero-config React deployments, global CDN out of the box |
| Backend Deploy | Azure | Runs the containerized Go server in production |

---

<h2 id="features" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Features</h2>

- Voice recording with live waveform visualizer
- AI-generated questions tailored to the job description
- STAR scoring — clarity, technical depth, communication
- Email verification flow + JWT auth + OAuth (Google + Microsoft)
- BYOK — bring your own Gemini/OpenAI/Anthropic key, AES-256 encrypted at rest
- Secure password reset via SMTP
- Free tier (2 sessions) · BYOK users get unlimited sessions
- Guest trial mode — no account needed to try it
- Full interview history with per-answer breakdown

---

<h2 id="how-it-works" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">How it Works</h2>

Understanding the flow end-to-end helps when debugging or extending the app.

**1. You paste a job description**
The frontend sends it to `/api/interview/generate-questions`. The backend passes it to Gemini AI which returns questions tailored to that specific role and skill set.

**2. You speak your answer**
The browser captures your mic via the `useMediaRecorder` hranscribe`, which converts it to text and streams it back over WebSocket (`/api/ws`) so you see it live as you speak.

**3. Your answer gets scored**
The transcript is sent to `/api/interview/evaluate-answer`. Gemini scores it across four dimensions — overall score, clarity, technical depth, and communication — and returns strengths, weaknesses, a STAR breakdown, and a sample answer.

**4. Results are saved**
If you are logged in, the session, questions, and all answers are persisted to PostgreSQL. You can review everything later from the history page.

**5. API key management (BYOK)**
Users can bring their own Gemini key under `/api/apikeys`. Keys are encrypted with AES-256-GCM before being stored — the raw key never touches the database in plaintext. When active, your key is used instead of the platform shared keys.

**6. Guest trial**
Users without an account get 3 free trial runs tracked by IP address via the `trials` table. After that they are prompted to sign up.

---

<h2 id="project-structure" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Project Structure</h2>

```
FoxVue/
├── backend/
│   ├── ai/          # Gemini client + multi-key registry. Rotates keys on quota errors.
│   ├── api/         # All HTTP handlers, middleware (auth, trial), and route registration.
│   ├── db/          # PostgreSQL connection, auto-migrations on startup, and all repo functions.
│   ├── email/       # SMTP mailer for verification codes and password resets.
│   ├── interview/   # Question generation logic and answer scoring (STAR framework).
│   ├── models/      # Shared structs (User, Session, Question, Answer) used across packages.
│   ├── speech/      # Wraps the transcription service — converts audio bytes to text.
│   ├── storage/     # DB-backed session store so interview state survives restarts.
│   ├── Dockerfile   # Multi-stage build: compiles Go binary on Alpine, runs on Alpine.
│   ├── main.go      # Entry point — loads env, connects DB, sets up CORS, starts Gin server.
│   └── .env.example # Template for all required environment variables.
├── frontend/
│   ├── src/
│   │   ├── Components/  # Reusable pieces: FeedbackModal, Timer, Transcript, VoiceVisualizer.
│   │   ├── Pages/       # One file per route: Interview, Setup, History, Pricing, Login, etc.
│   │   ├── hooks/       # useMediaRecorder (captures audio), useSpeechToText (streams text).
│   │   ├── services/    # Axios API client — all backend calls go through here.
│   │   ├── store/ user info, session data).
│   │   └── styles/      # Per-page CSS files kept separate to avoid global bleed.
│   ├── Dockerfile       # Multi-stage: builds React app with Vite, serves via nginx.
│   └── vite.config.js   # Vite config — fast dev server and optimized production builds.
└── docs/
    └── ci-cd-docker-github-actions.md  # Full CI/CD setup guide for this project.
```

---

<h2 illy</h2>

<h3 style="font-weight:600; margin-top:1rem;">Prerequisites</h3>

You need these installed before starting:

- [Go 1.25+](https://go.dev/dl/) — runs the backend server
- [Node.js 20+](https://nodejs.org) — runs the frontend dev server
- [PostgreSQL 16](https://www.postgresql.org/download/) — stores users, sessions, and answers
- A [Gemini API key](https://ai.google.dev) — powers question generation and answer scoring

<h3 style="font-weight:600; margin-top:1rem;">Backend</h3>

```bash
git clone https://github.com/nkosikhumalo/Interview-Dojo.git
cd Interview-Dojo/backend

# Copy the env template and fill in your values
cp .env.example .env

# Start the server — connects to Postgres and runs migrations automatically
go run main.go
# runs on http://localhost:8080
```

> The backend runs migrations on every startup. If a table already exists it skips it — safe to restart as many times as needed.

<h3 style="font-weight:600; margin-top:1rem;">Frontend</h3>

```bash
# Open a new terminal — backend needs to stay running
cd Interview-Dojo/frontend

npm install
npm run dev
# runs on http://localhost:5173
```

> Make sure `FRONTEND_URL=http://localhost:5173` is in your backend `.env` — this controls which origin is allowed by CORS.

---

<h2 id="running-with-docker" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Running with Docker</h2>

Docker lets you run both services without installing Go or Node locally. Each app has its own multe container.

```bash
# Build and run the backend
docker build -f backend/Dockerfile backend -t foxvue-backend
docker run -p 8080:8080 --env-file backend/.env foxvue-backend

# Build and run the frontend (served by nginx on port 80)
docker build -f frontend/Dockerfile frontend -t foxvue-frontend
docker run -p 80:80 foxvue-frontend
```

> The `--env-file` flag passes your `.env` variables into the container at runtime. Never bake secrets into the image itself.

For the full Docker + CI/CD setup guide including Docker Hub publishing, see **[docs/ci-cd-docker-github-actions.md](docs/ci-cd-docker-github-actions.md)**

---

<h2 id="environment-variables" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Environment Variables</h2>

Copy `backend/.env.example` to `backend/.env` and fill in each value. All are required unless noted.

| Variable | Description |
|---|---|
| `PORT` | Port the backend listens on. Defaults to `8080` if not set. |
| `FRONTEND_URL` | Your React app URL. Controls CORS — if wrong, the browser blocks all API calls. |
| `OAUTH_REDIRECT_BASE` | Base URL OAuth providers redirect back to. Must match what you registered in Google/Microsoft consoles. |
| `DATABASE_URL` | Full PostgreSQL connection string including host, port, db name, and sslmode. |
| `JWT_SECRET` | Signs and verifies JWT tokens. Use a long random string — anyone with this can forge tokens. |
| `API_KEY_ENCRYPTION_SECRET` | Exactly 32 characters. Used to AES-256 encrypt user API keys before storing in the DB. |
| `GEMINI_API_KEYS` | Comma-separated Gemini keys. The backend rotates through them when one hits its quota limit. |
| `GOOGLE_CLIENT_ID` | From the Google Cloud Console. Needed for Google OAuth login. |
| `GOOGLE_CLIENT_SECRET` | Paired with the client ID. Keep this private. |
| `MICROSOFT_CLIENT_ID` | From Azure App Registration. Needed for Microsoft OAuth login. |
| `MICROSOFT_CLIENT_SECRET` | Paired with the client ID above. |
| `MICROSOFT_TENANT` | Usually `common` — allows both personal and work Microsoft accounts to log in. |
| `SMTP_HOST` | SMTP server address. Use `smtp.gmail.com` for Gmail. |
| `SMTP_PORT` | `587` for TLS (recommended). |
| `SMTP_USER` | The email address emails are sent from. |
| `SMTP_PASS` | Gmail App Password — not your regular Gmail password. Generate one in Google account security settings. |
| `SMTP_FROM` | Display address shown in the From field of outgoing emails. |

> For production databases always use `sslmode=require` in `DATABASE_URL`. Local dev can use `sslmode=disable`. See [Database](#database).

---

<h2 id="api-reference" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">API Reference</h2>

Routes are split into three groups — public, protected (JWT required), and interview routes open to both guests and logged-in users.

<h3 style="font-weight:600; margin-top:1rem;">Auth — Public</h3>

No token needed. Handles registration, login, and password recovery.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Start registration — sends a verification code to the email |
| POST | `/api/auth/check-code` | Validate the emailed verification code |
| POST | `/api/auth/complete-registration` | Finish signup and create the user account |
| POST | `/api/auth/resend-verification` | Send a fresh code if the first one expired |
| POST | `/api/auth/login` | Login with email and password, returns a signed JWT |
| POST | `/api/auth/forgot-password` | Send a password reset link to the email |
| POST | `/api/auth/reset-password` | Submit the new password using the reset token |
| GET | `/auth/:provider` | Kick off OAuth flow — `:provider` is `google` or `microsoft` |
| GET | `/auth/:provider/callback` | OAuth provider redirects here after the user approves |

<h3 style="font-weight:600; margin-top:1rem;">Protected — requires JWT</h3>

Pass `Authorization: Bearer <token>` in the header. Requires a logged-in account.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/auth/me` | Returns the current user profile and plan |
| GET | `/api/quota` | How many sessions used and what the limit is |
| POST | `/api/apikeys` | Save a new API key (encrypted before storing) |
| GET | `/api/apikeys` | List saved keys — shows last 4 chars only, never the full key |
| POST | `/api/apikeys/:id/test` | Validate a key against the provider API |
| POST | `/api/apikeys/:id/activate` | Set a key as the active one used for AI calls |
| DELETE | `/api/apikeys/:id` | Permanently remove a saved key |
| GET | `/api/interview/sessions` | All past interview sessions for this user |
| GET | `/api/interview/history` | Full history with all questions and scored answers |
| DELETE | `/api/interview/sessions/:sessionId` | Delete a session and all its answers |

<h3 style="font-weight:600; margin-top:1rem;">Interview — guests + JWT users</h3>

Open to everyone. Guests are limited to 3 attempts via the trial middleware before being prompted to sign up.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/interview/generate-questions` | Takes a job description, returns AI-generated questions |
| POST | `/api/interview/evaluate-answer` | Takes a transcript, returns STAR score and feedback |
| POST | `/api/transcribe` | Converts uploaded audio to text |
| GET | `/api/ws` | WebSocket — streams transcription live during the interview |
| GET | `/api/trial/status` | How many trial attempts the guest has remaining |

---

<h2 id="authentication" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Authentication</h2>

Three methods supported — all result in a JWT the frontend stores and sends with every protected request.

- **Email + password** — two-step flow: signup sends a code to the email, user verifies, account is created. Prevents fake accounts and ensures valid email addresses.
- **Google OAuth** — redirects to Google, user approves, backend creates or links the account on callback.
- **Microsoft OAuth** — same flow, works with personal and work/school Microsoft accounts.

All protected routes check `Authorization: Bearer <token>`. The `RequireAuth` middleware validates the JWT signature using `JWT_SECRET` and rejects expired or tampered tokens.

Guest users bypass auth but hit `TrialMiddleware` instead — it checks their IP against the `trials` table and blocks them after 3 sessions.

---

<h2 id="database" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Database</h2>

PostgreSQL 16. The schema lives in `backend/db/db.go` and is applied automatically on everdb.Connect()`. No separate migration tool needed — just run the server and the tables are there.

**Local:**
```
postgres://postgres:yourpassword@localhost:5432/interview_dojo?sslmode=disable
```

**Production (Neon / Azure):**
```
postgres://user:password@your-host:5432/your-db?sslmode=require
```

> `sslmode=disable` is fine locally since traffic never leaves your machine. In production always use `sslmode=require` to encrypt the connection between the app and the DB server.

**Connecting via DBeaver** — use individual fields, not the URL (DBeaver uses JDBC which needs `postgresql://` not `postgres://`):

| Field | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `interview_dojo` |
| Username | `postgres` |
| Password | your password |

**Tables and what they store:**

| Table | Purpose |
|---|---|
| `users` | Accounts — email, hashed password, OAuth provider, plan, role |
| `interview_sessions` | Each interview run — linked to a user, stores job title and description |
| `session_questions` | AI-generated questions per session |
| `interview_answers` | Scored answers — transcript, STAR scores, strengths, weaknesses, sample answer |
| `user_api_keys` | Encrypted user-provided API keys with provider info and active status |
| `email_verifications` | Pending signups waiting for email code confirmation |
| `trials` | Guest trial usage tracked by IP address |

---

<h2 id="cicd-pipeline" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">CI/CD Pipeline</h2>

FoxVue uses GitHub Actions to automate testing and deployment. Every change goes through the pipeline before reaching production.

**On every push and pull request:**
- Go tests run against the backend (`go test ./...`)
- React build runs to catch frontend errors early

**On merges to `main` only:**
- Docker images for backend and frontend are built
- Images are pushed to Docker Hub tagged as `latest`

Pull requests are safe to open freely — they test but never publish. Only reviewed and merged code ships.

Full setup guide covering Docker Hub tokens, GitHub secrets, the workflow file, and common failure fixes:

**[docs/ci-cd-docker-github-actions.md](docs/ci-cd-docker-github-actions.md)**

---

<h2 id="deployment" style="font-size:1.4rem; font-weight:700; border-left:4px solid #2496ED; padding-left:12px;">Deployment</h2>

<h3 style="font-weight:600; margin-top:1rem;">Frontend — Vercel</h3>

Vercel picks up the `frontend/` folder and handles the rest. The `dist/` output from Vite is served from Vercel's global CDN.

```bash
cd frontend
npm run build
# connect the repo to Vercel — it deploys automatically on every push to main
```

Set `VITE_API_URL` in Vercel environment variables to your backend's public URL. Without this the frontend will not know where to send API requests.

<h3 style="font-weight:600; margin-top:1rem;">Backend — Azure / any Docker host</h3>

The backend iun a container.

```bash
docker pull your-dockerhub-username/foxvue-backend:latest
docker run -p 8080:8080 \
  -e DATABASE_URL="postgres://..." \
  -e JWT_SECRET="..." \
  -e GEMINI_API_KEYS="..." \
  your-dockerhub-username/foxvue-backend:latest
```

> Set `FRONTEND_URL` to your Vercel domain (e.g. `https://foxvue.vercel.app`). If this does not match, the browser gets CORS errors and no API calls will go through.

---

D; padding-left:12px;">Contributing</h2>

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes and test them locally
4. Push and open a pull request against `main`

The CI pipeline runs automatically on your PR — Go tests and the React build both need to pass before merging.

---

<div align="center">

![wave](https://capsule-render.vercel.app/api?type=waving&color=2496ED&height=80&section=footer&fontSize=0)

Built by **Nkosimphile Khumalo**

</div>

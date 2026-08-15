<div align="center">

<h1 style="font-size:2.2rem; font-weight:900; letter-spacing:-0.5px; border-bottom:3px solid #00ADD8; padding-bottom:12px; display:inline-block;">golangci-lint — FoxVue Backend</h1>

<p>How Go code quality is enforced in this project, what was found, and why it matters.</p>

</div>

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">What is golangci-lint?</h2>

golangci-lint is a fast, parallel Go linter runner. Instead of running one linting tool at a time, it runs many of them simultaneously in a single pass and aggregates the results. It is the industry standard for Go code quality checks — used by major open source projects and supported natively as a GitHub Action.

The key difference from just running `go vet` or `gofmt` manually is that golangci-lint combines a whole suite of analysis tools into one command. A single `golangci-lint run` replaces what would otherwise be five or six separate tools you'd need to install and run individually.

It is configured via a `.golangci.yml` file in the project root (in this project: `backend/.golangci.yml`).

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">FoxVue Configuration</h2>

```yaml
version: "2"

run:
  timeout: 3m

linters:
  enable:
    - govet
    - errcheck
    - staticcheck
    - unused
    - misspell
    - ineffassign

formatters:
  enable:
    - gofmt
    - goimports
  settings:
    goimports:
      local-prefixes:
        - foxvue-api
```

In golangci-lint v2, formatters (gofmt, goimports) are separated from linters. Linters find logical and structural issues. Formatters enforce style and layout.

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">What Each Tool Does</h2>

<h3 style="font-weight:600; margin-top:1rem;">Linters</h3>

**govet**
The official Go static analyzer. It reports constructs that are technically valid Go but almost certainly wrong — things like passing the wrong number of arguments to `fmt.Printf`, copying a mutex by value, or using an unreachable loop variable in a goroutine closure. The compiler won't catch these. govet will.

**errcheck**
Go functions often return an error as the last value. A very common mistake is silently ignoring it — calling a function, getting an error back, and doing nothing with it. This is how silent failures happen in production. errcheck flags every place where an error return value is discarded without acknowledgment.

Example of what it catches:
```go
// BAD — error is silently dropped
resp.Body.Close()

// GOOD — error is explicitly acknowledged
_ = resp.Body.Close()
// or better
if err := resp.Body.Close(); err != nil {
    log.Printf("close error: %v", err)
}
```

**staticcheck**
The most powerful linter in the suite. It performs deep analysis across the codebase and catches things like:
- Deprecated API usage (e.g. `rand.Seed` removed in Go 1.20)
- Error strings ending with punctuation (Go convention says they should not, since they get wrapped into larger messages)
- Using `WriteString(fmt.Sprintf(...))` when `fmt.Fprintf` is cleaner and avoids an intermediate allocation
- Code that can never be reached
- API misuse patterns that are technically valid but semantically wrong

**unused**
Finds functions, types, constants, and variables that are declared but never called or referenced anywhere. Dead code clutters the codebase, confuses new contributors, and sometimes indicates a feature was half-removed.

**misspell**
Scans comments and string literals for common English spelling mistakes. Small thing, but spelling errors in comments and error messages make the codebase look careless and can confuse developers reading logs.

**ineffassign**
Finds assignments that are immediately overwritten before the assigned value is ever read. These are usually leftover from refactoring — the assignment does nothing but wastes a line and signals confusion about intent.

<h3 style="font-weight:600; margin-top:1rem;">Formatters</h3>

**gofmt**
The standard Go formatter. Enforces a single canonical style for spacing, indentation, and brace placement across all Go code. There is no debate about style in Go — gofmt decides, and everyone follows it. If a file is not gofmt-formatted, CI fails.

**goimports**
A superset of gofmt. It does everything gofmt does, plus it automatically organises import blocks into groups (standard library, then external packages, then internal packages) and removes imports that are no longer used. The `local-prefixes: foxvue-api` setting tells it to treat `foxvue-api/...` imports as internal and group them separately from third-party packages.

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">What It Found in FoxVue</h2>

When golangci-lint ran on the FoxVue backend for the first time it reported **25 issues** across 10 files. Here is a breakdown of what was found and fixed.

<h3 style="font-weight:600; margin-top:1rem;">errcheck — 13 issues</h3>

The most common category. All across the codebase, error return values from `Close()`, `Rollback()`, and `r.Run()` were being silently discarded.

| File | Issue |
|---|---|
| `ai/gemini.go` | `resp.Body.Close()` — HTTP response body close ignored |
| `api/apikey_handler.go` | Two `resp.Body.Close()` calls in provider test functions |
| `api/transcribe_handler.go` | `file.Close()` on uploaded audio file |
| `api/ws_handler.go` | `conn.Close()` on WebSocket connection |
| `api/oauth_handler.go` | Two `resp.Body.Close()` calls in OAuth token exchange |
| `db/apikey_repo.go` | `tx.Rollback()` — database transaction rollback ignored |
| `db/session_repo.go` | Three `rows.Close()` calls across query functions |
| `email/mailer.go` | `client.Close()` on SMTP client |
| `main.go` | `r.Run()` — the server's own startup error was being dropped |

The most critical of these was `main.go`. If `r.Run()` failed to bind to a port — say the port was already in use — the server would exit silently with no log message. It now calls `log.Fatalf` on failure so the reason is always printed.

<h3 style="font-weight:600; margin-top:1rem;">staticcheck — 8 issues</h3>

**Error strings with punctuation (ST1005) — 3 issues in `api/auth_handler.go`**

Go convention is that error strings should not start with a capital letter and should not end with punctuation. The reason is that errors are often wrapped and embedded into larger messages — punctuation in the middle of a sentence looks wrong.

```go
// Before
return fmt.Errorf("Password must be at least 8 characters.")

// After
return fmt.Errorf("password must be at least 8 characters")
```

**Incorrect error variable naming (ST1012) — 1 issue in `db/apikey_repo.go`**

Go convention for package-level error variables is `errFoo`, not `fooErr` or `fooError`. The variable `sqlxNoRows` was renamed to `errSQLNoRows`.

**`WriteString(fmt.Sprintf(...))` pattern (QF1012) — 3 issues in `email/mailer.go`**

Using `WriteString(fmt.Sprintf(...))` creates an unnecessary intermediate string. `fmt.Fprintf` writes directly to the builder with no allocation.

```go
// Before
sb.WriteString(fmt.Sprintf("From: FoxVue <%s>\r\n", from))

// After
fmt.Fprintf(&sb, "From: FoxVue <%s>\r\n", from)
```

**Deprecated `rand.Seed` (SA1019) — 1 issue in `interview/question_bank.go`**

`rand.Seed` has been deprecated since Go 1.20. The global random number generator is now automatically seeded — calling `rand.Seed` manually does nothing useful. The fix was to create a local `rand.New(rand.NewSource(...))` generator instead.

<h3 style="font-weight:600; margin-top:1rem;">unused — 4 issues</h3>

Four functions existed in the codebase but were never called from anywhere.

| File | Function | Action taken |
|---|---|---|
| `api/question_handler.go` | `getQuestion` | Wired up to `GET /api/question` route |
| `api/reset_handler.go` | `testEmail` | Removed — was a dev debugging helper left in production code |
| `api/transcribe_handler.go` | `resolveGeminiKeys` | Removed — superseded by the method-based `resolveKeys` |
| `api/ws_handler.go` | `notImplementedWebsocket` | Removed — placeholder that was never hooked up |

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">What's Interesting About It</h2>

**It's not just style.** Most linters people think of enforce formatting or naming conventions. golangci-lint goes deeper — errcheck and staticcheck find real bugs that the Go compiler itself will not catch. The server startup error being silently dropped in `main.go` is a good example. That is a genuine operational bug, not a style issue.

**It's fast because it's parallel.** Each linter runs as a separate goroutine. On a modern machine the full suite finishes in seconds even on a large codebase, which is why it's practical to run on every pull request.

**`defer x.Close()` is a well-known Go gotcha.** Many Go developers write `defer resp.Body.Close()` without thinking, but `Close()` returns an error. In most cases it is safe to ignore, but blindly discarding it means you never see connection pool errors, file descriptor leaks, or incomplete writes. The idiomatic fix `defer func() { _ = resp.Body.Close() }()` makes the intent explicit — you are choosing to ignore the error, not forgetting it.

**It caught a deprecated API that still compiles.** `rand.Seed` compiles without warnings in Go 1.25. The only way to know it is deprecated is either to read the release notes or run staticcheck. This is exactly the category of issue that quietly accumulates in codebases over time.

**Dead code is more dangerous than it looks.** The four unused functions were not just clutter. `testEmail` in `reset_handler.go` was a dev debugging endpoint that had no route registered, but it imported and used live SMTP credentials. If someone had accidentally wired it up to a route it would have been an unauthenticated email sending endpoint.

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">Running It Locally</h2>

```bash
# From the backend directory
cd backend
golangci-lint run
```

Expected output when everything is clean:
```
0 issues.
```

To auto-fix formatting:
```bash
gofmt -w ./
goimports -w ./
```

golangci-lint itself does not auto-fix logic issues — those require judgment. Formatting fixes are automatic.

---

<h2 style="font-size:1.4rem; font-weight:700; border-left:4px solid #00ADD8; padding-left:12px;">CI Integration</h2>

golangci-lint runs automatically on every push and pull request via the GitHub Actions pipeline in `.github/workflows/ci-cd.yml`. A pull request with linting errors will not pass CI.

The pipeline uses the official `golangci/golangci-lint-action@v6` action which caches the linter binary and lint results between runs, keeping the CI fast.

---

<div align="center">

**FoxVue · Interview-Dojo · Nkosimphile Khumalo**

</div>

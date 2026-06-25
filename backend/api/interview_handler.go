package api

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"foxvue-api/ai"
	"foxvue-api/db"
	"foxvue-api/models"
	"foxvue-api/storage"
)

type interviewHandler struct {
	store    storage.SessionStore
	sessions *db.SessionRepo
	apiKeys  *db.APIKeyRepo
	quota    *db.QuotaRepo
	registry *ai.Registry
}

func newInterviewHandler(store storage.SessionStore, sessions *db.SessionRepo, apiKeys *db.APIKeyRepo, quota *db.QuotaRepo) *interviewHandler {
	return &interviewHandler{
		store:    store,
		sessions: sessions,
		apiKeys:  apiKeys,
		quota:    quota,
		registry: ai.NewRegistry(),
	}
}

func (h *interviewHandler) providerForUser(userID string) (ai.Provider, bool) {
	if userID == "" {
		return h.registry.ForUser("", ""), false
	}
	key, _ := h.apiKeys.GetDecrypted(userID, "gemini")
	hasByok := key != ""
	return h.registry.ForUser(key, "gemini"), hasByok
}

// POST /api/interview/generate-questions
func (h *interviewHandler) generateQuestions(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 32*1024) // 32 KB
	var req models.GenerateQuestionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	provider, hasByok := h.providerForUser(uid)

	// Enforce quota only for authenticated users on platform keys
	if uid != "" && !hasByok {
		status, err := h.quota.Get(uid)
		if err == nil && status.Exceeded {
			c.JSON(http.StatusPaymentRequired, gin.H{
				"error":            "Free plan limit reached",
				"code":             "QUOTA_EXCEEDED",
				"freeSessionsUsed": status.FreeSessionsUsed,
				"limit":            status.Limit,
			})
			return
		}
	}

	session := h.store.Create(req.JobDescription)

	if uid != "" {
		go func() {
			_ = h.sessions.CreateSession(session.ID, uid, req.JobTitle, req.JobDescription)
			if !hasByok {
				_ = h.quota.Increment(uid)
			}
		}()
	}

	questions, err := provider.GenerateQuestions(req.JobTitle, req.JobDescription)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate questions: " + err.Error()})
		return
	}

	go func() {
		_ = h.sessions.SaveQuestions(session.ID, questions)
	}()

	if len(questions) > 0 {
		h.store.UpdateQuestion(session.ID, &questions[0])
	}

	resp := gin.H{
		"sessionId": session.ID,
		"questions": questions,
	}

	// Include trial info for guest users so the frontend can show remaining tries
	if uid == "" {
		if remaining, ok := c.Get("trialRemaining"); ok {
			resp["trialRemaining"] = remaining
		}
	}

	c.JSON(http.StatusOK, resp)
}

// POST /api/interview/evaluate-answer
func (h *interviewHandler) evaluateAnswer(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 64*1024) // 64 KB
	var req models.EvaluateAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
		return
	}

	userID, _ := c.Get("userID")
	uid, _ := userID.(string)

	provider, _ := h.providerForUser(uid)
	result, err := provider.EvaluateAnswer(req.Question, req.Transcript)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to evaluate answer: " + err.Error()})
		return
	}

	go func() {
		_ = h.sessions.SaveAnswer(req.SessionID, req.Question, req.Transcript, result)
	}()

	c.JSON(http.StatusOK, result)
}

// GET /api/interview/sessions
func (h *interviewHandler) getAllSessions(c *gin.Context) {
	userID, _ := c.Get("userID")
	uid, ok := userID.(string)
	if !ok || uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}
	sessions, err := h.sessions.GetAllSessions(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to load sessions"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"sessions": sessions})
}

// GET /api/interview/history
func (h *interviewHandler) getHistory(c *gin.Context) {
	sessionID := c.Query("sessionId")
	if sessionID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing sessionId"})
		return
	}

	userID, _ := c.Get("userID")
	uid, _ := userID.(string)
	if uid == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	jobTitle, jobDesc, createdAt, err := h.sessions.GetSessionMetaForUser(sessionID, uid)
	if err != nil {
		// Return 404 regardless of whether it doesn't exist or belongs to another user
		c.JSON(http.StatusNotFound, gin.H{"error": "session not found"})
		return
	}
	history, _ := h.sessions.GetSessionHistory(sessionID)
	if history == nil {
		history = []models.HistoryEntry{}
	}
	c.JSON(http.StatusOK, gin.H{
		"sessionId":      sessionID,
		"jobTitle":       jobTitle,
		"jobDescription": jobDesc,
		"createdAt":      createdAt,
		"history":        history,
	})
}

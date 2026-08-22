package routes

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/jksn12/JKAPI/internal/handler"
	servermiddleware "github.com/jksn12/JKAPI/internal/server/middleware"
	"github.com/stretchr/testify/require"
)

func TestModelPlazaRoutesDoNotApplyBackendModeUserGuard(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()

	RegisterModelPlazaRoutes(
		router.Group("/api/v1"),
		&handler.Handlers{ModelPlaza: &handler.ModelPlazaHandler{}},
		servermiddleware.OptionalJWTAuthMiddleware(func(c *gin.Context) { c.Next() }),
		nil,
	)

	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodGet, "/api/v1/model-plaza", nil)
	router.ServeHTTP(recorder, request)

	// The nil handler setting service intentionally returns 404. Reaching the
	// handler instead of receiving backend-mode 403 proves the route is public.
	require.Equal(t, http.StatusNotFound, recorder.Code)
}

package routes

import (
	"github.com/jksn12/JKAPI/internal/handler"
	"github.com/jksn12/JKAPI/internal/server/middleware"

	"github.com/gin-gonic/gin"
)

// RegisterModelPlazaRoutes 注册模型广场路由。
//
// 挂 OptionalJWT：匿名可访问（开关与 require_auth 由 handler fail-closed 判定），
// 带 token 则识别用户以展示专属分组与个人倍率。
// 模型广场是只读展示页，不属于后台模式限制的用户自助服务。
func RegisterModelPlazaRoutes(
	v1 *gin.RouterGroup,
	h *handler.Handlers,
	optionalJWT middleware.OptionalJWTAuthMiddleware,
	panelRateLimiter *middleware.PanelRateLimiter,
) {
	plaza := v1.Group("/model-plaza")
	plaza.Use(panelRateLimiter.PublicIP())
	plaza.Use(gin.HandlerFunc(optionalJWT))
	{
		plaza.GET("", h.ModelPlaza.Get)
	}
}

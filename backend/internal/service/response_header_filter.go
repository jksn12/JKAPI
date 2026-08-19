package service

import (
	"github.com/jksn12/JKAPI/internal/config"
	"github.com/jksn12/JKAPI/internal/util/responseheaders"
)

func compileResponseHeaderFilter(cfg *config.Config) *responseheaders.CompiledHeaderFilter {
	if cfg == nil {
		return nil
	}
	return responseheaders.CompileHeaderFilter(cfg.Security.ResponseHeaders)
}

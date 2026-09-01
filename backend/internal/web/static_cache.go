//go:build embed || unit

package web

import (
	"net/http"
	"path"
	"strings"
)

// Keep embedded frontend assets revalidated in self-hosted deployments.
//
// Some installations serve rebuilt assets from the same URL while containers
// are swapped behind a reverse proxy. Long immutable caching can leave browsers
// on an older admin bundle after an operational hotfix, so prefer correctness
// over aggressive caching here.
const staticAssetsCacheControl = "no-cache"

// isFingerprintedEmbeddedAssetPath reports whether a cleaned URL path refers to
// a Vite asset whose filename contains the default eight-character build hash.
func isFingerprintedEmbeddedAssetPath(cleanPath string) bool {
	cleanPath = strings.TrimPrefix(cleanPath, "/")
	if !strings.HasPrefix(cleanPath, "assets/") {
		return false
	}

	filename := path.Base(cleanPath)
	extension := path.Ext(filename)
	stem := strings.TrimSuffix(filename, extension)
	const fingerprintLength = 8
	delimiterIndex := len(stem) - fingerprintLength - 1
	if extension == "" || delimiterIndex < 1 || stem[delimiterIndex] != '-' {
		return false
	}

	// Vite hashes use URL-safe characters and are stable for immutable caching.
	fingerprint := stem[delimiterIndex+1:]
	for _, char := range fingerprint {
		if (char >= 'a' && char <= 'z') ||
			(char >= 'A' && char <= 'Z') ||
			(char >= '0' && char <= '9') ||
			char == '_' || char == '-' {
			continue
		}
		return false
	}
	return true
}

// applyStaticAssetCacheHeaders sets Cache-Control for long-cacheable static paths.
// index.html / SPA routes must keep no-cache and are not handled here.
func applyStaticAssetCacheHeaders(header http.Header, cleanPath string) {
	if header == nil || !isFingerprintedEmbeddedAssetPath(cleanPath) {
		return
	}
	header.Set("Cache-Control", staticAssetsCacheControl)
}

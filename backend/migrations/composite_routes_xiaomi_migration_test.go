package migrations

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestCompositeRoutesXiaomiMigration(t *testing.T) {
	content, err := FS.ReadFile("230_composite_routes_add_xiaomi.sql")
	require.NoError(t, err)

	sql := strings.Join(strings.Fields(string(content)), " ")
	require.Contains(t, sql, "DROP CONSTRAINT IF EXISTS composite_model_routes_target_platform_check")
	require.Contains(t, sql, "'deepseek', 'xiaomi'))")
}

package migrations

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
)

func TestChannelMonitorXiaomiProviderMigration(t *testing.T) {
	content, err := FS.ReadFile("229_channel_monitor_xiaomi_provider.sql")
	require.NoError(t, err)

	sql := strings.Join(strings.Fields(string(content)), " ")
	require.Contains(t, sql, "DROP CONSTRAINT IF EXISTS channel_monitors_provider_check")
	require.Contains(t, sql, "DROP CONSTRAINT IF EXISTS channel_monitor_request_templates_provider_check")
	require.Contains(t, sql, "'deepseek', 'xiaomi'))")
}

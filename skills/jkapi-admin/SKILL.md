---
name: jkapi-admin
description: Manage JKAPI admin APIs for accounts, redeem codes, groups, proxies, error passthrough rules, TLS fingerprint profiles, imports, exports, batch updates, and raw administrator API calls. Use when the user mentions JKAPI, admin API keys, account management, redeem code management, recharge codes, invitation codes, bulk account import/export, keeping or deleting accounts, refreshing accounts, clearing errors, CRS sync, or managing JKAPI backend settings through the admin API.
---

# JKAPI Admin

Use the bundled CLI instead of ad hoc `curl`. Run examples from this skill directory.

```bash
export JKAPI_BASE_URL='https://your-jkapi-host'
export JKAPI_ADMIN_API_KEY='<admin api key>'
# Or, when the deployment uses admin JWT login instead of an admin API key:
# export JKAPI_JWT='<admin access_token>'
node scripts/jkapi-admin.js accounts list
```

For all commands and payload examples, read [references/admin-cli.md](references/admin-cli.md).

## Workflow

1. Reuse `JKAPI_BASE_URL` and either `JKAPI_ADMIN_API_KEY` or `JKAPI_JWT` from the environment.
2. Run read-only commands first: `accounts list`, `accounts get <id>`, `groups all`, or `proxies all`.
3. Before destructive or bulk writes, print the target account names and IDs.
4. Execute the write command only after the target set is clear.
5. Run a follow-up read command to verify the result.

## Common Commands

```bash
node scripts/jkapi-admin.js accounts list --page-size 20
node scripts/jkapi-admin.js accounts get 40
node scripts/jkapi-admin.js accounts usage 40
node scripts/jkapi-admin.js accounts set-schedulable 40 true
node scripts/jkapi-admin.js accounts bulk-update --ids 40,39 --json '{"concurrency":10}'
node scripts/jkapi-admin.js redeem-codes list --page-size 20
node scripts/jkapi-admin.js redeem-codes generate --json '{"count":1,"type":"balance","value":10}' --idempotency-key redeem-$(date +%s)
node scripts/jkapi-admin.js redeem-codes create-and-redeem --json '{"code":"order_123","type":"balance","value":10,"user_id":123}' --idempotency-key order-123
node scripts/jkapi-admin.js error-rules list
node scripts/jkapi-admin.js tls-profiles list
```

## Safety Notes

- Authentication uses `x-api-key` from `JKAPI_ADMIN_API_KEY` first, then falls back to `Authorization: Bearer <jwt>` from `JKAPI_JWT`.
- If the API returns `INVALID_ADMIN_KEY`, ask the user to regenerate the admin API key. If using JWT, log in as an admin user and copy the `access_token` from `POST /api/v1/auth/login`.
- `accounts export` includes credentials and tokens. Prefer `--file` and avoid printing exports in chat.
- Redeem code create/redeem commands should use `--idempotency-key` for payment or recharge workflows.
- For uncertain or newly added backend APIs, use `api <METHOD> <admin-path>` after a read-only check.

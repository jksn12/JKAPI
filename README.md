# JKAPI

JKAPI is an AI API gateway for operating OpenAI-compatible API access from multiple upstream accounts and providers. It provides user accounts, API keys, quota controls, routing, usage records, billing-related settings, and an admin console for commercial API relay operations.

Public instance: https://api.yang-shuo.top

## What It Does

- Exposes API endpoints for OpenAI-compatible clients and common AI coding tools.
- Manages upstream AI accounts, API keys, model routing, quotas, and rate limits.
- Records usage for billing, reconciliation, and operational analytics.
- Provides an admin console for account, user, key, pricing, payment, security, and runtime settings.
- Runs as a Docker Compose stack with PostgreSQL, Redis, the JKAPI app, and optional Caddy reverse proxy.

## Quick Start

```bash
git clone https://github.com/jksn12/JKAPI.git
cd JKAPI/deploy
cp .env.example .env
```

Edit `deploy/.env` and set at least:

```env
POSTGRES_PASSWORD=change-me
JWT_SECRET=change-me-with-openssl-rand-hex-32
TOTP_ENCRYPTION_KEY=change-me-with-openssl-rand-hex-32
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me
BIND_HOST=127.0.0.1
SERVER_PORT=8080
```

Start the stack:

```bash
docker compose up -d
docker compose logs -f jkapi
```

The app listens on `127.0.0.1:8080` by default. Put Caddy, Nginx, or another TLS proxy in front of it for public traffic.

## Caddy Reverse Proxy

For `api.yang-shuo.top`, Caddy should terminate HTTPS and proxy to the internal app service:

```caddyfile
api.yang-shuo.top {
    reverse_proxy jkapi:8080
}
```

The production `deploy/Caddyfile` includes TLS, compression, request body limits, logs, and health checks. When Caddy and JKAPI run in the same Docker Compose network, use `jkapi:8080` as the upstream. When Caddy runs on the host, use `127.0.0.1:8080`.

## Deployment Notes

- Keep ports `80` and `443` reserved for Caddy.
- Bind the JKAPI app to `127.0.0.1:8080` unless it must be reachable from another host.
- Persist PostgreSQL, Redis, and `/app/data` volumes before upgrading.
- Set stable `JWT_SECRET` and `TOTP_ENCRYPTION_KEY`; changing either can invalidate sessions or 2FA secrets.
- Use `/health` for uptime checks.

## Commercial Operations Checklist

- Rotate the initial server root password and use SSH keys for routine access.
- Configure backup jobs for PostgreSQL and keep off-server copies.
- Set pricing, quota, refund, and payment rules before opening registration.
- Add legal documents, privacy policy, refund policy, and customer support contacts.
- Enable monitoring for 5xx rate, upstream failures, token usage spikes, disk usage, and database health.
- Restrict admin accounts with strong passwords and 2FA.
- Keep Caddy and Docker images updated on a planned maintenance cadence.

## Repository

Source: https://github.com/jksn12/JKAPI

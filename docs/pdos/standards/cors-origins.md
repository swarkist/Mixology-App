# CORS Origins — Runtime Notes (PDOS)

This repo (Mixi-Mixology) serves both the Web App and Backend/API.

## Current Allowed Origins
Configured via `CORS_ORIGINS` env var, comma-separated.

Examples currently in use:
- http://localhost:5173
- https://<replit-dev-domain>.kirk.replit.dev
- https://miximixology.com
- https://www.miximixology.com
- https://miximixology.replit.app

## PDOS Rule
- Do not change CORS allowlist without an explicit PDOS task.
- Prefer adding origins only when required by a deployment target.
- Never allow wildcard `*` in production.
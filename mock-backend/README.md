# Mock Backend (Temporary)

This folder provides a fake backend for the admin module requirements.

## Run

```bash
npm run mock:api
```

Base URL:
`http://localhost:3001/api`

## Endpoints

- `GET /api/health`
- `GET /api/dashboard?module=audit|tax`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/engagements?module=&status=&stage=&search=`
- `POST /api/engagements`
- `GET /api/engagements/:id`
- `PATCH /api/engagements/:id/steps/:stepId`
- `GET /api/engagements/:id/history`
- `GET /api/reports`
- `GET /api/users`

## Notes

- Workflows are auto-generated from predefined Audit/Tax stage templates.
- Step updates recalculate stage and engagement statuses.
- Delay comment/reason is required for overdue/on-hold saves.
- All data is in-memory and resets when the server restarts.

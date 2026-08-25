# MS Frontend

Vite + React 18.3 test UI for the NestJS microservices API Gateway. This is a modern SPA (`createRoot`, function components) — not Create React App.

Gateway must already be running on `http://localhost:3002`. This app proxies `/api` and `/socket.io` there.

```bash
cd Ms-Frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Routes (mapped to the backend)

| Frontend | Backend |
| --- | --- |
| `/` | Route map |
| `/health` | `GET /api/health` |
| `/auth/register` | `POST /api/auth/register` |
| `/auth/login` | `POST /api/auth/login` |
| `/auth/refresh` | `POST /api/auth/refresh` |
| `/auth/me` | `GET /api/auth/me` |
| `/auth/password` | `PATCH /api/auth/password` |
| sidebar logout | `POST /api/auth/logout` |
| `/users/me` | `GET` + `PATCH /api/users/me` |
| `/users` | `GET /api/users` (admin) |
| `/users/lookup` | `GET` + `PATCH` + `DELETE /api/users/:id` (admin, profile id) |
| `/chat` | `GET /api/chat/conversations` |
| `/chat/private` | `POST /api/chat/private` |
| `/chat/groups` | `POST /api/chat/groups` |
| `/chat/presence` | `GET /api/chat/presence/:userId` |
| `/chat/conversations/:id` | messages, typing, seen, members, leave, rename + Socket.IO `/chat` |

Chat `userId` is the auth account id from `/auth/me` (`data.id`), not the profile id.

Use two browsers (or two accounts) to test typing, seen, and online/offline.

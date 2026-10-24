# NexChat

A full-stack, one-to-one chat application built with React, Express, MongoDB, and Socket.IO. Auth uses an `HttpOnly` JWT cookie. Accounts can be recovered with three personal security questions instead of email/SMTP.

> **Status:** demo-ready. The chat UI, security-question recovery, Socket.IO messaging, presence, and typing indicators are implemented. The backend integration suite covers 22 scenarios.

## Features

- Register and log in with email/password; bcrypt password hashes and `HttpOnly` JWT cookies
- Three security questions at signup with normalized, bcrypt-hashed answers
- Password reset without email: question lookup, generic failures, rate limiting, and invalidation of existing sessions and live sockets
- Session revalidation through `GET /api/auth/me`
- Paginated, searchable public user list without email/gender exposure
- One-to-one messaging with receiver checks, self-message blocking, and validation
- Race-safe conversation creation with a unique participant key
- Conversation discovery after a refresh via `GET /api/message/conversations`
- Cursor-paginated message history and a "load earlier messages" control
- Real-time messages, online presence, and typing indicators over Socket.IO
- Responsive dark chat UI (contacts, messages, profile panel, toasts)
- Security headers, configurable CORS, rate limits, centralized errors, and a database-aware health check
- Express can serve the built frontend, so the demo deploys as one service

## Tech stack

| Layer | Technologies |
| --- | --- |
| Backend | Node.js, Express 5, Mongoose 9, MongoDB, JWT, bcryptjs, Socket.IO |
| Security | Helmet, express-rate-limit, HttpOnly cookies, security-question recovery |
| Frontend | React 19, Vite 8, Axios, React Router, socket.io-client |
| Tooling | nodemon, Oxlint, Supertest, mongodb-memory-server |

## Development quick start

```bash
# Backend (repository root)
npm install
# create .env with MONGO_URI, JWT_SECRET, PORT, NODE_ENV, CLIENT_ORIGIN
npm run dev

# Frontend (second terminal)
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173
- API: http://localhost:3000
- Health check: `GET /api/health`
- Backend tests: `npm test` (22 passing)

Vite proxies `/api` and `/socket.io` to `http://localhost:3000`, so cookies and sockets work on the dev origin without extra configuration. See [Getting Started](docs/getting-started.md) for environment variables.

## Deploy the demo

The Express server serves `frontend/dist` when it exists, including the SPA fallback for client-side routes.

```bash
npm install
npm run build       # installs frontend packages and builds frontend/dist

# Production environment:
# NODE_ENV=production
# MONGO_URI=mongodb+srv://...
# JWT_SECRET=<at least 32 random characters>
# PORT=3000
# CLIENT_ORIGIN=https://your-demo.example.com

npm start
```

Open the deployed URL over HTTPS. In production the auth cookie is `Secure`, so plain HTTP will not store it. `CLIENT_ORIGIN` must contain the exact deployed origin; the default is `http://localhost:5173`.

If you prefer separate frontend hosting, build with `VITE_API_URL=https://api.example.com/api` and `VITE_SOCKET_URL=https://api.example.com`. Because the cookie is `SameSite=Strict`, same-origin hosting is strongly recommended.

### Docker

The included multi-stage `Dockerfile` builds the frontend and runs the Express server:

```bash
docker build -t nexchat .
docker run --rm -p 3000:3000 --env-file .env -e NODE_ENV=production nexchat
```

The image does not include `.env`, so pass secrets at runtime. Use a `JWT_SECRET` of at least 32 characters and set `CLIENT_ORIGIN` to the deployed HTTPS origin.

## Documentation

| Document | Contents |
| --- | --- |
| [Documentation index](docs/README.md) | Overview, status, stack, layout |
| [Getting Started](docs/getting-started.md) | Setup, environment variables, scripts, production hosting |
| [Architecture](docs/architecture.md) | System design, auth/message/realtime flows |
| [API Reference](docs/api-reference.md) | REST endpoints, recovery, Socket.IO events, payloads |
| [Database](docs/database.md) | Schemas, relationships, indexes, recovery fields |
| [Frontend](docs/frontend.md) | React structure, contexts, recovery UI, realtime integration |
| [Development](docs/development.md) | Conventions, known gaps, security notes, roadmap |
| [Troubleshooting](docs/troubleshooting.md) | Common errors and fixes |

## Project layout

```
backend/
├── app.js                 Express app (middleware, routes, static frontend, errors)
├── index.js               HTTP server + Socket.IO, DB connection, shutdown
├── config/                Environment configuration
├── DB/                    MongoDB connection
├── Modes/                 Mongoose models
├── middleware/            Auth, rate limiting, error handling
├── realtime/              Socket.IO server and room helpers
├── rout/                  Express routers
├── routControlers/        Route handlers
├── tests/                 API and realtime integration tests
└── utils/                 Cookies, JWT, validation, security questions
frontend/                  React + Vite client
docs/                      Project documentation
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret for signing/verifying JWTs; at least 32 characters in production |
| `PORT` | No | API/server port (default `3000`) |
| `NODE_ENV` | No | `development` locally; `production` enables secure cookies and production error handling |
| `CLIENT_ORIGIN` | No | Allowed browser origin(s), comma-separated (default `http://localhost:5173`) |
| `VITE_API_URL` | No | Build-time API base URL; defaults to same-origin `/api` |
| `VITE_SOCKET_URL` | No | Build-time Socket.IO origin; defaults to the API origin |

Never commit `.env` or real secrets.

## Known limitations

- Password recovery relies on security answers, which are weaker than email or MFA; use unique, non-public answers.
- No email verification, read receipts, unread counts, group chats, or account deletion.
- Rate limiting uses in-memory storage, so multi-instance deployments need a shared store.
- Vertical scrolling and presence are designed for a single Socket.IO server without a Redis adapter.
- No frontend test suite yet (build and lint are run manually).

See [Development → Known gaps](docs/development.md#known-gaps-and-issues) for details.

## License

ISC (per the root `package.json`).

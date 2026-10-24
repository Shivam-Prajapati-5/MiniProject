# NexChat Documentation

NexChat is a full-stack, one-to-one chat application. The backend is a cookie-authenticated Express/MongoDB API with Socket.IO realtime delivery. The frontend is a React + Vite client.

## Current status

The application is demo-ready: registration, login, security-question password recovery, user discovery, conversations, paginated message history, realtime messages, presence, typing indicators, and the chat UI are implemented. The backend suite has 22 passing integration tests, including Socket.IO coverage.

| Area | Status |
| --- | --- |
| Registration, login, logout, session revalidation | Implemented |
| Security-question password recovery | Implemented |
| User discovery | Implemented |
| Send and retrieve 1:1 messages | Implemented |
| Conversation discovery and membership checks | Implemented |
| Message cursor pagination and "load earlier" UI | Implemented |
| Socket.IO messages, presence, typing indicators | Implemented |
| Frontend auth, chat, profile, and recovery UI | Implemented |
| Security headers, rate limits, centralized errors | Implemented |
| Database-aware health check | Implemented |
| Backend tests | 22 passing (`npm test`) |
| Frontend build and lint | Passing (`npm run build`, `npm run lint`) |
| Single-service production hosting | Implemented (Express serves `frontend/dist`) |
| Docker image | Provided (`Dockerfile`, multi-stage build) |

## Documentation map

| Document | What it covers |
| --- | --- |
| [Getting Started](getting-started.md) | Prerequisites, installation, environment variables, running, testing, deployment |
| [Architecture](architecture.md) | System design, folder structure, auth/recovery/message/realtime flows |
| [API Reference](api-reference.md) | REST endpoints, Socket.IO events, payloads, status codes, rate limits |
| [Database](database.md) | Mongoose models, relationships, collections, indexes, recovery data |
| [Frontend](frontend.md) | React structure, contexts, recovery UI, realtime integration, styling |
| [Development](development.md) | Conventions, feature workflow, known gaps, security notes, roadmap |
| [Troubleshooting](troubleshooting.md) | Common errors and fixes |

## Tech stack

### Backend

| Package | Version | Purpose |
| --- | --- | --- |
| `express` | ^5.3.0 | HTTP server and routing |
| `mongoose` | ^9.11.2 | MongoDB ODM |
| `bcryptjs` | ^3.0.3 | Password and security-answer hashing |
| `jsonwebtoken` | ^9.0.3 | JWT creation and verification |
| `cookie-parser` | ^1.4.7 | Reading the `jwt` cookie |
| `socket.io` | ^4.8.4 | Realtime messages, presence, and typing |
| `cors` | ^2.8.6 | Configurable cross-origin access |
| `helmet` | ^8.3.0 | Security and CSP headers |
| `express-rate-limit` | ^8.7.1 | Auth, recovery, and message-send limits |
| `dotenv` | ^18.0.7 | Loading `.env` |
| `nodemon` | ^3.1.14 | Auto-restart in development |

### Testing

| Package | Version | Purpose |
| --- | --- | --- |
| Node.js test runner | Built in | `node --test` |
| `supertest` | ^7.3.1 | HTTP assertions against the Express app |
| `socket.io-client` | ^4.8.4 | Realtime integration tests |
| `mongodb-memory-server` | ^11.3.0 | Isolated in-memory MongoDB |

### Frontend

| Package | Version | Purpose |
| --- | --- | --- |
| `react`, `react-dom` | ^19.3.1 | UI library |
| `vite` | ^8.3.4 | Dev server and bundler |
| `axios` | ^1.20.0 | HTTP client |
| `react-router-dom` | ^7.18.4 | Protected and public routes |
| `socket.io-client` | ^4.8.4 | Realtime client |
| `oxlint` | ^1.88.0 | Linter |

## Quick start

```bash
# Install backend dependencies (repository root)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Create .env in the repository root with MONGO_URI, JWT_SECRET,
# PORT, NODE_ENV, and CLIENT_ORIGIN (see Getting Started)

# Terminal 1: API on http://localhost:3000
npm run dev

# Terminal 2: Vite on http://localhost:5173
npm run dev:frontend
```

Vite proxies `/api` and `/socket.io` to the backend, so the browser uses a single origin in development and the auth cookie/socket work without CORS setup.

Verify the API and database connection:

```bash
curl http://localhost:3000/api/health
# {"success":true,"status":"ok","database":"connected"}
```

Run the backend tests:

```bash
npm test
```

Tests use an in-memory MongoDB and do not read the application database.

## Production demo

```bash
npm install
npm run build
# set NODE_ENV=production, MONGO_URI, JWT_SECRET (32+ chars), CLIENT_ORIGIN
npm start
```

Express serves `frontend/dist` when present and falls back to `index.html` for client routes. Use HTTPS so the production `Secure` cookie is stored, and set `CLIENT_ORIGIN` to the deployed URL. See [Getting Started → Production hosting](getting-started.md#production-hosting).

## Repository layout

```
MiniProject/
├── backend/                 # Express API + Socket.IO (ES modules)
│   ├── app.js               # Middleware, routes, static frontend, error handlers
│   ├── index.js             # HTTP server, Socket.IO, DB connection, shutdown
│   ├── config/              # Environment configuration
│   ├── DB/                  # MongoDB connection
│   ├── Modes/               # Mongoose models
│   ├── middleware/          # Auth, rate limits, error handling
│   ├── realtime/            # Socket authentication, rooms, presence
│   ├── rout/                # Express routers
│   ├── routControlers/      # Route handlers
│   ├── tests/               # API and realtime integration tests
│   └── utils/               # Cookies, JWT, validation, security questions
├── frontend/                # React + Vite client
│   └── src/
│       ├── components/      # Sidebar, ChatPanel, MessageBubble, etc.
│       ├── context/         # Auth, chat, toast providers
│       ├── pages/           # Auth and Chat pages
│       ├── api.js           # Axios + Socket.IO URLs
│       ├── App.jsx          # Routes and session gate
│       └── main.jsx         # React entry point
├── docs/
├── .env                     # Local secrets (never commit)
├── package.json             # Backend dependencies and scripts
└── package-lock.json
```

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string (local or Atlas) |
| `JWT_SECRET` | Yes | JWT signing secret; at least 32 characters in production |
| `PORT` | No | Server port, defaults to `3000` |
| `NODE_ENV` | No | `development` locally; `production` enables secure cookies |
| `CLIENT_ORIGIN` | No | Comma-separated browser origins allowed by CORS |
| `VITE_API_URL` | No | Build-time API base URL; default `/api` (same origin) |
| `VITE_SOCKET_URL` | No | Build-time Socket.IO origin; default derived from the API URL |

See [Getting Started](getting-started.md#environment-variables) for details.

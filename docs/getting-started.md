# Getting Started

This guide takes you from a fresh checkout to a running API, a running frontend, a passing backend test suite, and a single-service production deployment.

## Prerequisites

- **Node.js 22.12+** (Node 24 LTS recommended). Vite 8 accepts Node 20.19+, but the quoted test glob requires Node 21+, so use 22.12+ for the full workflow.
- **npm 10+** (bundled with Node.js)
- **MongoDB** — either a local server or a free MongoDB Atlas cluster
- A terminal (PowerShell, Bash, or similar)
- Docker only if you want to build the container image

Check your versions:

```bash
node --version
npm --version
```

## 1. Install dependencies

The project has two npm projects: the backend at the repository root and the frontend inside `frontend/`.

```bash
# From the repository root
npm install

# Frontend
cd frontend
npm install
cd ..
```

This creates `node_modules/` in the root and in `frontend/`. The root `npm run build` command also installs frontend dependencies before building, so the second install is only needed if you want to run the Vite dev server first.

<a id="environment-variables"></a>

## 2. Environment variables

Create a file named `.env` in the **repository root** (next to the root `package.json`). The repository includes `.env.example` as a starting template. Copy it and fill in your own values; never commit `.env`.

```dotenv
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/nexchat
JWT_SECRET=replace-this-with-a-long-random-secret
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

| Variable | Required | Default | Details |
| --- | --- | --- | --- |
| `MONGO_URI` | Yes | — | MongoDB connection string. For Atlas it looks like `mongodb+srv://user:pass@cluster.mongodb.net/nexchat`. |
| `JWT_SECRET` | Yes | — | Used by `jsonwebtoken` to sign and verify auth cookies. Use a long random value. **Production requires at least 32 characters.** Changing it invalidates all existing sessions. |
| `PORT` | No | `3000` | Port the Express server listens on. Invalid values fall back to `3000`. |
| `NODE_ENV` | No | `development` | Set to `development` locally. In production, the auth cookie is marked `Secure`, `trust proxy` is enabled, and unexpected `500` responses hide internal details. |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Comma-separated browser origins allowed by CORS and Socket.IO, for example `http://localhost:5173,https://app.example.com`. |
| `VITE_API_URL` | No | `/api` | Build-time API base URL. Include the `/api` suffix, for example `https://api.example.com/api`. |
| `VITE_SOCKET_URL` | No | derived | Build-time Socket.IO origin, for example `https://api.example.com`. When omitted, it is derived from `VITE_API_URL`. |

`VITE_*` values are read by Vite at **build time** from `frontend/.env`, `frontend/.env.production`, or the shell environment. The root `.env` is used by the backend at runtime and is not loaded by the frontend build. For a same-origin deployment, leave both unset.

Environment variables are read once at startup by `backend/config/env.js` (via `dotenv/config`). Missing `MONGO_URI` or `JWT_SECRET` causes the process to exit before it listens:

```
Server start nahi hua: Missing required environment variable(s): MONGO_URI, JWT_SECRET
```

In production, a short secret produces:

```
Server start nahi hua: JWT_SECRET must be at least 32 characters long in production
```

### Run from the repository root

`dotenv/config` loads `.env` from the **current working directory**. The npm scripts are designed to be run from the repository root:

```bash
npm run dev
```

If you run `node backend/index.js` from inside `backend/`, the root `.env` is not loaded. Either export the variables yourself or place a separate `backend/.env` file.

### MongoDB Atlas

If you use Atlas:

1. Create a database user and cluster.
2. Add your current IP address under **Network Access**.
3. Copy the connection string into `MONGO_URI`.
4. URL-encode special characters in the password if it contains `@`, `:`, `/`, or `#`.
5. If you deploy in a container or serverless platform, allow that platform's egress IPs.

## 3. Start the backend

From the repository root:

```bash
npm run dev
```

Expected output:

```
DB connected successfully
Working at 3000
```

`npm run dev` uses `nodemon` and restarts on file changes. `npm start` runs the server once with plain `node`.

The API is served at `http://localhost:3000`, with routes under `/api`. Check process and database health:

```bash
curl http://localhost:3000/api/health
# {"success":true,"status":"ok","database":"connected"}
```

If MongoDB disconnects, the same endpoint returns `503` with `"status":"degraded"`.

`Ctrl+C` triggers a graceful shutdown: Socket.IO and the HTTP server stop accepting connections, then Mongoose disconnects. A 10-second timer forces exit if shutdown hangs.

If `frontend/dist/index.html` exists when the server starts, Express also serves the built app. Without a build, `GET /` returns the plain-text liveness message.

## 4. Start the frontend

In a second terminal, from the repository root:

```bash
npm run dev:frontend
```

Or from `frontend/`:

```bash
cd frontend
npm run dev
```

Vite prints a local URL, usually `http://localhost:5173/`. Open it and register an account.

Vite proxies `/api` and `/socket.io` to `http://localhost:3000`, so the browser sees one origin. Cookies and WebSocket upgrades work without extra CORS configuration.

- If the backend runs on a different port, update the proxy targets in `frontend/vite.config.js` and `PORT`.
- If Vite chooses a different port (for example `5174` because `5173` is busy), add that exact origin to `CLIENT_ORIGIN` and restart the API. Socket.IO validates the browser origin even through the proxy.

## 5. Smoke test the API

Register a user with recovery answers and save the auth cookie to a file:

```bash
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Ada Lovelace",
    "username": "ada",
    "email": "ada@example.com",
    "gender": "female",
    "password": "secret123",
    "securityAnswers": [
      { "questionId": "first_pet", "answer": "Milo" },
      { "questionId": "birth_city", "answer": "London" },
      { "questionId": "first_school", "answer": "Home" }
    ]
  }' \
  http://localhost:3000/api/auth/register
```

Registration signs the user in. Then call protected endpoints with the saved cookie:

```bash
# Current session
curl -b cookies.txt http://localhost:3000/api/auth/me

# Other users (paginated)
curl -b cookies.txt "http://localhost:3000/api/auth/users?page=1&limit=10"

# Conversations
curl -b cookies.txt http://localhost:3000/api/message/conversations
```

### Recovery smoke test

```bash
# 1. Look up the configured questions
curl -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}' \
  http://localhost:3000/api/auth/recovery/questions

# 2. Reset the password. Save the new cookie.
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "email": "ada@example.com",
    "newPassword": "new-secret-123",
    "securityAnswers": [
      { "questionId": "first_pet", "answer": "MILO" },
      { "questionId": "birth_city", "answer": " london " },
      { "questionId": "first_school", "answer": "Home" }
    ]
  }' \
  http://localhost:3000/api/auth/recovery/reset
```

Answers are normalized, so case and surrounding whitespace do not matter. A successful reset increments `tokenVersion`, invalidating every older cookie, and disconnects the account's live sockets.

On Windows PowerShell, use `curl.exe` so flags like `-c` and `-b` are passed to curl instead of the `Invoke-WebRequest` alias. More examples are in the [API Reference](api-reference.md).

## 6. Run the tests

From the repository root:

```bash
npm test
```

On PowerShell systems that block `npm.ps1`, use:

```powershell
npm.cmd test
```

This runs Node's built-in test runner against `backend/tests/**/*.test.js`. The suite has **22 tests**:

- 18 REST, auth, and recovery tests in `backend/tests/api.test.js`;
- 4 Socket.IO tests in `backend/tests/realtime.test.js`.

The tests:

- use `supertest` to exercise the Express app without a fixed listener;
- create an ephemeral HTTP server for the realtime suite and connect with `socket.io-client`;
- start isolated in-memory MongoDB instances with `mongodb-memory-server`;
- set `NODE_ENV=test`, which skips rate limiting and avoids `Secure` cookies;
- clean collections between tests;
- do not read the application database or require `.env`.

The first run may download a MongoDB binary, so it needs network access once.

### Check the frontend

```bash
cd frontend
npm run build
npm run lint
```

`npm run lint` currently reports warnings but no errors. The build output goes to `frontend/dist/`.

## npm scripts

### Root (backend and frontend helpers)

| Command | What it does |
| --- | --- |
| `npm start` | Runs `node backend/index.js` and serves `frontend/dist` if built |
| `npm run dev` | Runs `nodemon backend/index.js` |
| `npm run dev:frontend` | Runs the Vite dev server from `frontend/` |
| `npm run build` | Installs frontend dependencies and builds `frontend/dist` |
| `npm test` | Runs all backend integration tests with `node --test` |

### Frontend (`frontend/`)

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the Vite dev server with HMR |
| `npm run build` | Builds production assets into `frontend/dist/` |
| `npm run preview` | Serves the production build locally |
| `npm run lint` | Runs Oxlint |

## Production hosting

The demo is designed to run as **one service**: Express serves the API, Socket.IO, and the built React app from the same origin. This keeps the `HttpOnly`, `SameSite=Strict` auth cookie simple and avoids cross-site cookie problems.

### Single-service deployment

```bash
# 1. Install backend dependencies
npm install

# 2. Build the frontend (also installs frontend dependencies)
npm run build

# 3. Set production environment variables
#    NODE_ENV=production
#    MONGO_URI=mongodb+srv://...
#    JWT_SECRET=<at least 32 random characters>
#    PORT=3000
#    CLIENT_ORIGIN=https://your-demo.example.com

# 4. Start the server
npm start
```

Open the deployed URL over **HTTPS**. In production the auth cookie is `Secure`, so a plain HTTP page will not store it.

How static hosting works:

- At startup, `backend/app.js` checks for `frontend/dist/index.html`.
- `GET /` serves that file; Vite assets are served from `frontend/dist`.
- Client-side routes such as `/auth` fall back to `index.html` for GET requests.
- `/api/*` and `/socket.io/*` are excluded from the SPA fallback, so unknown API routes still return JSON `404`.
- If the frontend is built **after** the server starts and was absent at startup, restart the server.

`CLIENT_ORIGIN` must contain the exact deployed origin. CORS and Socket.IO use it, and credentials are enabled.

### Reverse proxy and WebSockets

If you put Nginx, Caddy, or a platform proxy in front of the app:

- Terminate TLS at the proxy and forward HTTPS traffic to `PORT`.
- Allow WebSocket upgrades for `/socket.io`. With Nginx, use `proxy_http_version 1.1` and forward `Upgrade`/`Connection` headers.
- Keep `trust proxy` accurate for your topology. The app sets it to `1` in production.
- Do not strip cookies, the `Origin` header, or the upgrade headers.

The demo should run as a **single instance**. Presence and rate limits are stored in memory. Multiple instances require the Socket.IO Redis adapter, a shared rate-limit store, and sticky sessions for polling.

### Docker

The repository includes a multi-stage `Dockerfile` that builds the frontend and runs the Express server.

```bash
# Build the image
docker build -t nexchat .

# Run it with runtime environment variables
docker run --rm -p 3000:3000 --env-file .env nexchat
```

Notes:

- The image does not copy `.env`. Pass variables with `--env-file` or your platform's secret manager.
- `NODE_ENV=production` is set in the image. Your `JWT_SECRET` must be at least 32 characters.
- The final image contains only production backend dependencies plus the built frontend.
- For Atlas, allow the container host's egress IPs.

### Generic platform setup

For a platform such as Render, Railway, Fly.io, or a VPS with a process manager:

| Setting | Value |
| --- | --- |
| Build command | `npm install && npm run build` |
| Start command | `npm start` |
| Health check | `GET /api/health` |
| Runtime | Node.js 22.12+ |
| Required env | `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CLIENT_ORIGIN` |
| Port | Use the platform-provided `PORT` if required |

### Split hosting

If you host the frontend separately:

- Build with `VITE_API_URL=https://api.example.com/api` and `VITE_SOCKET_URL=https://api.example.com` in `frontend/.env.production` or the build environment.
- Add the frontend origin to `CLIENT_ORIGIN`.
- Serve both over HTTPS and keep `withCredentials: true`.

However, the current cookie is `SameSite=Strict`. That works for same-site hosts (for example `app.example.com` and `api.example.com`), but **not** for truly cross-site hosts. A cross-site deployment requires a deliberate code change to `SameSite=None; Secure` plus a CSRF strategy. Same-origin hosting is strongly recommended for this demo.

## Configuration reference

Most deployment-sensitive values are environment-driven. These remain fixed in source:

| Setting | File | Current value |
| --- | --- | --- |
| JWT lifetime | `backend/utils/jwtwebToken.js` | `30d` |
| Auth cookie name | `backend/utils/authCookie.js` | `jwt` |
| SameSite policy | `backend/utils/authCookie.js` | `Strict` |
| Security-question catalog | `backend/utils/securityQuestions.js` | 6 fixed questions |
| Security answers per account | `backend/utils/securityQuestions.js` | 2–3 |
| Generated avatar service | `backend/routControlers/userroutControler.js` | `avatar.iran.liara.run` |
| Auth rate limit | `backend/middleware/rateLimit.js` | 30 requests / 15 min / IP |
| Recovery rate limit | `backend/middleware/rateLimit.js` | 12 requests / 15 min / IP |
| Message-send rate limit | `backend/middleware/rateLimit.js` | 120 requests / min / IP |
| User/conversation page size | `backend/utils/validation.js` and controllers | 20 default, 100 max |
| Message page size | `backend/utils/validation.js` | 50 default, 100 max |
| Client typing idle time | `frontend/src/components/MessageInput.jsx` | 1.2 seconds |
| Server typing expiry | `frontend/src/context/ChatContext.jsx` | 3.5 seconds |

CORS is **not** hardcoded: change `CLIENT_ORIGIN` and restart the API. `frontend/vite.config.js` proxies `/api` and `/socket.io` to port `3000`; update those targets if you change `PORT`.

`npm run preview` serves on port `4173` by default and is not proxied. Use the Express-served build for a production-like check, or set `VITE_API_URL`/`VITE_SOCKET_URL` and add the preview origin to `CLIENT_ORIGIN`.

## Production checklist

1. `NODE_ENV=production` and a random `JWT_SECRET` of at least 32 characters.
2. MongoDB reachable, authenticated, backed up, and restricted to the deployment's network.
3. HTTPS enabled; the `Secure` cookie will not work over plain HTTP.
4. `CLIENT_ORIGIN` set to the exact deployed origin.
5. Reverse proxy forwards WebSocket upgrades for `/socket.io`.
6. `npm test`, `npm run build`, and `npm run lint` pass.
7. `GET /api/health` returns `200` with `"database":"connected"`.
8. Browser smoke test: register two users, exchange messages, verify presence/typing, refresh the page, reset a password, and confirm older sessions are rejected and live sockets disconnected.
9. Run a single instance, or add the Redis adapter/shared rate-limit store and sticky sessions.
10. Keep `.env`, cookies, JWTs, and recovery answers out of logs and version control.

# Troubleshooting

Common problems and their likely causes. Commands assume the repository root unless stated otherwise.

## Backend will not start

### `Missing required environment variable(s): ...`

Startup validation in `backend/config/env.js` requires `MONGO_URI` and `JWT_SECRET`. Add them to the root `.env`, or export them in the shell that starts the process.

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/nexchat
JWT_SECRET=replace-with-a-long-random-secret
```

### `JWT_SECRET must be at least 32 characters long in production`

When `NODE_ENV=production`, the API refuses to start with a short secret. Use a random value of at least 32 characters (64+ is reasonable). Changing the secret invalidates all existing sessions.

### `DB connection failed: ...` and the server exits

`backend/DB/dbConnect.js` connects before the HTTP server starts, so the API does not listen without MongoDB.

Check:

1. MongoDB is running locally, or the Atlas cluster is reachable.
2. `MONGO_URI` is correct and the database user's password is URL-encoded.
3. Your IP is allowed in Atlas **Network Access**.
4. The URI includes a database name if you expect one (for example `.../nexchat`).
5. DNS/TLS is not blocked by a corporate network or VPN.

Local default:

```dotenv
MONGO_URI=mongodb://127.0.0.1:27017/nexchat
```

If the process starts but the database later drops, `GET /api/health` returns `503` with `"database":"disconnected"`.

### Environment variables are `undefined`

`dotenv/config` loads `.env` from the **current working directory**.

- Run `npm run dev` or `npm start` from the repository root.
- If you run `node backend/index.js` from elsewhere, either `cd` to the root or export the variables in that shell.
- If you intentionally run from `backend/`, create `backend/.env`.
- Verify the file is named exactly `.env` (not `.env.txt`) and sits next to the root `package.json`.
- The frontend build does **not** read the root `.env`. Put `VITE_API_URL`/`VITE_SOCKET_URL` in `frontend/.env` or the build environment.

### `EADDRINUSE: address already in use :::3000`

Another process is using the port. Either change `PORT` in `.env` or stop the other process.

PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen | Select-Object OwningProcess
Stop-Process -Id <pid>
```

macOS/Linux:

```bash
lsof -i :3000
kill <pid>
```

If you change `PORT`, also update the proxy targets in `frontend/vite.config.js` (both `/api` and `/socket.io`).

### `Server start nahi hua: ...`

This is the generic startup failure log from `backend/index.js`. The underlying error is printed in the message itself, usually a missing environment variable, a production JWT secret that is too short, or a database connection failure.

### `GET /` says `Backend is working!` instead of showing the app

The server did not find `frontend/dist/index.html` when it started.

```bash
npm run build
npm start
```

The build must exist before the server starts. If you built the frontend while the server was already running and the build was absent at startup, restart it. In development, use the Vite URL (`http://localhost:5173`), not the API port.

### `GET /auth` returns JSON `404 Route not found`

The SPA fallback is only installed when `frontend/dist/index.html` exists at startup. Build the frontend and restart the API, or use the Vite dev server.

### The app loads, but an unknown `/api/...` path returns HTML

It should not. API routes are excluded from the SPA fallback and return JSON:

```json
{ "success": false, "message": "Route not found" }
```

If you see HTML, confirm you are running the current `backend/app.js` and that a reverse proxy is not rewriting `/api` requests to the frontend.

## Authentication and sessions

### `401 { "message": "User is not logged in" }`

The request has no `jwt` cookie.

- Log in or register first.
- In the browser, ensure Axios uses `withCredentials: true` (already set in `frontend/src/api.js`).
- With curl, use a cookie jar: `-c cookies.txt` on login and `-b cookies.txt` on subsequent calls.
- Check that the browser and API use the same host name (`localhost` vs `127.0.0.1` are different cookie hosts).
- In development, use the Vite URL so `/api` is proxied to the backend. Vite forwards cookies on the same browser origin.
- Confirm the request goes to the API port (default `3000`) and the frontend origin is allowed by `CLIENT_ORIGIN`.

### `401 { "message": "Invalid or expired token" }`

`isLogin` could not verify the JWT, or its `tokenVersion` no longer matches the user.

- The token is older than 30 days.
- `JWT_SECRET` changed after the cookie was issued. Changing the secret invalidates all sessions; log in again.
- The password was reset, which increments `tokenVersion` and disconnects live sockets. All other sessions must log in with the new password.
- The cookie is corrupted or was copied from another environment.
- The cookie was set over HTTP and `NODE_ENV=production`, so the browser refused to store the `Secure` cookie. Use HTTPS or set `NODE_ENV=development` locally.

Use `GET /api/auth/me` to revalidate a session; a `401` means the cached client user should be cleared.

### `401 { "message": "User not found" }`

The token is valid but its `userId` no longer exists, for example after dropping the `users` collection or switching databases. Clear cookies and register/login again.

### Login returns `401 { "message": "Invalid email or password" }`

This generic message is intentional and covers both an unknown email and a wrong password, preventing account enumeration.

- Login is by **email**, not username.
- Check spelling and password case.
- Make sure the API is using the same database configured in `MONGO_URI`.
- Emails are lowercased on registration and login, so casing should not matter for new accounts. Legacy mixed-case records may need normalization.
- If you just reset the password, use the new one.

### `429 { "message": "Too many requests. Please try again later." }`

| Scope | Limit |
| --- | --- |
| Register/login | 30 requests / 15 min / IP |
| Recovery questions/reset | 12 requests / 15 min / IP |
| Send message | 120 requests / min / IP |

Wait for the window to reset or restart the API (the default store is in-memory). Rate limits are disabled when `NODE_ENV=test`.

### `400 { "message": "Please provide all required fields" }` on register

All of `fullname`, `username`, `email`, `gender`, and `password` must be non-empty. `profilepicture` is optional, but **2–3 security answers are required** and produce their own validation messages.

### Registration validation messages

| Message | Fix |
| --- | --- |
| `Full name must be at most 80 characters long` | Shorten `fullname` |
| `Username must be 3-30 characters and contain only letters, numbers, dots, underscores, or hyphens` | Fix username format/length |
| `Please provide a valid email address` | Fix email format |
| `Gender must be either male or female` | Send `"male"` or `"female"` |
| `Password must be at least 6 characters long` | Use a longer password |
| `Password must be at most 72 characters long` | Shorten the password (bcrypt input limit) |
| `Password must contain non-whitespace characters` | Do not send spaces only |
| `Profile picture URL must be at most 500 characters long` | Shorten the URL |
| `Please choose 2-3 security questions and provide answers` | Send an array of 2–3 `{ questionId, answer }` entries |
| `Please choose different security questions` | Remove duplicate question IDs |
| `Please answer all selected security questions` | Provide a non-empty answer for every question |
| `Please choose a valid security question` | Use IDs from `GET /api/auth/recovery/catalog` |
| `Security answers must be at most 120 characters long` | Shorten each answer |
| `Invalid security answer format` | Each entry must be an object with `questionId` and `answer` |

### `400 { "message": "Email Already Exists" }` (or username)

Emails are normalized to lowercase, so duplicates that differ only by case are rejected. Usernames remain case-sensitive. Try a different value, or inspect the `users` collection:

```js
db.users.find({ $or: [{ email: "ada@example.com" }, { username: "ada" }] })
```

A `409` with `Email already exists` or `Username already exists` indicates a duplicate-key race handled by the global error handler. Retry with a different value.

### Cookie is not stored or sent

- Backend and frontend must be on the same site. `SameSite=Strict` cookies are not sent cross-site.
- In production, the cookie requires HTTPS (`Secure`).
- Third-party cookie blocking can affect unusual setups.
- Test in the browser devtools: **Application → Cookies → http://localhost:3000** should show `jwt` after login.
- If the frontend is on a different origin, confirm it is listed in `CLIENT_ORIGIN` and that the API was restarted after the change.
- In development, open the app through Vite (`localhost:5173`) so the cookie and socket requests go through the proxy.

### Login succeeds in Postman but the next request is unauthenticated

Postman and curl do not automatically persist cookies between requests. Enable the Postman cookie jar, or use curl's `-c`/`-b` flags.

### Every request redirects to `/auth` after a restart

The cookie is the credential; `localStorage.chatUser` is only a cache. If the cookie expired or was invalidated, `/auth/me` fails and the client clears the cached user. Log in again. This is expected after a password reset or a `JWT_SECRET` change.

### Socket.IO connects fail with `connect_error: Authentication required`

The Socket.IO handshake uses the same `jwt` cookie and `tokenVersion` check as HTTP.

- Log in again; the cookie may be missing, expired, or from a previous `tokenVersion`.
- If you just reset the password, older sockets are intentionally disconnected and older cookies cannot reconnect.
- Confirm `withCredentials: true` on the client and credentials/CORS enabled on the server.
- Confirm the browser origin is in `CLIENT_ORIGIN` and the API was restarted.
- In development, check the `/socket.io` proxy and `ws: true` in `frontend/vite.config.js`.
- Behind a reverse proxy, forward WebSocket upgrade headers.

## Password recovery

### `401 { "message": "Unable to reset your password with the provided details" }`

This is the only message for a failed reset, deliberately covering:

- one or more wrong answers;
- an unknown email;
- an account with no configured recovery questions;
- a partial answer set (all stored questions must match).

Answers are normalized with NFKC, trimming, lowercasing, and whitespace collapsing. Case and extra spaces do not matter, but spelling, punctuation, and meaning do. Use the questions returned by `POST /api/auth/recovery/questions` and answer all of them.

### The questions endpoint returns questions for an email I do not recognize

That is expected. Unknown emails receive a decoy set of three questions so the endpoint does not reveal which accounts exist. The questions are not proof that the account exists.

### The questions endpoint returns fewer questions than expected

The response mirrors the account's configured questions, or a three-question decoy set for unknown accounts. Two-question accounts return two. If a question ID was removed from the server catalog after an account was created, it is filtered out and the account may become unrecoverable; keep the catalog append-only.

### `400` from the questions or reset endpoints

Common causes:

- missing or malformed email;
- missing `newPassword`;
- a password shorter than 6 characters or longer than 72;
- fewer than 2 or more than 3 answers;
- duplicate question IDs;
- an empty answer.

Fix the field and retry. These are input errors, not answer mismatches.

### Recovery returns `429`

The questions and reset endpoints share a limit of 12 requests per 15 minutes per IP. Wait for the window to reset or restart the API. Rate limits are disabled when `NODE_ENV=test`.

### Reset succeeds, but another tab is logged out

Expected. The reset increments `tokenVersion`, invalidates every older cookie, and disconnects the account's live sockets. The resetting request receives a fresh cookie; all other tabs must log in with the new password.

### I cannot change my security questions

There is no authenticated recovery-settings endpoint yet. The current flow can only use the questions chosen at registration. For a demo account, register a new account or update the document through an admin/migration process.

### A user created before recovery was added cannot reset

Legacy users have no `securityAnswers`. Their question lookup returns decoys and reset attempts fail generically. You need an authenticated backfill or an admin-assisted reset; the API does not invent answers.

## Messaging and realtime

### `400 { "message": "Invalid receiver ID" }` when sending

`POST /api/message/send/:id` expects the **receiver's user ID** in the path, not a username, email, or conversation ID. Use the `_id` value from `GET /api/auth/users`.

### `400 { "message": "You cannot send a message to yourself" }`

The receiver ID equals the caller's ID. Choose another user.

### `404 { "message": "Receiver not found" }`

The ID is a valid ObjectId but no user exists. Refresh the user list; the account may have been deleted.

### `400 { "message": "Message is required" }` or a length error

The `message` field is trimmed. Whitespace-only messages are rejected, and the maximum length is 2000 characters. A request body over 100 KB returns `413 Payload Too Large`.

### `400 { "message": "Invalid conversation ID" }` or `404 Conversation not found`

`GET /api/message/:conversationId` expects a conversation `ObjectId`. Use `_id` from `GET /api/message/conversations` (or `data.conversationId` from a send response). A user ID will not work.

### `403 { "message": "You are not a participant in this conversation" }`

The caller is authenticated but not in the conversation's `participants` array. This is intentional authorization; use `GET /api/message/conversations` to list only conversations the caller belongs to.

### `400 { "message": "Invalid message cursor" }`

The `before` query parameter must be a message `ObjectId`. Use `pagination.nextCursor` from the previous history response.

### Messages are not delivered in real time

Check in this order:

1. **Backend running** — the dev server proxies `/api` and `/socket.io` to port `3000`.
2. **Socket connected** — browser devtools → Network → WS should show a `/socket.io` connection. The client logs `Realtime connection failed` on failure.
3. **Cookie** — the `jwt` cookie must exist and be valid. A reset invalidates old sessions.
4. **Origin** — add the exact Vite origin to `CLIENT_ORIGIN` if it is not `http://localhost:5173`, then restart the API.
5. **Proxy** — reverse proxies must forward WebSocket upgrades. Vite already sets `ws: true`.
6. **Scale** — a single Socket.IO server is assumed. Multiple instances need the Redis adapter and sticky sessions.

REST is the source of truth. If realtime delivery fails, refreshing the conversation or selecting the contact again fetches history from the API.

### Typing indicators do not appear

Typing is ephemeral and only relayed inside a conversation room.

- Both users must have live sockets. The receiver only shows typing for the currently open conversation.
- The sender must emit `typing:start` after selecting a conversation that exists. The server rejects typing events for rooms the socket has not joined.
- A new conversation is joined automatically after the first message is sent.
- The client stops typing after 1.2 seconds of no input; the server expires the indicator after 3.5 seconds.
- Typing events are not stored, so a refresh clears them.

### Online dots are wrong

- Presence is in-memory. Multiple backend instances do not share it; run one instance or add the Redis adapter.
- Multiple tabs count as one online user via a per-user connection count.
- A server crash clears all presence; clients repopulate on reconnect.
- Last-seen timestamps are not stored.

### A sender shows two copies of the same message

The client deduplicates by `_id` because the sender can receive both the REST `201` response and the `message:new` broadcast. If duplicates appear, confirm the message `_id` is present in both paths and that the component is using the current `ChatContext`.

### Messages sent while the socket was offline are missing from the open thread

Known limitation. On reconnect, the client refreshes the contact-to-conversation map but does not backfill the open thread. Reselect the contact or reload the page to fetch the latest history. See [Development → Known gaps and issues](development.md#known-gaps-and-issues).

### Conversations are missing after a refresh

The client restores conversations from `GET /api/message/conversations` and maps the other participant to the conversation ID. Check that:

- the API returns the conversations for the logged-in user;
- the contact list is not beyond the first 100 users (`GET /auth/users?limit=100`);
- both users still exist.

### Messages cannot be found after restarting development

MongoDB persists data, but an in-memory database or a changed `MONGO_URI` will not. Confirm you are using the same database and collection (`messages`). Use `GET /api/message/conversations` to rediscover conversations rather than relying on a saved ID.

### Two conversations appear for the same user pair

New conversations are protected by a unique `participantKey`. Duplicates can remain in data created before that field existed. The API reuses the keyed conversation for new messages, but old history may be split. Inspect the `convesations` collection and merge/backfill duplicates in a one-time migration.

### `400 { "message": "Invalid JSON in request body" }`

The request body is malformed JSON. Validate it with a JSON parser and ensure `Content-Type: application/json` is set. Trailing commas and single quotes are not valid JSON.

## Frontend, build, and static hosting

### CORS error mentioning an origin

The backend allows only the origins listed in `CLIENT_ORIGIN` (default `http://localhost:5173`). If Vite chose a different port, or you opened the app via `127.0.0.1`, add that exact origin and restart the API:

```dotenv
CLIENT_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

Include the scheme and port, with no trailing slash. Ensure `credentials: true` stays set on both sides. `npm run preview` uses port `4173` by default, which also needs to be added.

### Vite reports `ECONNREFUSED` for `/api`

The proxy target is not running.

- Start the backend with `npm run dev` on port `3000`.
- If you changed `PORT`, update both proxy targets in `frontend/vite.config.js`.
- Restart Vite after changing `vite.config.js`.

### The session loader spins forever

`AuthContext` revalidates a cached user with `GET /auth/me` before rendering routes.

- Confirm the API is running and `/api/health` responds.
- Check browser devtools for a pending or failed `/auth/me`.
- A CORS/cookie problem can leave the session unauthenticated; inspect the console and network response.
- The Axios client has no request timeout, so a blackholed connection can leave the loader waiting. Fix connectivity or add a timeout.

### The app shows the auth screen even though I logged in earlier

The cookie expired, was cleared, or was invalidated by a password reset or `JWT_SECRET` change. `localStorage.chatUser` is only a cache; log in again.

### Avatar images do not load

Generated avatars come from `https://avatar.iran.liara.run`. Check that the host is reachable from your network and not blocked by a proxy/ad blocker. You can pass a custom `profilepicture` URL during registration.

The CSP allows images from `'self'`, `data:`, and `https:`. Plain `http:` image URLs are blocked in production.

### `npm run build` fails

Common causes:

- running from the repository root with the frontend `npm run build` instead of `npm run build` at the root (which targets `frontend/`);
- an unused/undefined import in a bundled component. Vite reports the file and line;
- Node is too old. Use 22.12+.

Run from `frontend/`:

```bash
npm run build
```

or from the root:

```bash
npm run build
```

### `npm run lint` reports warnings

Oxlint config is in `frontend/.oxlintrc.json`. The current warnings are:

- `react/only-export-components` for the context modules that export both a provider and a hook;
- a `react(set-state-in-effect)` warning in `ChatContext`.

Warnings do not fail the command. Fix new errors and review new warnings before merging.

### `npm run preview` returns 404 for API calls

The preview server serves only the built frontend and does not proxy the API. Either:

- use the Express-served build (`npm run build` then `npm start`) for a production-like check, or
- set `VITE_API_URL`/`VITE_SOCKET_URL` to the API origin, add the preview origin to `CLIENT_ORIGIN`, and rebuild.

### `npm run preview` cannot use the production cookie

`npm run preview` serves over plain HTTP. In production the auth cookie is `Secure`; for local preview use `NODE_ENV=development` on the API, or test through Express with HTTPS in front.

### Split hosting fails even though CORS is configured

The current cookie is `SameSite=Strict` and the CSP permits same-origin connections plus `ws:`/`wss:`. Truly cross-site hosting requires:

- a deliberate cookie change to `SameSite=None; Secure`;
- HTTPS;
- a CSRF strategy;
- CSP updates for the API origin.

Same-origin hosting is strongly recommended.

### Docker container exits immediately

Check the logs:

```bash
docker logs <container-id>
```

Common causes:

- missing `MONGO_URI` or `JWT_SECRET`;
- `JWT_SECRET` shorter than 32 characters while `NODE_ENV=production` is set in the image;
- MongoDB/Atlas unreachable from the container;
- an invalid `PORT` or a port collision;
- `CLIENT_ORIGIN` not set to the deployed origin.

Run with runtime variables:

```bash
docker run --rm -p 3000:3000 --env-file .env nexchat
```

`.env` is deliberately excluded from the image. Do not bake secrets into it.

### The Docker image serves `Backend is working!`

The runtime image should contain `frontend/dist`. Rebuild the image and inspect the build stage output. If you run the backend outside Docker without building the frontend, this message is expected.

## Test problems

### `npm test` fails while downloading MongoDB

`mongodb-memory-server` downloads a MongoDB binary on first use. It needs network access and a writable cache directory. Retry on a network that allows the download, or pre-populate the binary cache. The tests themselves do not use the application database.

### `npm test` passes locally but fails in CI

- Use Node 22.12+ (the suite uses `node:test`, a quoted test glob, `supertest`, and ESM). Node 20.19 can run Vite but cannot expand the quoted test glob.
- Allow the first-run MongoDB binary download, or cache it between runs.
- Give the test process enough time on slow machines.
- Do not set `NODE_ENV=production` for tests; the suite sets `NODE_ENV=test` internally to disable rate limits.
- The realtime tests open an ephemeral port and a WebSocket. Corporate proxies or endpoint security software that blocks local sockets can cause timeouts.

### Tests pass but the running API behaves differently

The suites import `backend/app.js` directly and use in-memory databases. They do not exercise `.env`, the real `MONGO_URI`, the production HTTP listener, or production cookie flags. Check environment variables and `GET /api/health` separately.

### Rate-limit behavior is not covered by `npm test`

Expected. `NODE_ENV=test` skips rate limits. To test limits, run the API in development and issue repeated requests, or add a dedicated integration test that does not set the test skip.

### The suite hangs after a realtime failure

The realtime suite closes clients after each test. If a custom test leaves a client open, the process may not exit promptly. Always close sockets in `finally`/`afterEach`, and use event waiters that time out instead of sleeping.

## Tool-specific issues

### PowerShell treats `curl` differently

In PowerShell, `curl` is an alias for `Invoke-WebRequest` and does not accept curl flags. Use `curl.exe` or PowerShell's native cmdlets:

```powershell
$body = @{ email = "ada@example.com"; password = "secret123" } | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" -Body $body -SessionVariable session

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -WebSession $session
```

### PowerShell blocks npm with an execution-policy error

If PowerShell says `npm.ps1 cannot be loaded because running scripts is disabled on this system`, use the Windows command shim:

```powershell
npm.cmd run dev
```

Or, if your organization allows it, permit locally created scripts for the current user:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### `MONGO_URI` with special characters fails in Atlas

URL-encode the password. For example, `p@ss:word` becomes `p%40ss%3Aword` in the connection string. If you use the Atlas "Connect" dialog, it can generate an encoded URI for you.

### Node version errors from Vite

Use a current LTS release (Node 22.12+ recommended). Vite 8 accepts `^20.19.0 || >=22.12.0`, but the backend test glob requires Node 21+. Check with `node --version`; older Node versions will fail to start Vite or the tests.

## Still stuck?

Collect:

1. The exact request (method, path, headers) and response (status, body).
2. The backend console output around the request.
3. The output of `GET /api/health` and whether both `DB connected successfully` and `Working at 3000` are logged.
4. Whether the `jwt` cookie exists in devtools or your curl cookie jar.
5. Browser devtools → Network → WS state for `/socket.io`, plus any console errors.
6. The output of `npm test` if the problem is test-related.

Do not paste `.env` values, cookies, JWTs, recovery answers, or password hashes into issues or chat logs.

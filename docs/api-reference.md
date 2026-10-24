# API Reference

Local base URL:

```
http://localhost:3000/api
```

Socket.IO uses the same host on `/socket.io`. In development, Vite proxies `/api` and `/socket.io` to `http://localhost:3000`, so the client can use same-origin relative paths.

When a production frontend build exists in `frontend/dist`, Express serves it (including the SPA fallback) and `GET /` returns `index.html`. Without a build, `GET /` returns the plain-text liveness message.

## Conventions

- Send `Content-Type: application/json` for requests with a body.
- Protected routes require the `jwt` cookie set by register, login, or password reset.
- Browser clients must enable credentials. The frontend Axios instance uses `withCredentials: true`.
- IDs are MongoDB `ObjectId` strings (24 hexadecimal characters).
- Timestamps are ISO 8601 strings.
- Allowed browser origins come from `CLIENT_ORIGIN` (comma-separated, default `http://localhost:5173`).
- The message receiver field is intentionally spelled **`reciverId`** and must remain unchanged.

### Response envelope

Most responses include a boolean `success` and a human-readable `message`:

```json
{ "success": true, "message": "Human-readable result" }
```

Errors:

```json
{ "success": false, "message": "Description of the problem" }
```

List endpoints return their data at the top level (`users`, `messages`, `conversations`, `questions`). Message send uses `data`.

### Authentication cookie

Register, login, and password reset set an `HttpOnly` cookie:

```http
Set-Cookie: jwt=<token>; Max-Age=2592000; Path=/; HttpOnly; SameSite=Strict
```

`Secure` is added when `NODE_ENV === "production"`. The JWT payload is `{ userId, tokenVersion }` and expires after 30 days.

`tokenVersion` is incremented by a password reset. Any token carrying an older version is rejected by both HTTP middleware and the Socket.IO handshake, and the account's live sockets are disconnected immediately.

For command-line testing, persist cookies with curl's `-c`/`-b` flags.

### Pagination

| Endpoint type | Parameters | Response metadata |
| --- | --- | --- |
| Users, conversations | `page` (default `1`), `limit` (default `20`, max `100`) | `pagination.page`, `limit`, `total`, `hasMore` |
| Message history | `limit` (default `50`, max `100`), `before` (message ID cursor) | `pagination.limit`, `hasMore`, `nextCursor` |

Invalid/out-of-range list values fall back to defaults. A malformed `before` cursor returns `400`.

### Rate limits

| Scope | Limit |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login` | 30 requests / 15 min / IP |
| `POST /api/auth/recovery/questions`, `POST /api/auth/recovery/reset` | 12 requests / 15 min / IP |
| `POST /api/message/send/:id` | 120 requests / min / IP |
| Other routes | No application-level limit |

Limits return `429`:

```json
{ "success": false, "message": "Too many requests. Please try again later." }
```

Rate limits are skipped when `NODE_ENV=test`. The default store is in-memory and per process.

### Status codes

| Code | Meaning |
| --- | --- |
| `200` | Success |
| `201` | User or message created |
| `400` | Invalid/missing input, malformed JSON, invalid ObjectId, duplicate account |
| `401` | Missing/invalid cookie, invalid credentials, failed recovery |
| `403` | Caller is not a conversation participant |
| `404` | Unknown route, conversation, or receiver |
| `409` | Duplicate-key race surfaced by the global handler |
| `413` | Body exceeds 100 KB |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |
| `503` | Health check failed because MongoDB is disconnected |

## Endpoint summary

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | No | Frontend build or plain-text liveness |
| `GET` | `/api/health` | No | JSON health check |
| `POST` | `/api/auth/register` | No | Create account + recovery questions |
| `POST` | `/api/auth/login` | No | Log in |
| `POST` | `/api/auth/logout` | No | Clear cookie |
| `GET` | `/api/auth/me` | Yes | Revalidate/return current user |
| `GET` | `/api/auth/users` | Yes | Paginated/searchable user list |
| `GET` | `/api/auth/recovery/catalog` | No | Fixed security-question catalog |
| `POST` | `/api/auth/recovery/questions` | No | Questions configured for an email |
| `POST` | `/api/auth/recovery/reset` | No | Verify answers and set a new password |
| `GET` | `/api/message/conversations` | Yes | Caller's conversations + last message |
| `POST` | `/api/message/send/:id` | Yes | Send a message |
| `GET` | `/api/message/:conversationId` | Yes | Paginated message history |
| Socket | `/socket.io` | Cookie | Realtime messages/presence/typing |

---

## Health

### `GET /`

Serves `frontend/dist/index.html` when the build exists; otherwise returns:

```text
Backend is working!
```

### `GET /api/health`

```json
{ "success": true, "status": "ok", "database": "connected" }
```

Database disconnected — `503`:

```json
{ "success": false, "status": "degraded", "database": "disconnected" }
```

---

## Authentication

### `POST /api/auth/register`

**Request body**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `fullname` | string | Yes | Trimmed; max 80 |
| `username` | string | Yes | 3–30 chars; letters, numbers, `.`, `_`, `-`; unique |
| `email` | string | Yes | Trimmed, lowercased, valid format; unique |
| `gender` | string | Yes | `"male"` or `"female"` |
| `password` | string | Yes | 6–72 chars; must contain non-whitespace |
| `profilepicture` | string | No | Max 500 chars; generated avatar if omitted |
| `securityAnswers` | array | Yes | 2–3 distinct entries: `{ questionId, answer }` |

Each `questionId` must come from `GET /api/auth/recovery/catalog`. Answers are trimmed, NFKC-normalized, lowercased, whitespace-collapsed, and bcrypt-hashed. They are never returned.

```json
{
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
}
```

**Success — `201 Created`** with `Set-Cookie`:

```json
{
  "success": true,
  "message": "User registered successfully",
  "_id": "6650f1c2a4b8d9e1f2a3b4c5",
  "fullname": "Ada Lovelace",
  "username": "ada",
  "profilepicture": "https://...",
  "email": "ada@example.com"
}
```

**Errors**

| Status | Message | Cause |
| --- | --- | --- |
| `400` | `Please provide all required fields` | Missing `fullname`, `username`, `email`, `gender`, or `password` |
| `400` | `Please choose 2-3 security questions and provide answers` | Missing/invalid `securityAnswers` array or wrong length |
| `400` | `Please choose different security questions` | Duplicate `questionId` |
| `400` | `Please answer all selected security questions` | Empty answer |
| `400` | `Please choose a valid security question` | Unknown `questionId` |
| `400` | `Security answers must be at most 120 characters long` | Oversized answer |
| `400` | `Invalid security answer format` | Entry is not an object |
| `400` | Format/length password, username, email, or profile-picture errors | See validation messages |
| `400` | `Username Already Exists` / `Email Already Exists` | Duplicate account |
| `429` | `Too many requests. Please try again later.` | Rate limit |

---

### `POST /api/auth/login`

```json
{ "email": "ada@example.com", "password": "secret123" }
```

**Success — `200 OK`**

```json
{
  "success": true,
  "_id": "6650f1c2a4b8d9e1f2a3b4c5",
  "fullname": "Ada Lovelace",
  "username": "ada",
  "profilepicture": "https://...",
  "email": "ada@example.com",
  "message": "Successfully logged in"
}
```

Unknown email and wrong password both return `401 Invalid email or password`.

---

### `POST /api/auth/logout`

Clears the cookie and always succeeds:

```json
{ "success": true, "message": "Logged out successfully" }
```

---

### `GET /api/auth/me`

Returns an explicit public projection. Internal fields (`password`, `securityAnswers`, `tokenVersion`) are never included.

```json
{
  "success": true,
  "user": {
    "_id": "6650f1c2a4b8d9e1f2a3b4c5",
    "fullname": "Ada Lovelace",
    "username": "ada",
    "email": "ada@example.com",
    "gender": "female",
    "profilepicture": "https://...",
    "createdAt": "2026-10-24T10:00:00.000Z",
    "updatedAt": "2026-10-24T10:00:00.000Z"
  }
}
```

`401` if the cookie is missing, invalid/expired, belongs to a deleted user, or has an outdated `tokenVersion`.

---

### `GET /api/auth/users`

Query: `page`, `limit` (max `100`), `search` (case-insensitive full name/username).

```json
{
  "success": true,
  "users": [
    {
      "_id": "6650f2d3b5c9e0f1a2b3c4d6",
      "fullname": "Grace Hopper",
      "username": "grace",
      "profilepicture": "https://...",
      "createdAt": "2026-10-24T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "hasMore": false }
}
```

The caller is excluded. Email, gender, answers, passwords, and token versions are not returned.

---

## Password recovery

### `GET /api/auth/recovery/catalog`

Public, cacheable list of available questions:

```json
{
  "success": true,
  "questions": [
    { "questionId": "first_pet", "question": "What was the name of your first pet?" },
    { "questionId": "birth_city", "question": "What city were you born in?" }
  ]
}
```

### `POST /api/auth/recovery/questions`

```json
{ "email": "ada@example.com" }
```

Returns the questions configured for that account. Unknown emails and accounts without recovery data receive a decoy set of three questions, so the endpoint does not reveal account existence.

```json
{
  "success": true,
  "questions": [
    { "questionId": "first_pet", "question": "What was the name of your first pet?" },
    { "questionId": "birth_city", "question": "What city were you born in?" },
    { "questionId": "first_school", "question": "What was the name of your first school?" }
  ]
}
```

Invalid email format → `400`. The response is `Cache-Control: no-store`.

### `POST /api/auth/recovery/reset`

```json
{
  "email": "ada@example.com",
  "newPassword": "new-secret-123",
  "securityAnswers": [
    { "questionId": "first_pet", "answer": "MILO" },
    { "questionId": "birth_city", "answer": " london " },
    { "questionId": "first_school", "answer": "Home" }
  ]
}
```

**Success — `200 OK`** returns the same user fields as login and sets a fresh cookie:

```json
{
  "success": true,
  "_id": "6650f1c2a4b8d9e1f2a3b4c5",
  "fullname": "Ada Lovelace",
  "username": "ada",
  "profilepicture": "https://...",
  "email": "ada@example.com",
  "message": "Password reset successfully"
}
```

**Failure — `401 Unauthorized`** (wrong answers, unknown email, or no recovery data):

```json
{
  "success": false,
  "message": "Unable to reset your password with the provided details"
}
```

Validation failures for malformed input return `400`. The password reset increments `tokenVersion`, so all old cookies become invalid, and disconnects the account's live sockets (clients receive `disconnect` with reason `io server disconnect`).

---

## Messages

### `GET /api/message/conversations`

Query: `page`, `limit` (max `100`). Results are newest activity first.

```json
{
  "success": true,
  "conversations": [
    {
      "_id": "6650f3e4c6d0f1a2b3c4d6e7",
      "participants": [
        { "_id": "...", "fullname": "Ada Lovelace", "username": "ada", "profilepicture": "..." },
        { "_id": "...", "fullname": "Grace Hopper", "username": "grace", "profilepicture": "..." }
      ],
      "otherParticipant": {
        "_id": "...", "fullname": "Grace Hopper", "username": "grace", "profilepicture": "..."
      },
      "lastMessage": {
        "_id": "...", "senderId": "...", "reciverId": "...", "message": "Hello Grace!",
        "conversationId": "...", "createdAt": "...", "updatedAt": "..."
      },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "hasMore": false }
}
```

The frontend uses this endpoint to restore contact-to-conversation mappings after a refresh. `participantKey` is never exposed.

### `POST /api/message/send/:id`

`id` is the receiver's user ID. Body: `{ "message": "Hello Grace!" }` (trimmed, 1–2000 chars).

**Success — `201 Created`**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "senderId": "...",
    "reciverId": "...",
    "message": "Hello Grace!",
    "conversationId": "...",
    "_id": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

The server also emits a `message:new` Socket.IO event.

**Errors**

| Status | Message |
| --- | --- |
| `400` | `Message is required` |
| `400` | `Message must be at most 2000 characters long` |
| `400` | `Invalid receiver ID` |
| `400` | `You cannot send a message to yourself` |
| `404` | `Receiver not found` |
| `401` | Authentication error |
| `429` | Rate limit |

A conversation is created lazily and reused via a unique `participantKey`.

### `GET /api/message/:conversationId`

Query: `limit` (default `50`, max `100`), `before` (message cursor).

Messages are returned oldest → newest within the page and enriched with public sender/receiver summaries.

```json
{
  "success": true,
  "messages": [
    {
      "_id": "...",
      "senderId": "...",
      "reciverId": "...",
      "message": "Hello Grace!",
      "conversationId": "...",
      "createdAt": "...",
      "updatedAt": "...",
      "sender": { "_id": "...", "fullname": "Ada Lovelace", "username": "ada", "profilepicture": "..." },
      "receiver": { "_id": "...", "fullname": "Grace Hopper", "username": "grace", "profilepicture": "..." }
    }
  ],
  "pagination": { "limit": 50, "hasMore": false, "nextCursor": null }
}
```

When `hasMore` is true, pass `pagination.nextCursor` as `before` to load the next older page.

**Errors**

| Status | Message |
| --- | --- |
| `400` | `Invalid conversation ID` |
| `400` | `Invalid message cursor` |
| `401` | Authentication error |
| `403` | `You are not a participant in this conversation` |
| `404` | `Conversation not found` |

---

## Socket.IO

### Connecting

```js
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  withCredentials: true,
  path: '/socket.io',
});
```

The handshake reads the `jwt` cookie, verifies the JWT and `tokenVersion`, and rejects unauthenticated connections with a `connect_error` whose message is `Authentication required`.

On connect, the server joins:

- `user:<userId>` for presence and messages from not-yet-joined conversations.
- Every existing `conversation:<conversationId>` the user participates in.

When a message creates a new conversation, both participants' live sockets are joined to its room automatically.

CORS for Socket.IO uses the same `CLIENT_ORIGIN` allowlist and credentials.

### Server → client events

| Event | Payload | Meaning |
| --- | --- | --- |
| `message:new` | `{ conversationId, message }` | New message; `message` matches the REST send shape |
| `presence:state` | `{ userIds: string[] }` | Snapshot of currently online users |
| `presence:update` | `{ userId, online: boolean }` | A user's first socket connected or last socket disconnected |
| `typing:update` | `{ conversationId, userId, typing: boolean }` | Another participant started/stopped typing |

### Client → server events

| Event | Payload | Notes |
| --- | --- | --- |
| `typing:start` | `{ conversationId }` | Only relayed if the socket has joined that conversation room |
| `typing:stop` | `{ conversationId }` | Same room check |

The frontend treats REST as the source of truth: a sender may receive both the `201` response and `message:new`, so messages are deduplicated by `_id`. Reconnecting clients refetch conversations to recover missed events.

---

## Command-line examples

```bash
# 1. Register with recovery answers
curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Ada Lovelace",
    "username": "ada",
    "email": "ada@example.com",
    "gender": "female",
    "password": "secret123",
    "securityAnswers": [
      {"questionId":"first_pet","answer":"Milo"},
      {"questionId":"birth_city","answer":"London"},
      {"questionId":"first_school","answer":"Home"}
    ]
  }' \
  http://localhost:3000/api/auth/register

# 2. Session and users
curl -b cookies.txt http://localhost:3000/api/auth/me
curl -b cookies.txt "http://localhost:3000/api/auth/users?page=1&limit=10"

# 3. Send and read messages (replace IDs)
curl -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello Grace!"}' \
  http://localhost:3000/api/message/send/6650f2d3b5c9e0f1a2b3c4d6

curl -b cookies.txt http://localhost:3000/api/message/conversations
curl -b cookies.txt "http://localhost:3000/api/message/6650f3e4c6d0f1a2b3c4d6e7?limit=50"

# 4. Recover a password
curl -H "Content-Type: application/json" \
  -d '{"email":"ada@example.com"}' \
  http://localhost:3000/api/auth/recovery/questions

curl -i -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "email":"ada@example.com",
    "newPassword":"new-secret-123",
    "securityAnswers":[
      {"questionId":"first_pet","answer":"Milo"},
      {"questionId":"birth_city","answer":"London"},
      {"questionId":"first_school","answer":"Home"}
    ]
  }' \
  http://localhost:3000/api/auth/recovery/reset

# 5. Log out
curl -b cookies.txt -c cookies.txt -X POST http://localhost:3000/api/auth/logout
```

### Browser/Axios example

```js
import api from './api'; // baseURL /api, withCredentials: true

await api.post('/auth/login', { email: 'ada@example.com', password: 'secret123' });
const { data: session } = await api.get('/auth/me');
const { data: conversations } = await api.get('/message/conversations');
```

### PowerShell

`curl` is an alias for `Invoke-WebRequest`; use `curl.exe` or native cmdlets:

```powershell
$body = @{ email = "ada@example.com"; password = "secret123" } | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/api/auth/login" `
  -ContentType "application/json" -Body $body -SessionVariable session

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -WebSession $session
```

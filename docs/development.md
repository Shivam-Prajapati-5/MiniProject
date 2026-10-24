# Development

This document covers code conventions, common workflows, testing, security notes, and remaining gaps. For setup commands, see [Getting Started](getting-started.md). For endpoint details, see the [API Reference](api-reference.md).

## Repository workflow

- Backend commands run from the repository root (`npm run dev`, `npm start`, `npm test`).
- Frontend commands run from `frontend/` (`npm run dev`, `npm run build`, `npm run lint`).
- `npm run dev:frontend` runs the frontend dev server from the root as a convenience.
- `npm run build` installs frontend dependencies and builds `frontend/dist`.
- `npm start` runs the Express server, which also serves `frontend/dist` when it exists.
- Backend source is plain JavaScript ESM; there is no backend build step or TypeScript.
- The frontend is built by Vite. There is no automated frontend test runner yet.
- A root `.gitignore` excludes `node_modules/`, `.env`, `frontend/dist/`, logs, and coverage output. Keep it that way if you initialize a repository.
- There is no CI workflow yet. A pipeline should run `npm test`, the frontend build, and the frontend lint step.

## Code conventions

### Backend

- ES modules: `import`/`export`; relative imports include `.js`.
- 4-space indentation, semicolons, double-quoted strings.
- App construction lives in `backend/app.js`; process startup (environment validation, DB connection, HTTP server, Socket.IO, shutdown) lives in `backend/index.js`. Keep them separate so tests can import the app without opening a fixed port.
- Read configuration through `env` from `backend/config/env.js`; do not read `process.env` in controllers.
- Routers live in `backend/rout/`, handlers in `backend/routControlers/`, models in `backend/Modes/`. These folder names are misspelled/abbreviated in the existing code; keep imports consistent with them unless you rename everything together.
- Controllers are exported as named async functions. On unexpected errors, call `next(error)` instead of building a `500` response locally. The centralized handler in `backend/middleware/errorHandler.js` owns error mapping.
- Success responses include `success: true`; errors include `success: false` and `message`.
- Protected routes use the `isLogin` middleware and read the caller from `req.user`.
- Validate and normalize request input with helpers in `backend/utils/validation.js`; use `parsePagination` for `page`/`limit` lists.
- Use `escapeRegExp` before building a `RegExp` from user input.
- Models are referenced by their Mongoose model names (`User`, `Conversation`, `Message`).
- Do not rename `reciverId` or the `convesation` model casually: both affect stored data and/or the public API shape.
- When signing a session token, use `jwtToken(userId, res, tokenVersion)` from `backend/utils/jwtwebToken.js`. The token payload must include `{ userId, tokenVersion }`.
- Recovery behavior must not reveal account existence. Keep the decoy question set, the shared failure message, and the bcrypt comparison work for unknown accounts.

### Security-question data

- The catalog is in `backend/utils/securityQuestions.js`; IDs are stable API/data values.
- Normalize answers with `normalizeSecurityAnswer` before hashing or comparing. Do not change normalization without a migration/backfill plan: existing hashes were created from normalized answers.
- Registration requires 2–3 distinct question IDs via `parseSecurityAnswers`.
- Never return `answerHash`, `securityAnswers`, or `tokenVersion` in a response.
- Password reset must increment `tokenVersion` in the same update that changes the password.
- After a password reset, disconnect the user's live sockets (`io.in(userRoom(userId)).disconnectSockets(true)`) so an older session cannot keep receiving messages.

### Realtime

- The Socket.IO instance is created in `backend/realtime/socket.js` and shared through `backend/realtime/io.js`.
- `getIO()` may return `null` when tests import the Express app without a Socket.IO server. Emit code must tolerate that, as `publishNewMessage` does.
- Room names are produced by `userRoom(userId)` and `conversationRoom(conversationId)`; do not build room strings by hand.
- Socket authentication repeats the HTTP JWT and `tokenVersion` checks. Any new session rule must be applied in both `isLogin` and the socket handshake.
- `message:new` is emitted to the conversation room and both participant user rooms. New conversations join both users' sockets to the room before emitting.
- Typing events are ephemeral and must be checked against the socket's joined rooms. Do not trust a client-supplied conversation ID.
- Presence counts connections per user so multiple tabs do not produce false offline events.

### Frontend

- Function components with hooks.
- 2-space indentation. Semicolon use is mixed between files; follow the surrounding file.
- Global CSS variables live in `src/index.css`; component/page styles live in dedicated CSS files.
- API calls go through the shared Axios instance in `src/api.js`.
- Auth state is accessed with `useAuth()` from `src/context/AuthContext.jsx`.
- Chat state, conversations, presence, and typing are accessed with `useChatContext()` from `src/context/ChatContext.jsx`.
- Handle Socket.IO cleanup by removing every listener and disconnecting in the effect cleanup.
- Deduplicate messages by `_id`: the sender can receive both the REST response and the `message:new` broadcast.
- Use `VITE_API_URL` and `VITE_SOCKET_URL` for split deployments instead of editing source.

## Adding a backend feature

The structure is app → router → middleware → controller → model.

1. **Model** — add or extend a Mongoose schema in `backend/Modes/`. Export the model as the default export, following the existing files. Declare indexes alongside the schema.
2. **Controller** — add an exported async handler in the relevant `backend/routControlers/*.js` file. Validate input, use `req.user._id` for the caller, return the `{ success, message }` envelope, and call `next(error)` on unexpected failures.
3. **Validation** — add reusable validators/normalizers to `backend/utils/validation.js` if the input is shared.
4. **Router** — register the route in `backend/rout/*.js` and apply `isLogin` when authentication is required. Put specific paths before parameterized paths.
5. **Mount** — if you add a new router, mount it in `backend/app.js` under `/api/...`.
6. **Realtime** — if the feature needs live delivery, emit from the controller via `getIO()` and the room helpers. Never make REST success depend on a socket being present.
7. **Tests** — add a Supertest case to `backend/tests/api.test.js` and a socket case to `backend/tests/realtime.test.js` when delivery changes.
8. **Documentation** — update the [API Reference](api-reference.md), the [Database](database.md) page for storage changes, and this page for new gaps or commands.

Minimal handler pattern:

```js
export const exampleHandler = async (req, res, next) => {
    try {
        const userId = req.user._id;

        // Validate input first, returning 400 with { success: false, message }.

        return res.status(200).json({
            success: true,
            data: null
        });
    } catch (error) {
        return next(error);
    }
};
```

### Adding a Socket.IO event

1. Register the listener in the connection handler in `backend/realtime/socket.js`.
2. Validate the payload and verify room membership before broadcasting.
3. Use a namespaced event name such as `typing:update` or `presence:update`.
4. Add the event to the API reference.
5. Add a realtime test that waits for the event before triggering the action, so the assertion cannot miss a fast response.

## Known gaps and issues

### Frontend

| Issue | Impact | Suggested fix |
| --- | --- | --- |
| No automated frontend tests | UI/auth/realtime regressions are not caught | Add Vitest + React Testing Library |
| Missed messages are not backfilled into the open thread after a socket reconnect | While offline, the open conversation can be missing messages until the contact is reselected or the page reloads; reconnect currently refreshes the conversation map only | Refetch the active conversation on reconnect, or add a `since`/`after` message cursor |
| No optimistic send state | A failed send shows a toast and loses the text from the composer | Keep a pending message with retry/error state |
| Contact list is capped at 100 users | Larger directories cannot be browsed fully | Add paging, infinite scroll, or server-side search |
| Search is client-side over the loaded users | Does not scale to large user directories | Use the backend `search` parameter with debounce and pagination |
| Presence is online/offline only | No last-seen information | Store `lastSeenAt` and send it with presence events |
| No unread counts or read receipts | Users cannot see which conversations have new activity | Add per-participant `lastReadAt` and unread aggregation |
| No message search, editing, deletion, or forwarding | Chat is intentionally minimal | Add endpoints and UI incrementally |
| Lint warnings are not treated as errors | Fast-refresh structure and effect state warnings can accumulate | Split context exports/hooks or configure the rules deliberately |

### Backend and realtime

| Issue | Impact | Suggested fix |
| --- | --- | --- |
| In-memory presence | Multi-instance deployments report users as online on only one instance | Use the Socket.IO Redis adapter plus a shared presence store |
| In-memory rate limits | Limits are per process and reset on restart | Use a shared store (Redis) for multi-instance deployments |
| No Socket.IO Redis adapter or sticky-session guidance | Multiple instances break room broadcasts and can break polling handshakes | Add the adapter and configure sticky sessions, or keep the demo single-instance |
| Delivery is best-effort | Messages sent while a user is offline are only recovered by a later history fetch | Add durable inbox/unread semantics or a reconnect sync cursor |
| No read receipts, unread counts, or notification system | Clients cannot show "seen" or notify outside the open tab | Store read markers and add notification delivery |
| No group conversations | Only 1:1 chats are supported | Relax the 2-participant validator and redesign `participantKey` |
| No message/user deletion or retention | Data grows indefinitely; no account deletion | Add deletion endpoints plus cascade/retention jobs |
| No password change while logged in | Users can only reset via security questions | Add an authenticated password-change endpoint |
| 30-day JWTs with no refresh rotation | A stolen token remains valid until expiry unless `JWT_SECRET` or `tokenVersion` changes; logout only clears the current cookie | Add short-lived access tokens plus refresh rotation and session records |
| No account lockout or per-account backoff | Distributed guessing is only slowed by IP rate limits | Add per-account throttling and alerting |
| No structured logging, request IDs, metrics, or tracing | Production failures are hard to correlate | Add a logger (`pino`/`winston`) and request correlation IDs |
| User search uses an unanchored regex | Collection scans as the user base grows | Add a text index or normalized search field; keep `escapeRegExp` |
| No API versioning | Future breaking changes are hard to roll out | Introduce `/api/v1` before clients depend on a stable contract |
| No CI/CD workflow | Releases are manual | Add CI for tests, build, lint, and dependency audit |

### Recovery and security questions

| Issue | Impact | Suggested fix |
| --- | --- | --- |
| Security questions are weaker than email/MFA | Answers may be guessable or publicly discoverable | Offer email verification/MFA as an additional path; keep answers unique and private |
| No way to rotate security questions | Users cannot change compromised answers | Add an authenticated recovery-settings endpoint |
| Legacy users have no `securityAnswers` | They cannot recover an account with the current flow | Collect answers through an authenticated migration or provide an admin-assisted reset |
| Recovery catalog is fixed | No localization or per-user custom questions | Add localized catalogs with stable IDs; never remove IDs still stored |
| Decoy questions imply account existence is hidden, not proven | An attacker can still attempt resets, subject to rate limits | Keep generic messages/timing and monitor abuse |
| No email verification | Anyone can register with an address they do not own | Add verification before enabling sensitive actions |

### Data model and operations

| Issue | Impact | Suggested fix |
| --- | --- | --- |
| `reciverId` is misspelled | Permanent API/data compatibility constraint | Keep unless performing a coordinated migration |
| Conversation model name `convesation` | Collection is `convesations`; confusing | Rename with a migration only |
| Legacy duplicate conversations | Unique constraint only protects new pairs | Detect and merge duplicates before backfilling `participantKey` |
| `participantKey` is derived data | Editing participants would desynchronize it | Recompute the key in any future participant-update path |
| No migration system | Schema/data changes are manual | Add versioned migrations before the next breaking storage change |

## Security notes

Current protections:

- Passwords and security answers are hashed with bcryptjs (cost 10). Password and answer hashes use `select: false` and are explicitly selected only when needed.
- JWT payloads include `tokenVersion`. Password reset increments it and disconnects live sockets, invalidating every older HTTP session and socket handshake.
- JWTs are stored in `HttpOnly`, `SameSite=Strict` cookies, reducing JavaScript access and basic CSRF risk.
- Cookie set/clear options share one helper, so `Secure` and `SameSite` cannot drift.
- CORS is restricted to an environment-configured allowlist with credentials enabled.
- `helmet` adds security headers, including a CSP that allows HTTPS images and WebSocket connections. `x-powered-by` is disabled.
- Auth login/register, recovery, and message-send routes are rate limited.
- Login uses a generic `Invalid email or password` message to avoid user enumeration.
- Recovery uses decoy questions for unknown emails and one generic failure message for wrong answers, unknown accounts, and accounts without recovery data.
- Answers are NFKC-normalized, trimmed, lowercased, whitespace-collapsed, length-limited, and hashed.
- Public user listings omit email, gender, passwords, answer hashes, and token versions.
- Inputs are trimmed, length-limited, and format-checked; regex search input is escaped.
- ObjectIds are validated before database use.
- Conversation reads and socket typing events require membership.
- Receiver existence and self-messaging are checked.
- Socket handshakes verify the same cookie and `tokenVersion` as HTTP requests. Password reset also disconnects the user's live sockets.
- The global error handler hides unexpected error details in production.
- Run `npm audit` regularly; the last install reported zero known vulnerabilities.

Gaps to address before production:

1. **JWT lifecycle:** 30-day tokens have no refresh rotation. Logout clears the current cookie but does not revoke that token server-side. Use short-lived access tokens, rotating refresh tokens, and per-session records.
2. **Distributed rate limiting:** the memory store does not coordinate across instances. Use a shared store and add per-account throttling.
3. **Cookie/CORS strategy:** same-origin hosting is strongly recommended. Cross-site deployments require `SameSite=None; Secure`, HTTPS, and a precise allowlist. Do not reflect arbitrary origins.
4. **CSRF:** `SameSite=Strict` helps, but if the cookie policy is relaxed, add CSRF tokens or strict origin checks for state-changing requests.
5. **Transport:** serve over HTTPS when `NODE_ENV=production`; review proxy configuration because `trust proxy` is set to `1`.
6. **Password/recovery policy:** the password minimum is 6 characters. Consider a longer minimum, breached-password checks, and login notifications. Security questions are not a substitute for MFA.
7. **Logging:** avoid logging tokens, cookies, passwords, recovery answers, or full user documents; add redaction if structured logging is introduced.
8. **Secrets:** keep `.env` out of version control, use a 32+ character random `JWT_SECRET`, and rotate it if leaked (all sessions are invalidated).
9. **XSS:** React escapes text by default. Never render message content with `dangerouslySetInnerHTML`; sanitize any future rich-text/HTML rendering.
10. **Abuse:** there is no account lockout, spam detection, message reporting, or notification system.
11. **Dependencies and operations:** keep dependencies patched, back up MongoDB, and treat backups as sensitive because they contain password and security-answer hashes.

## Testing

The backend has two integration suites:

```bash
npm test
```

- `backend/tests/api.test.js` — 18 REST, auth, and recovery tests.
- `backend/tests/realtime.test.js` — 4 Socket.IO tests.

The current suite has **22 passing tests**.

How it works:

- Node's built-in `node --test` runner executes both files.
- `supertest` calls the Express app directly for REST tests.
- The realtime suite creates an `http.Server`, attaches Socket.IO, listens on an ephemeral port, and connects with `socket.io-client`.
- `mongodb-memory-server` provides an isolated MongoDB instance per test process.
- `NODE_ENV=test` disables rate limiting and avoids `Secure` cookies.
- Collections are cleared after each test, and open socket clients are closed.
- The first run may download a MongoDB binary, so it needs network access once.
- The tests do not read `.env` or the application database.

Coverage includes:

- registration, cookie flags, session lookup, logout;
- duplicate username/email handling;
- registration and login validation, generic credential errors;
- 2–3 distinct security questions, duplicate question IDs, empty and oversized answers;
- security-question lookup, decoy questions, normalized-answer recovery, generic failures;
- `tokenVersion` session invalidation after a password reset, including old cookies, live socket disconnection, and rejected socket handshakes;
- public user fields and pagination;
- health check, unknown routes, malformed JSON;
- message send, receiver/self/ID/length validation;
- conversation discovery, last message, deduplication across senders;
- message history enrichment, membership authorization, cursor pagination;
- conversation-list pagination;
- unauthenticated access to message endpoints;
- realtime message delivery, typing state, presence snapshots/updates, and unauthenticated socket rejection.

Frontend checks:

```bash
cd frontend
npm run build
npm run lint
```

`npm run lint` currently reports warnings (context fast-refresh exports and a `set-state-in-effect` warning) but no errors. Treat new warnings as review items rather than ignoring them.

Recommended next steps:

- **Frontend:** Vitest + React Testing Library for the auth form, recovery flow, and context error/loading behavior.
- **Contract tests:** assert the `reciverId` spelling and the `{ success, message }` envelope so accidental changes are caught.
- **Reconnect test:** verify that messages sent during a socket outage are recoverable.
- **Rate-limit tests:** run with `NODE_ENV` not set to `test` and assert `429` behavior.
- **CI:** run `npm test`, `npm run build`, `npm run lint`, and `npm audit` on every push.

## Suggested roadmap

1. Add reconnect backfill and optimistic send state.
2. Add read receipts, unread counts, and last-seen timestamps.
3. Add an authenticated password change and recovery-question rotation.
4. Add email verification/MFA as an optional recovery path for users who cannot use security questions.
5. Add message/account deletion, retention jobs, and optional group conversations.
6. Add the Socket.IO Redis adapter, shared rate limiting, and horizontal-scaling documentation.
7. Add structured logging, metrics, CI/CD, and frontend tests.
8. Introduce API versioning before making breaking changes.

When behavior changes, update the matching document in this folder. The API examples and schema tables are intended to be the source of truth for client work.

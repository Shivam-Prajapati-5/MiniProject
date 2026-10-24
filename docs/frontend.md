# Frontend

The frontend is a React 19 single-page app in `frontend/`, built with Vite and styled as a dark, responsive chat interface.

## Current status

| Piece | State |
| --- | --- |
| Vite + React setup | Working |
| Routing and route guards | Working (`/` protected, `/auth` public) |
| Auth state and session revalidation | Working |
| Login/register/recovery screen | Working |
| Security-question signup and recovery UI | Working |
| Chat layout: sidebar, thread, composer, profile | Working |
| Conversation discovery after refresh | Working |
| Message pagination with "Load earlier messages" | Working |
| Socket.IO messages, presence, typing indicators | Working |
| Production build | Working (`npm run build`) |
| Lint | Passing with warnings (`npm run lint`) |
| Automated frontend tests | Not configured |

## File map

| File | Responsibility |
| --- | --- |
| `src/main.jsx` | Mounts `BrowserRouter`, `AuthProvider`, `ToastProvider`, and `App` |
| `src/App.jsx` | Protected/public routes and a session-loading gate |
| `src/api.js` | Axios instance, API base URL, Socket.IO URL |
| `src/context/AuthContext.jsx` | Session state, login/register/reset/logout, `/auth/me` revalidation |
| `src/context/ChatContext.jsx` | Users, conversations, messages, pagination, Socket.IO events, presence, typing |
| `src/context/ToastContext.jsx` | Toast notifications |
| `src/pages/Auth.jsx` | Login, registration, security questions, password reset |
| `src/pages/Auth.css` | Auth screen styles, including the recovery form |
| `src/pages/Chat.jsx` | Chat layout and `ChatProvider` |
| `src/components/Sidebar.jsx` | Current user, search, contact list, logout |
| `src/components/ContactItem.jsx` | Contact row with online indicator |
| `src/components/ChatPanel.jsx` | Conversation header, message list, older-message control, typing indicator |
| `src/components/MessageBubble.jsx` | Message bubble with sender alignment and time |
| `src/components/MessageInput.jsx` | Composer with typing events and send state |
| `src/components/ProfilePanel.jsx` | Current user profile drawer |
| `src/components/EmptyState.jsx` | Empty chat placeholder |
| `src/index.css` | Global theme, CSS variables, keyframes |

## Routing

`App.jsx` defines:

- `/` — protected chat page.
- `/auth` — public auth page; signed-in users are redirected to `/`.
- `*` — redirects to `/`.

Both route guards wait for `AuthContext.initializing` before rendering. On startup the provider calls `GET /auth/me` if a cached user exists, so an expired cookie clears the stale session instead of showing the chat page.

## Auth context

`useAuth()` exposes:

```js
{
  authUser,       // public user object or null
  setAuthUser,
  initializing,   // true while the stored session is revalidated
  loading,        // true during login/register/reset requests
  login,          // (email, password) => Promise<user>
  register,       // (formData) => Promise<user>
  resetPassword,  // ({ email, newPassword, securityAnswers }) => Promise<user>
  logout,         // () => Promise<void>
}
```

Behavior:

- `authUser` is initialized from `localStorage.chatUser` through a guarded JSON parse.
- A stored user is revalidated with `GET /auth/me`; `401` removes both state and cache.
- `login`, `register`, and `resetPassword` use `try/finally` so `loading` always resets.
- Login/register return top-level user fields; `/auth/me` returns `{ user }`. The context normalizes both shapes.
- A successful reset also sets a fresh auth cookie and signs the user in.
- Logout clears local state even if the request fails; errors still bubble to the sidebar toast.

The cookie is the real credential; `localStorage.chatUser` is only a UI cache.

## API and Socket.IO URLs

`src/api.js`:

```js
const baseURL = import.meta.env.VITE_API_URL || '/api';
```

- Same-origin `/api` is the default, so the production build works when Express serves `frontend/dist`.
- `SOCKET_URL` defaults to the API origin (or the current origin for `/api`).
- Split deployments can set `VITE_API_URL` and `VITE_SOCKET_URL` at build time.
- `withCredentials: true` is required for the `jwt` cookie.

Vite proxies both paths in development:

```js
server: {
  proxy: {
    '/api': { target: 'http://localhost:3000' },
    '/socket.io': { target: 'http://localhost:3000', ws: true },
  },
}
```

Because the browser sees one origin in development, cookies and WebSocket upgrades work without CORS changes.

## Auth screen

`Auth.jsx` has three modes:

1. **Login** — email and password, with a "Forgot password?" link.
2. **Register** — full name, username, gender, email, password, and three security questions.
3. **Recovery** — email lookup followed by the user's questions and a new password.

### Security questions at signup

- The question catalog is fetched from `GET /auth/recovery/catalog`, with a built-in fallback list.
- Three question selects are pre-filled with different defaults; the user supplies one answer per question.
- The client rejects duplicate questions and empty answers before submitting.
- Answers are sent as `securityAnswers: [{ questionId, answer }]` and normalized/hashed by the backend.
- Answers are never returned by any API response.

### Password reset

1. The user enters their email; the client calls `POST /auth/recovery/questions`.
2. The backend returns the configured questions, or a decoy set for unknown accounts.
3. The user answers the questions and chooses a new password.
4. `POST /auth/recovery/reset` verifies the answers, hashes the new password, increments `tokenVersion`, disconnects old live sockets, and sets a fresh cookie.
5. The account is signed in and redirected to the chat.

Failures use the generic message `Unable to reset your password with the provided details`, so the UI does not reveal whether an email or an answer was wrong.

## Chat context and realtime behavior

On mount, `ChatContext` fetches:

- `GET /auth/users?limit=100` for the contact list.
- `GET /message/conversations?limit=100` to map each contact to an existing conversation.

That mapping restores access to history after a page refresh without storing conversation IDs in `localStorage`.

Selecting a contact:

1. Uses the mapped conversation ID if one exists.
2. Fetches the latest 50 messages.
3. Stores `pagination.nextCursor` and `pagination.hasMore` for older pages.

Socket.IO connects with the auth cookie and listens for:

| Event | Client behavior |
| --- | --- |
| `message:new` | Appends to the open conversation (deduplicated by `_id`), updates the contact-to-conversation map, and clears typing state |
| `presence:state` | Replaces the initial online-user set |
| `presence:update` | Adds/removes a user from the online set |
| `typing:update` | Shows a short-lived typing indicator for the open conversation |

Sending remains REST-first (`POST /message/send/:id`). The response is appended locally and the server also broadcasts `message:new`; deduplication prevents a double bubble.

Typing events are emitted from `MessageInput` (`typing:start` while typing, `typing:stop` after a short idle period). Server-side typing state expires automatically after 3.5 seconds without an update.

## UI notes

- The sidebar lists all users (up to the API limit) with search and an online dot.
- The chat header shows online/offline status.
- "Load earlier messages" prepends an older page without jumping the scroll position.
- Auto-scroll only runs when a new message is appended, not when older pages load.
- The profile drawer shows the current user's public fields.
- Toasts report send/logout failures.

## Build and lint

```bash
cd frontend
npm run dev       # development server with HMR
npm run build     # production build to dist/
npm run preview   # serve the build locally (not proxied)
npm run lint      # oxlint
```

The root `npm run build` installs frontend dependencies and builds `frontend/dist`. In production, Express serves that directory and the SPA fallback.

`npm run preview` serves on port `4173`; API calls will 404 there unless `VITE_API_URL` is set to `http://localhost:3000/api` and that origin is in `CLIENT_ORIGIN`. For a production-like check, use the Express-served build instead.

## Remaining frontend gaps

- No Vitest/React Testing Library suite.
- No unread counts, read receipts, message search, or group chats.
- Presence is online/offline only; last-seen timestamps are not stored.
- The contact list requests at most 100 users; larger directories need paging or virtualized search.
- No optimistic message status (sending/sent/failed); failed messages surface as a toast and can be retried manually.

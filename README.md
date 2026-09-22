# Chetá backend

Express + MongoDB (Mongoose) API: auth, posts, follow graph, likes,
comments, reposts, notifications, search, feed, media uploads (photos +
video), a video discovery feed, and real-time DMs (Socket.io).

## Setup

1. **Get a free MongoDB Atlas cluster** (if you don't have one already):
   https://www.mongodb.com/cloud/atlas/register — create a free M0 cluster,
   add a database user, and allow network access from your IP (or `0.0.0.0/0`
   while developing). Copy the connection string from the "Connect" button.

2. **Configure environment variables:**
   ```
   cd cheta-backend
   copy .env.example .env
   ```
   Then open `.env` and paste in your MongoDB connection string, and generate
   a random `JWT_SECRET` with:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Install and run:**
   ```
   npm install
   npm run dev
   ```
   You should see `MongoDB connected: ...` and `Chetá API listening on port 5000`.

4. **Test it's alive:** open http://localhost:5000 in a browser — you should
   see `{"status":"Chetá API is running"}`.

## Connecting the mobile app to this

The Expo app runs on your phone, which can't reach `localhost` on your
computer. Two options:
- **Same WiFi:** find your computer's local IP (`ipconfig` on Windows, look
  for IPv4 Address), then use `http://<that-ip>:5000/api` as the base URL in
  the app.
- **USB (the adb reverse setup you already have working):** run
  `adb reverse tcp:5000 tcp:5000` alongside the existing `tcp:8081` one, then
  the app can use `http://localhost:5000/api` directly.

## API reference

All routes are prefixed with `/api`. Routes marked 🔒 require an
`Authorization: Bearer <token>` header (the token you get back from
signup/login).

### Auth
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ displayName, username, identifier, password }` | `identifier` = phone or email |
| POST | `/auth/login` | `{ identifier, password }` | |
| GET | `/auth/me` 🔒 | — | current user's profile |

### Posts
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/posts` 🔒 | `{ text, mediaUrl?, mediaType? }` | `mediaType` is `'image'` or `'video'`; get `mediaUrl` from `/media/upload` first |
| GET | `/posts/:id` 🔒 | — | |
| DELETE | `/posts/:id` 🔒 | — | only the author can delete |
| POST | `/posts/:id/like` 🔒 | — | |
| DELETE | `/posts/:id/like` 🔒 | — | unlike |
| POST | `/posts/:id/repost` 🔒 | — | reposts the original (reposting a repost reposts the original, not the wrapper); notifies the original author |
| DELETE | `/posts/:id/repost` 🔒 | — | undo your repost |

### Media
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/media/upload` 🔒 | multipart/form-data, field `file` | accepts JPEG/PNG/GIF/WebP images or MP4/MOV/WebM video, 50MB max; returns `{ url, mediaType }` — pass both straight into `POST /posts`. Files are saved to disk under `cheta-backend/uploads/` and served back at `/uploads/<filename>` |

### Videos
| Method | Route | Notes |
|---|---|---|
| GET | `/videos?page=1&limit=10` 🔒 | video posts from **all** users (not just people you follow) — a discovery feed, for a TikTok-style full-screen swipe view |

### Feed
| Method | Route | Notes |
|---|---|---|
| GET | `/feed?page=1&limit=20` 🔒 | posts from people you follow + your own, newest first |

### Users
| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/users/:username` 🔒 | — | profile + whether you follow them |
| GET | `/users/:username/posts` 🔒 | — | that user's posts |
| POST | `/users/:username/follow` 🔒 | — | notifies the followed user |
| DELETE | `/users/:username/follow` 🔒 | — | unfollow |

### Comments
| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/posts/:id/comments` 🔒 | `{ text }` | notifies the post's author |
| GET | `/posts/:id/comments?page=1&limit=20` 🔒 | — | newest first |
| DELETE | `/comments/:id` 🔒 | — | only the comment's author can delete |

### Notifications
| Method | Route | Notes |
|---|---|---|
| GET | `/notifications?page=1&limit=20` 🔒 | newest first, includes `unreadCount` |
| PATCH | `/notifications/:id/read` 🔒 | mark one as read |
| PATCH | `/notifications/read-all` 🔒 | mark all as read |

Notifications are created automatically when someone likes your post,
comments on it, or follows you — you never call a "create notification"
endpoint directly. Liking/commenting on/following yourself never creates a
notification.

### Search
| Method | Route | Notes |
|---|---|---|
| GET | `/search?q=...` 🔒 | matches usernames/display names (up to 10) and post text (up to 10), case-insensitive |

### Conversations & messages (DMs)
| Method | Route | Body | Notes |
|---|---|---|---|
| GET | `/conversations` 🔒 | — | your conversations, most recently active first |
| POST | `/conversations` 🔒 | `{ username }` | gets your existing conversation with that user, or creates one |
| GET | `/conversations/:id/messages?page=1` 🔒 | — | oldest-first, 30 per page |
| POST | `/conversations/:id/messages` 🔒 | `{ text }` | saves the message and pushes it to the other participant in real time over the socket connection |

### Real-time (Socket.io)
Connect with: `io(SERVER_URL, { auth: { token: <jwt> } })` — same token as
the REST API. On connect, the server puts you in a room named after your
own user id. When someone sends you a message, you'll receive a
`new_message` event on that socket with the same shape as the message
objects above. There's nothing to emit from the client — sending is done
via the REST endpoint above, which handles both saving and delivering it.

## What's intentionally not here yet

Read receipts, typing indicators, and group DMs (more than 2 people) aren't
built — conversations are strictly 1:1, and there's no way to see whether
a message has been read.

Note: a repost is a thin wrapper post (empty text, `repostOf` pointing at
the original) — likes/comments on a repost target the original post, not
the repost itself. A "quote repost" (repost + your own added text) isn't
built yet, only a plain repost.

Note on media storage: uploaded files are saved to local disk
(`cheta-backend/uploads/`), not a cloud service like S3/Cloudinary. This is
fine for development and testing on your own devices, but won't survive a
redeploy to most hosting platforms (their filesystems are usually
ephemeral) — swapping in a cloud storage service is a good next step before
deploying this anywhere permanent.

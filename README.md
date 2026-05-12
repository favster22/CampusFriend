# Campusfriend — Social Media Platform for Students

A full-stack web application for campus connectivity, real-time messaging, communities, and academic collaboration.

---

## Project Structure

```
campusfriend/
├── backend/          ← Node.js + Express + Socket.IO + MongoDB
└── frontend/         ← React + Vite + Tailwind CSS
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Real-time**: Socket.IO
- **Auth**: JWT + bcryptjs
- **Security**: Helmet, CORS

### Frontend
- **Framework**: React 18
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP**: Axios
- **Real-time**: Socket.IO client
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)

---

### Backend Setup

```bash
cd backend
cp .env.example .env        # Edit values inside
npm install
npm run dev                 # Starts on http://localhost:5000
```

**Environment variables (`.env`)**:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/campusfriend
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev                 # Starts on http://localhost:5173
```

---

## API Reference

### Auth
| Method | Endpoint             | Access  | Description         |
|--------|----------------------|---------|---------------------|
| POST   | `/api/auth/register` | Public  | Register new student |
| POST   | `/api/auth/login`    | Public  | Login               |
| POST   | `/api/auth/logout`   | Private | Logout              |
| GET    | `/api/auth/me`       | Private | Get current user    |

### Users
| Method | Endpoint                      | Description          |
|--------|-------------------------------|----------------------|
| GET    | `/api/users/search?q=`        | Search students      |
| GET    | `/api/users/:username`        | Get profile          |
| PATCH  | `/api/users/profile`          | Update own profile   |
| PATCH  | `/api/users/change-password`  | Change password      |

### Messages
| Method | Endpoint                            | Description              |
|--------|-------------------------------------|--------------------------|
| GET    | `/api/messages/chats`               | Recent chat list         |
| GET    | `/api/messages/direct/:id`          | Direct message history   |
| POST   | `/api/messages/direct/:id`          | Send direct message      |
| GET    | `/api/messages/community/:id`       | Community messages       |
| POST   | `/api/messages/community/:id`       | Send community message   |
| PATCH  | `/api/messages/read/:id`            | Mark as read             |

### Communities
| Method | Endpoint                      | Description           |
|--------|-------------------------------|-----------------------|
| GET    | `/api/communities`            | Browse communities    |
| GET    | `/api/communities/my`         | My communities        |
| GET    | `/api/communities/:id`        | Single community      |
| POST   | `/api/communities`            | Create community      |
| POST   | `/api/communities/:id/join`   | Join                  |
| DELETE | `/api/communities/:id/leave`  | Leave                 |

### Feed
| Method | Endpoint               | Description          |
|--------|------------------------|----------------------|
| GET    | `/api/feed`            | Campus feed          |
| POST   | `/api/feed`            | Create post          |
| GET    | `/api/feed/events`     | Upcoming events      |
| PATCH  | `/api/feed/:id/like`   | Like / unlike        |
| POST   | `/api/feed/:id/comment`| Comment on post      |
| DELETE | `/api/feed/:id`        | Delete own post      |

---

## Socket.IO Events

### Client → Server
| Event                    | Payload                                      |
|--------------------------|----------------------------------------------|
| `room:join`              | `{ roomId }`                                 |
| `room:leave`             | `{ roomId }`                                 |
| `message:send-direct`    | `{ recipientId, content, messageType? }`     |
| `message:send-community` | `{ communityId, content, messageType? }`     |
| `typing:start`           | `{ conversationId, isGroup }`                |
| `typing:stop`            | `{ conversationId, isGroup }`                |
| `message:read`           | `{ messageIds, senderId }`                   |

### Server → Client
| Event                  | Payload                           |
|------------------------|-----------------------------------|
| `user:online`          | `{ userId }`                      |
| `user:offline`         | `{ userId, lastSeen }`            |
| `message:new-direct`   | Message object                    |
| `message:new-community`| `{ communityId, message }`        |
| `typing:update`        | `{ userId, conversationId, isTyping }` |
| `message:read-receipt` | `{ messageIds, readBy }`          |

---

## Features

- ✅ Secure student registration (email + optional student ID)
- ✅ JWT-based authentication with hashed passwords
- ✅ Real-time 1-on-1 and group chat via Socket.IO
- ✅ Typing indicators & read receipts
- ✅ Campus Communities (circles) with join/leave
- ✅ Interactive campus-wide feed with likes & comments
- ✅ Resource Hub for sharing study materials and links
- ✅ Student profiles with skills, social links, department
- ✅ Online presence tracking
- ✅ Community spotlight sidebar
- ✅ Fully responsive layout

---

© 2026 Campusfriend
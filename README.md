# ⚡ SportsConnect

> A full-stack sports sponsorship platform connecting athletes with sponsors — built with the MERN stack.

![SportsConnect Banner](https://img.shields.io/badge/MERN-Stack-c8f03d?style=for-the-badge)

![Status](https://img.shields.io/badge/Status-Active-success?style=for-the-badge)

---

## 🚀 About

SportsConnect is a LinkedIn + Instagram inspired platform built specifically for the sports world. Athletes can showcase their achievements, connect with sponsors, and manage sponsorship deals — all in one place. Sponsors can discover talented athletes, post opportunities, and communicate directly through real-time chat.

---

## ✨ Features

- 🔐 **Authentication** — JWT-based login/register with role-based access (Athlete / Sponsor)
- 💬 **Real-time Chat** — Direct messaging powered by Socket.IO with typing indicators and online presence
- 📰 **Social Feed** — Post achievements, opportunities, like, comment, share and apply
- 🔍 **Search & Discover** — Search athletes, sponsors, posts and trending hashtags
- 🔔 **Notifications** — Real-time notifications for likes, comments, follows and applications
- 👤 **Follow System** — Follow athletes and sponsors, build your network
- 🤝 **Sponsorship Management** — Send, accept and track sponsorship deals
- 📁 **File Uploads** — Share images and documents in posts and messages
- ✅ **Verified Badges** — Verification system for athletes and sponsors
- 📱 **Responsive Design** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Context API |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-time | Socket.IO |
| Auth | JWT, bcryptjs |
| File Uploads | Multer |
| Styling | Custom CSS with CSS Variables |

---

## 📁 Project Structure
```
sportsconnect/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # Reusable components
│       ├── context/         # Auth & Socket context
│       ├── pages/           # All pages
│       └── utils/           # API helper
│
└── server/                  # Express backend
    ├── config/              # Database connection
    ├── middleware/          # Auth, role check, upload
    ├── models/              # MongoDB schemas
    ├── routes/              # API routes
    └── socket/              # Socket.IO handlers
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

### Installation
```bash
# Clone the repo
git clone https://github.com/Navya2065/sportsConnectWebsite.git
cd sportsConnectWebsite
```
```bash
# Install server dependencies
cd server
npm install
```
```bash
# Install client dependencies
cd ../client
npm install
```

### Environment Setup

Create a `.env` file inside the `server/` folder:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/sportsconnect
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000
```

### Run the App
```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm start
```

Visit **http://localhost:3000** 🚀

---

## 📡 API Reference

| Method | Route | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| GET | /api/users | Browse users |
| GET | /api/search | Global search |
| GET | /api/posts | Get feed posts |
| POST | /api/posts | Create post |
| PUT | /api/posts/:id/like | Like a post |
| POST | /api/posts/:id/comment | Comment on post |
| PUT | /api/posts/:id/apply | Apply to opportunity |
| GET | /api/conversations | Get conversations |
| GET | /api/messages/:id | Get messages |
| GET | /api/notifications | Get notifications |
| PUT | /api/follow/:id | Follow/unfollow user |
| GET | /api/sponsorships | Get sponsorships |
| POST | /api/sponsorships | Create sponsorship |

---

## 🔌 Socket Events

| Event | Description |
|---|---|
| `conversation:join` | Join a chat room |
| `message:send` | Send a message |
| `message:receive` | Receive a message |
| `typing:start` | User started typing |
| `typing:stop` | User stopped typing |
| `users:online` | Online users list |

---

> Built with ❤️ for the sports community



⚡ SportsConnect

A full-stack sports sponsorship platform that connects athletes with sponsors using the MERN stack.

🚀 About

SportsConnect is a web platform designed to help athletes showcase their achievements and connect with potential sponsors. It also allows sponsors to discover talent, post opportunities, and communicate directly.

The platform combines features of social media and professional networking, tailored specifically for the sports ecosystem.

✨ Features
🔐 Authentication & Authorization
JWT-based login/register
Role-based access (Athlete / Sponsor)
💬 Real-time Chat
One-to-one messaging using Socket.IO
Typing indicators and online status
📰 Social Feed
Create posts (achievements/opportunities)
Like and comment on posts
Apply to sponsorship opportunities
🔍 Search
Search users and posts
🔔 Notifications
Real-time alerts for likes, comments, follows, and applications
👤 Follow System
Follow/unfollow users
🤝 Sponsorship Management
Send, accept, and track sponsorship requests
📁 File Uploads
Upload images/documents using Multer
📱 Responsive Design
Works across desktop and mobile
🛠️ Tech Stack
Layer	Technology
Frontend	React, React Router
Backend	Node.js, Express.js
Database	MongoDB, Mongoose
Real-time	Socket.IO
Authentication	JWT, bcrypt
File Uploads	Multer
Styling	CSS
📁 Project Structure
sportsconnect/
├── client/
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── utils/
│
└── server/
    ├── config/
    ├── middleware/
    ├── models/
    ├── routes/
    └── socket/
⚙️ Getting Started
Prerequisites
Node.js (v18+)
MongoDB
Installation
git clone https://github.com/Navya2065/sportsConnectWebsite.git
cd sportsConnectWebsite
cd server
npm install
cd ../client
npm install
Environment Variables

Create a .env file in the server folder:

PORT=5000
MONGO_URI=mongodb://localhost:27017/sportsconnect
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:3000
Run the App
# backend
cd server
npm run dev
# frontend
cd client
npm start

Open: http://localhost:3000

📡 API (Main Routes)
Method	Route	Description
POST	/api/auth/register	Register user
POST	/api/auth/login	Login
GET	/api/users	Get users
GET	/api/posts	Get posts
POST	/api/posts	Create post
PUT	/api/posts/:id/like	Like post
POST	/api/posts/:id/comment	Comment
GET	/api/conversations	Get chats
GET	/api/messages/:id	Messages
GET	/api/notifications	Notifications
PUT	/api/follow/:id	Follow
GET	/api/sponsorships	Sponsorships
🔌 Socket Events
conversation:join
message:send
message:receive
typing:start
typing:stop
users:online
> Built with ❤️ for the sports community

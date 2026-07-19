# PRAJA FOUNDATION QUIZ PLATFORM

Welcome to the **Praja Foundation Quiz Platform**. This is a functional, real-time, self-paced interactive MERN stack web application built specifically for hosting multi-team quiz events and tracking scores in real-time.

---

## 🚀 Features

### **Participant (Public) Experience**
- **Dynamic Lobbies:** Join queues securely using unique quiz Join Codes.
- **Self-Paced Play:** Participants navigate at their own pace with per-team question tracking.
- **Real-Time Timer & Feedback:** Live visual countdown limits with instantaneous correctness feedback after submission.
- **Review System:** Dedicated screens for teams to review correct answers post-quiz.
- **Public Leaderboard:** Live ranking system for spectators and participants without admin access.
- **Mobile Optimized:** Full-featured responsive design so participants can play on their smartphones.

### **Admin Management**
- **Full Scope Management:** Dashboard to manage distinct Competitions, Rounds, and individual Quizzes.
- **Question Banks:** Formulate comprehensive question sets with multi-media support (Image/Audio/Video).
- **Bulk Upload Support:** Load questions directly via structured CSV files.
- **Live Leaderboard Control:** Visually observe active participants, monitor scores, verify submitted answers in real time via WebSockets.
- **Quiz Tracking:** Force end quizzes, download result analytics as CSVs, and oversee tab-switch alerts.
- **Mobile-Responsive Panel:** Full admin controls accessible via mobile devices via a responsive sidebar hamburger drawer.

---

## 🛠️ Technology Stack
- **Frontend:** React, Vite, Tailwind CSS, Socket.io-client
- **Backend:** Node.js, Express, Socket.io (WebSocket Engine)
- **Database:** MongoDB Atlas (Production) / Local MongoDB (Development)
- **Authentication:** JWT (JSON Web Tokens)
- **Media Uploads:** Cloudinary (for persistent image/audio/video uploads)
- **Mail Delivery:** Nodemailer with Gmail SMTP (configured for secure IPv6/IPv4 transport)

---

## 🏃 Deployment & Environment Configuration

### Production Environment Variables (Railway / Cloud Deployment)

Configure the following environment variables on your cloud hosting platform (e.g., Railway):

| Variable | Description | Example / Recommended Value |
|---|---|---|
| `PORT` | The port the backend server runs on | `8080` |
| `NODE_ENV` | Run mode | `production` |
| `MONGO_URI` | Connection URI for MongoDB | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for generating auth tokens | `your_secure_jwt_secret` |
| `CLIENT_URL` | Frontend client origin (if separate) | `https://your-app.up.railway.app` |
| `SMTP_HOST` | SMTP server address for email delivery | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | Verified email address used to send mails | `your_gmail_address@gmail.com` |
| `SMTP_PASS` | App password generated from your Google Account | `xxxx xxxx xxxx xxxx` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary Cloud Name | `your_cloud_name` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `your_api_key` |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret | `your_api_secret` |

---

## 💻 Local Development Setup

### 1. Installation

You can automatically configure both your client and server by running the included batch script:

```bash
# Run in terminal from the root folder:
.\setup.bat
```

Alternatively, you can manually install the dependencies:
```bash
# Server Setup
cd server
npm install

# Client Setup
cd ../client
npm install
```

### 2. Seeding the Default Admin Account
To create a default administrator account, run the seed script with the required variables:
```bash
cd server
ADMIN_EMAIL=admin@praja.com ADMIN_PASSWORD=YourSecurePassword123 node seed.js
```

### 3. Starting the Platform
You will need two terminal windows actively running to boot both the server and client.

**Terminal 1 (Backend Server):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
```

Visit the application locally at `http://localhost:5173`.

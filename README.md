# PRAJA FOUNDATION QUIZ PLATFORM

Welcome to the **Praja Foundation Quiz Platform**. This is a functional, real-time, self-paced interactive MERN stack web application built specifically for hosting multi-team quiz events and tracking scores in real-time.

## 🚀 Features

### **Participant (Public) Experience**
- **Dynamic Lobbies:** Join queues securely using unique quiz Join Codes.
- **Self-Paced Play:** Participants navigate at their own pace with per-team question tracking.
- **Real-Time Timer & Feedback:** Live visual countdown limits with instantaneous correctness feedback after submission.
- **Review System:** Dedicated screens for teams to review correct answers post-quiz.
- **Public Leaderboard:** Live ranking system for spectators and participants without admin access.

### **Admin Management**
- **Full Scope Management:** Dashboard to manage distinct Competitions, Rounds, and individual Quizzes.
- **Question Banks:** Formulate comprehensive question sets with multi-media support (Image/Audio/Video).
- **Bulk Upload Support:** Load questions directly via structured Excel/CSV files.
- **Live Leaderboard Control:** Visually observe active participants, monitor scores, verify submitted answers in real time via WebSockets.
- **Quiz Tracking:** Force end quizzes, download result analytics as CSVs, and oversee tab-switch alerts.

## 🛠️ Technology Stack
- **Frontend:** React, Vite, Tailwind CSS, Socket.io-client
- **Backend:** Node.js, Express, Socket.io (WebSocket Engine)
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens)

---

## 🏃 Walkthrough & Setup

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16.0 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally on default port `27017` (or updated Atlas URI mapped in your `.env` file).

### 1. Installation

You can automatically configure both your client and server by running the included batch script:

```bash
# Double-click the setup.bat file in the root folder, OR run in terminal:
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

### 2. Environment Variables (`.env`)
In your `server` directory, ensure you have a `.env` file referencing your MongoDB and Secret Keys. Example:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/praja_quiz
JWT_SECRET=supersecretjwtkey
CLIENT_URL=http://localhost:5173
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

### 4. Usage Overview
1. Visit the app at `http://localhost:5173`.
2. First-time admins navigate to `/login` to authenticate and gain access to the dashboard.
3. Over the **Admin Dashboard**, structure a new **Competition** ➔ **Round** ➔ **Quiz**.
4. Inside **Quiz Creation**, distribute the generated **Join Code** to participants.
5. Participants visit the landing page, enter the join code, register a team, and sit in the lobby.
6. Admin tracks joined participants and clicks "Start Quiz" directly from the dashboard/lobby manager.

## 🗂️ Task Tracker
A granular compilation of identified features, fixed bugs, and final polish requirements for deployment can be actively reviewed inside the included [`TASK_TRACKER.md`](./TASK_TRACKER.md) file.

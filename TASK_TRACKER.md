# Praja Quiz Platform — Task Tracker

> Last updated: 2026-04-20 (Evening)

---

## ✅ Backend — DONE
- [x] Server scaffolding (package.json, .env, db.js, index.js)
- [x] All 8 Mongoose models (User, Competition, Round, Quiz, Question, Answer, Team, Settings)
- [x] Auth & Middleware (JWT auth, admin guard)
- [x] All 9 CRUD route files (auth, competition, round, quiz, question, team, csv, upload, settings)
- [x] All 3 utility files (csvGenerator, generateJoinCode, shuffle)
- [x] Socket.io Engine — self-paced model with per-team question tracking

## ✅ Client — DONE
- [x] Scaffolding, Contexts (AuthContext, SocketContext), Layouts (Admin, Public), API utils
- [x] All 9 Public Pages (Landing, Join, Register, Lobby, Play, Results, Review, PublicLeaderboard, Login)
- [x] All 8 Admin Pages (Dashboard, Competitions, Rounds, QuizMgmt, QuizCreation, LiveLeaderboard, Analytics, Settings)

## ✅ Bugs Fixed (Previous Sessions)
- [x] QuizPlay.jsx — timer auto-advances to next question on expiry
- [x] QuizPlay.jsx — shows correct answer text after moving to next question
- [x] LiveLeaderboard.jsx — re-renders on leaderboardUpdate socket events
- [x] QuizLobby.jsx — navigates correctly to /play/:quizId/:teamId on quizStarted

## ✅ Features Added (Previous Sessions)
- [x] QuizReview.jsx — per-question answer breakdown post-quiz
- [x] PublicLeaderboard.jsx — spectator leaderboard (no admin login)
- [x] teamRoutes.js — populates answers with full question details
- [x] App.jsx — added /review and /leaderboard routes
- [x] QuizResults.jsx — added "Review Answers" button
- [x] quizSocket.js — added correctAnswerText in previousAnswer payload

---

## 🐛 Known Bugs — TO FIX
- [ ] **Response time calculation is inaccurate** — `quizSocket.js:110` uses `quiz.questionStartTime` (global quiz start) instead of a per-question start timestamp. Since the quiz is self-paced, each team starts each question at a different time. Needs a per-team `questionStartedAt` field.
- [ ] **Publish button is a no-op** — `QuizCreation.jsx` `handleSave(publish)` accepts a `publish` flag but never uses it to set quiz status to `lobby`. Both "Save Draft" and "Publish Quiz" do the same thing.

## 🚀 Remaining Features — TO DO
- [ ] **Quiz status workflow** — Admin should be able to move a quiz through `draft → lobby → live → ended` from QuizManagement page (currently only socket `startQuiz` sets `live`)
- [ ] **Team disqualification / kick** — Admin ability to remove or deactivate a team mid-quiz from LiveLeaderboard
- [ ] **Negative marking (optional)** — Settings for per-quiz negative marking on wrong answers (currently only +10 for correct, 0 for wrong)
- [ ] **Question re-ordering** — Drag-and-drop or up/down arrows in QuizCreation to reorder questions
- [ ] **CSV Results Export** — Wire up the CSV download button on Analytics/LiveLeaderboard to actually call `/api/csv` routes

## 🔧 Polish & Hardening — TO DO
- [ ] **Input validation (server)** — Add express-validator or Joi schemas to all route handlers (currently trusts client input)
- [ ] **Input validation (client)** — Add form validation on TeamRegistration (team name length, duplicate checks, empty fields)
- [ ] **Error boundaries** — Wrap app in a React Error Boundary to catch render crashes gracefully
- [ ] **Loading skeletons** — Replace bare "Loading..." text with skeleton placeholders on Dashboard, Analytics, QuizManagement
- [ ] **Rate limiting** — Add express-rate-limit to auth and answer-submission endpoints to prevent abuse
- [ ] **Socket reconnection handling** — Handle socket disconnects/reconnects mid-quiz gracefully on the client (show toast, auto-rejoin room)

## 🌐 Deployment — TO DO
- [ ] **Environment config** — Finalize `.env` for production (MongoDB Atlas URI, CLIENT_URL, JWT_SECRET)
- [ ] **Vite production build** — Test `npm run build` and serve static from Express or a CDN
- [ ] **CORS lockdown** — Restrict CORS origin to production domain only
- [ ] **Hosting** — Deploy server (Render / Railway / VPS) and client (Vercel / Netlify / same server)
- [ ] **MongoDB indexes** — Run `fix-indexes.js` on production DB for performance

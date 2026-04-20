import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import JoinQuiz from './pages/public/JoinQuiz';
import TeamRegistration from './pages/public/TeamRegistration';
import QuizLobby from './pages/public/QuizLobby';
import QuizPlay from './pages/public/QuizPlay';
import QuizResults from './pages/public/QuizResults';
import LoginPage from './pages/public/LoginPage';
import QuizReview from './pages/public/QuizReview';
import PublicLeaderboard from './pages/public/PublicLeaderboard';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Competitions from './pages/admin/Competitions';
import Rounds from './pages/admin/Rounds';
import QuizManagement from './pages/admin/QuizManagement';
import QuizCreation from './pages/admin/QuizCreation';
import LiveLeaderboard from './pages/admin/LiveLeaderboard';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen bg-surface"><div className="text-primary text-xl font-bold">Loading...</div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinQuiz />} />
        <Route path="/register/:joinCode" element={<TeamRegistration />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Quiz Flow - No Layout (focused experience) */}
      <Route path="/lobby/:quizId/:teamId" element={<QuizLobby />} />
      <Route path="/play/:quizId/:teamId" element={<QuizPlay />} />
      <Route path="/results/:quizId/:teamId" element={<QuizResults />} />
      <Route path="/results/:quizId/:teamId/review" element={<QuizReview />} />
      <Route path="/leaderboard/:quizId" element={<PublicLeaderboard />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/competitions" element={<Competitions />} />
        <Route path="/admin/rounds/:competitionId" element={<Rounds />} />
        <Route path="/admin/quizzes/:roundId" element={<QuizManagement />} />
        <Route path="/admin/quiz/new/:roundId" element={<QuizCreation />} />
        <Route path="/admin/quiz/edit/:quizId" element={<QuizCreation />} />
        <Route path="/admin/quiz/:quizId/live" element={<LiveLeaderboard />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./features/auth/ProtectedRoute";
import Login from "./features/auth/pages/Login";
import Welcome from "./features/auth/pages/Welcome";
import ForgotPassword from "./features/auth/pages/ForgotPassword";
import ResetPassword from "./features/auth/pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Course from "./pages/Course";
import Calendar from "./pages/Calendar";
import History from "./pages/History";
import Settings from "./features/account/pages/Settings";
import Sharing from "./pages/Sharing";
import Trash from "./pages/Trash";
import Onboarding from "./pages/Onboarding";
import SharedDashboard from "./pages/SharedDashboard";
import TeacherView from "./pages/TeacherView";
import AccessCode from "./pages/AccessCode";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      {/* Owner auth */}
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Public, token-gated — no login, no ProtectedRoute */}
      <Route path="/shared/:token" element={<SharedDashboard />} />
      <Route path="/teacher/:token" element={<TeacherView />} />
      <Route path="/access" element={<AccessCode />} />

      {/* Owner-only app */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/course" element={<Course />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/sharing" element={<Sharing />} />
        <Route path="/settings/trash" element={<Trash />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Welcome from "./pages/Welcome";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Course from "./pages/Course";
import Calendar from "./pages/Calendar";
import History from "./pages/History";
import Settings from "./pages/Settings";
import Sharing from "./pages/Sharing";
import Trash from "./pages/Trash";
import Onboarding from "./pages/Onboarding";
import SharedDashboard from "./pages/SharedDashboard";
import TeacherView from "./pages/TeacherView";
import AccessCode from "./pages/AccessCode";

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
    </Routes>
  );
}

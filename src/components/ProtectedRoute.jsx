import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // could be a small spinner; avoid a flash of the login form
  if (!session)
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  return children;
}

import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  // Destructure 'user' first
  const { user } = useAuth();

  // Now you can safely log it
  console.log("ProtectedRoute User:", user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

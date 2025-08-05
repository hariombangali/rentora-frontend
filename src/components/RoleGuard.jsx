// components/RoleGuard.jsx
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function RoleGuard({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

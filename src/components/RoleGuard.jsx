import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function RoleGuard({ children, allowedRoles }) {
  const { user, loading } = useAuth(); // 'loading' state ko yahaan access karo

  // 1. Jab tak AuthContext user ko load kar raha hai, loading screen dikhao
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl font-semibold">Authorizing...</p>
      </div>
    );
  }

  // 2. Loading complete hone ke baad, check karo ki user logged in hai aur uske paas required role hai
  if (!user || !allowedRoles.includes(user.role)) {
    // Agar user logged in nahi hai ya role match nahi karta, toh usey home page par bhej do
    return <Navigate to="/" replace />;
  }

  // 3. Sab theek hai toh child component render karo
  return children;
}

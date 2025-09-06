import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetails from "./pages/PropertyDetails";
import Login from "./pages/Login";
import About from "./pages/About";
import PostProperty from "./pages/PostProperty";
import MyProperties from "./pages/MyProperties";
import RoleGuard from "./components/RoleGuard";
import ProtectedRoute from "./components/ProtectedRoute";
// Admin Pages
import AdminLayout from "./pages/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import PendingApproval from "./pages/Admin/PendingApproval";
import AllProperties from "./pages/Admin/AllProperties";
import Users from "./pages/Admin/Users";
import OwnerVerification from "./pages/Admin/OwnerVerification";
import ProfilePage from "./pages/Profile";
import Inbox from "./pages/Inbox";

function App() {
  const { user } = useAuth();

  // ADMIN AREA: completely isolated, sidebar-based, no Navbar/Footer
  if (user && user.role === "admin") {
    return (
      <BrowserRouter>
        <Routes>
          <Route
            path="/admin/*"
            element={
              <AdminLayout />
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="pending-approvals" element={<PendingApproval />} />
            <Route path="all-properties" element={<AllProperties />} />
            <Route path="users" element={<Users />} />
            <Route path="OwnerVerification" element={<OwnerVerification />} />
            {/* You can add more admin-only nested pages here */}
            {/* Non-matched /admin/* will fallback to dashboard */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Route>
          {/* Any / (non-admin) route: always redirect to /admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // PUBLIC / USER / OWNER AREA: show full site layout
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<Login />} />
             <Route path="/inbox" element={<Inbox />} />
            <Route
              path="/postProperty"
              element={
                <ProtectedRoute>
                  <PostProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-properties"
              element={
                <RoleGuard allowedRoles={["owner"]}>
                  <MyProperties />
                </RoleGuard>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
import { Toaster } from "sonner";
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
import Analytics from "./pages/Admin/Analytics";
import ProfilePage from "./pages/Profile";
import Inbox from "./pages/Inbox";
import MyBookings from "./pages/MyBookings";
import OwnerBookings from "./pages/OwnerBookings";
import OwnerApplications from "./pages/OwnerApplications";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerIssues from "./pages/OwnerIssues";
import Wishlist from "./pages/Wishlist";

function App() {
  const { user } = useAuth();

  // ADMIN AREA: completely isolated, sidebar-based, no Navbar/Footer
  if (user && user.role === "admin") {
    return (
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <ScrollToTop />
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
            <Route path="analytics" element={<Analytics />} />
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
      <Toaster richColors position="top-right" />
      <PublicLayout />
    </BrowserRouter>
  );
}

function PublicLayout() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthRoute = location.pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col">
      <ScrollToTop />
      {!isAuthRoute && <Navbar />}
      <main className="flex-grow">
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/properties" element={<Properties />} />
            <Route path="/properties/:id" element={<PropertyDetails />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route
              path="/inbox"
              element={
                <ProtectedRoute>
                  <Inbox />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                user?.role === "owner" ? (
                  <Navigate to="/owner" replace />
                ) : (
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                )
              }
            />
            <Route
              path="/owner"
              element={
                <RoleGuard allowedRoles={["owner"]}>
                  <OwnerDashboard />
                </RoleGuard>
              }
            />
            <Route
              path="/owner/applications"
              element={
                <RoleGuard allowedRoles={["owner"]}>
                  <OwnerApplications />
                </RoleGuard>
              }
            />
            <Route
              path="/owner/bookings"
              element={
                <RoleGuard allowedRoles={["owner"]}>
                  <OwnerBookings />
                </RoleGuard>
              }
            />
            <Route
              path="/owner/issues"
              element={
                <RoleGuard allowedRoles={["owner"]}>
                  <OwnerIssues />
                </RoleGuard>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            {/* <Route path="/wishlist" element={<TopArea />} /> */}



            <Route
              path="/postProperty"
              element={
                <ProtectedRoute>
                  <PostProperty />
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit-property/:id"
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
      {!isAuthRoute && <Footer />}
    </div>
  );
}

export default App;

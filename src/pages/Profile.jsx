import { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FaUser, FaLock, FaHome, FaBookmark, FaWallet, FaBell, FaCheckCircle, FaSignOutAlt } from 'react-icons/fa';
import MyBookings from "./MyBookings";
import Inbox from "./Inbox";
import MyProperties from "./MyProperties"; // new wrapper
import OwnerBookings from "./OwnerBookings";
import Wishlist from "./Wishlist";



export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    ownerIdType: "",
    ownerIdNumber: "",
    // Password tab
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Define sidebar tabs dynamically according to user role
  const SIDEBAR_TABS = [
    { key: "profile", label: "Profile", icon: <FaUser /> },
    user?.role === "owner" && { key: "myProperties", label: "My Properties", icon: <FaHome /> },
    { key: "myBookings", label: "My Bookings", icon: <FaBookmark /> },
    { key: "savedproperties", label: "Saved properties", icon: <FaBookmark /> },
    { key: "inbox", label: "Inbox", icon: <FaBell /> },
    { key: "notifications", label: "Notifications", icon: <FaBell /> },
    { key: "password", label: "Change Password", icon: <FaLock /> },
    user?.role === "owner" && { key: "verification", label: "Owner Verification", icon: <FaCheckCircle /> },
    { key: "logout", label: "Logout", icon: <FaSignOutAlt /> },
  ].filter(Boolean);


  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        name: user.name || "",
        email: user.email || "",
        contact: user.contact || "",
        ownerName: user.ownerKYC?.ownerName || "",
        ownerEmail: user.ownerKYC?.ownerEmail || "",
        ownerPhone: user.ownerKYC?.ownerPhone || "",
        ownerIdType: user.ownerKYC?.ownerIdType || "",
        ownerIdNumber: user.ownerKYC?.ownerIdNumber || "",
      }));
    }
    setLoading(false);
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validatePassword = () => {
    if (form.newPassword !== form.confirmPassword) {
      setError("New password and Confirm password do not match.");
      return false;
    }
    if (form.newPassword.length > 0 && form.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return false;
    }
    return true;
  };

  // Update profile info
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await API.put(
        "/user/profile",
        {
          name: form.name,
          contact: form.contact,
          ownerName: form.ownerName,
          ownerEmail: form.ownerEmail,
          ownerPhone: form.ownerPhone,
          ownerIdType: form.ownerIdType,
          ownerIdNumber: form.ownerIdNumber,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMsg("Profile updated successfully!");
      if (res.data.user) setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    if (!validatePassword()) return;

    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/user/change-password",
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMsg("Password changed successfully!");
      setForm((prev) => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  // Sidebar click handler including logout
  const handleSidebarClick = (key) => {
    if (key === "logout") {
      setUser(null);
      localStorage.removeItem("token");
      window.location.href = "/login"; // redirect to login
      return;
    }
    setActiveTab(key);
    setError("");
    setSuccessMsg("");
  };

  if (loading) return <div className="p-6 text-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 px-6">
        {/* Sidebar */}
        <nav className="w-full md:w-64 bg-white rounded-lg shadow sticky top-10 p-6 h-fit">
          <ul>
            {SIDEBAR_TABS.map(({ key, label, icon }) => (
              <li key={key} className="mb-2">
                <button
                  onClick={() => handleSidebarClick(key)}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition font-semibold text-left ${activeTab === key ? "bg-blue-600 text-white shadow-lg" : "text-gray-700 hover:bg-blue-100"
                    }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 bg-white rounded-lg shadow p-6 max-w-4xl">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded font-semibold">{error}</div>}
          {successMsg && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded font-semibold">{successMsg}</div>}

          {activeTab === "profile" && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-blue-800">Profile Information</h2>

              <div>
                <label htmlFor="name" className="block font-semibold mb-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block font-semibold mb-1">
                  Email (cannot change)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  disabled
                  className="w-full p-3 border border-gray-200 rounded bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="contact" className="block font-semibold mb-1">
                  Contact Number
                </label>
                <input
                  id="contact"
                  name="contact"
                  type="tel"
                  value={form.contact}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded"
                />
              </div>

              {user?.role === "owner" && (
                <>
                  <h3 className="text-xl font-bold mt-4 mb-4 text-blue-700">Owner Verification Details</h3>
                  <div>
                    <label htmlFor="ownerName" className="block font-semibold mb-1">
                      Owner Name
                    </label>
                    <input
                      id="ownerName"
                      name="ownerName"
                      type="text"
                      value={form.ownerName}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerEmail" className="block font-semibold mb-1">
                      Owner Email
                    </label>
                    <input
                      id="ownerEmail"
                      name="ownerEmail"
                      type="email"
                      value={form.ownerEmail}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="ownerPhone" className="block font-semibold mb-1">
                      Owner Phone
                    </label>
                    <input
                      id="ownerPhone"
                      name="ownerPhone"
                      type="tel"
                      value={form.ownerPhone}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="ownerIdType" className="block font-semibold mb-1">
                        Owner ID Type
                      </label>
                      <input
                        id="ownerIdType"
                        name="ownerIdType"
                        type="text"
                        value={form.ownerIdType}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="ownerIdNumber" className="block font-semibold mb-1">
                        Owner ID Number
                      </label>
                      <input
                        id="ownerIdNumber"
                        name="ownerIdNumber"
                        type="text"
                        value={form.ownerIdNumber}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold w-full transition"
              >
                Update Profile
              </button>
            </form>
          )}

          {activeTab === "password" && (
            <ChangePasswordForm form={form} setForm={setForm} setError={setError} setSuccessMsg={setSuccessMsg} />
          )}

          {activeTab === "verification" && user?.role === "owner" && (
            <VerificationStatus user={user} />
          )}

          {activeTab === "myProperties" && user?.role === "owner" && (
            <MyProperties />
          )}

          {activeTab === "myBookings" && (user?.role === "owner" ? <OwnerBookings /> : <MyBookings />)}

          {activeTab === "savedproperties" && (
            <Wishlist />
          )}

          {activeTab === "inbox" && (
            <Inbox />
          )}

          {activeTab === "payments" && (
            <Payments />
          )}

          {activeTab === "notifications" && (
            <Notifications />
          )}
        </main>



      </div>
    </div>
  );
}

// Change Password form component
function ChangePasswordForm({ form, setForm, setError, setSuccessMsg }) {
  const [processing, setProcessing] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirmation do not match");
      return;
    }
    if (form.newPassword.length > 0 && form.newPassword.length < 6) {
      setError("New password should be at least 6 characters");
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      await API.put(
        "/user/change-password",
        {
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMsg("Password changed successfully");
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-800">Change Password</h2>

      <div>
        <label htmlFor="currentPassword" className="block font-semibold mb-1">Current Password</label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          value={form.currentPassword || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded"
          required
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block font-semibold mb-1">New Password</label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={form.newPassword || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded"
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block font-semibold mb-1">Confirm New Password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={form.confirmPassword || ""}
          onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          className="w-full p-3 border border-gray-300 rounded"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold w-full transition"
        disabled={processing}
      >
        {processing ? "Processing..." : "Update Password"}
      </button>
    </form>
  );
}

// VerificationStatus tab component - shows verification info only
function VerificationStatus({ user }) {
  if (!user || user.role !== "owner") return null;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Owner Verification Status</h2>

      <div className="mb-4 p-4 rounded bg-yellow-100 text-yellow-800 font-semibold shadow">
        Your owner verification status is:{" "}
        <span className={`font-black ${user.ownerVerified ? "text-green-600" : (user.ownerRejected ? "text-red-600" : "text-yellow-600")
          }`}>
          {user.ownerVerified
            ? "Verified"
            : user.ownerRejected
              ? "Rejected"
              : "Pending"}
        </span>
      </div>

      {user.ownerRejected && user.ownerRejectionReason && (
        <div className="p-3 bg-red-200 text-red-900 rounded mb-4 border border-red-400">
          <strong>Reason for rejection:</strong> {user.ownerRejectionReason}
        </div>
      )}

      <p className="text-sm text-gray-600">
        You can update your owner verification details in the "Profile Information" tab.
      </p>
    </div>
  );
}

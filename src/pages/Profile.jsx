import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaHome,
  FaBookmark,
  FaBell,
  FaCheckCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import MyBookings from "./MyBookings";
import Inbox from "./Inbox";
import MyProperties from "./MyProperties";
import OwnerBookings from "./OwnerBookings";
import Wishlist from "./Wishlist";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
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
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tabs derived from role
  const SIDEBAR_TABS = useMemo(
    () =>
      [
        { key: "profile", label: "Profile", icon: <FaUser /> },
        user?.role === "owner" && {
          key: "myProperties",
          label: "My Properties",
          icon: <FaHome />,
        },
        {
          key: "myBookings",
          label: user?.role === "owner" ? "Owner Bookings" : "My Bookings",
          icon: <FaBookmark />,
        },
        { key: "savedproperties", label: "Saved properties", icon: <FaBookmark /> },
        { key: "inbox", label: "Inbox", icon: <FaBell /> },
        { key: "notifications", label: "Notifications", icon: <FaBell /> },
        { key: "password", label: "Change Password", icon: <FaLock /> },
        user?.role === "owner" && {
          key: "verification",
          label: "Owner Verification",
          icon: <FaCheckCircle />,
        },
        { key: "logout", label: "Logout", icon: <FaSignOutAlt /> },
      ].filter(Boolean),
    [user]
  );

  const tabKeys = useMemo(() => SIDEBAR_TABS.map((t) => t.key), [SIDEBAR_TABS]);

  // Initialize from URL ?tab=
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && tabKeys.includes(t)) setActiveTab(t);
    setLoading(false);
  }, [searchParams, tabKeys]);

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
    setUpdatingProfile(true);
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
    } finally {
      setUpdatingProfile(false);
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
      setForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    }
  };

  // Tab change utility (sync URL)
  const setTab = useCallback(
    (key) => {
      if (key === "logout") {
        setUser(null);
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      setActiveTab(key);
      setError("");
      setSuccessMsg("");
      setSearchParams({ tab: key });
    },
    [setSearchParams, setUser]
  );

  // Keyboard navigation for tablist
  const tablistRef = useRef(null);
  const onTablistKeyDown = (e) => {
    if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const currentIndex = tabKeys.indexOf(activeTab);
    if (e.key === "ArrowRight") {
      const next = (currentIndex + 1) % tabKeys.length;
      setTab(tabKeys[next]);
    } else if (e.key === "ArrowLeft") {
      const prev = (currentIndex - 1 + tabKeys.length) % tabKeys.length;
      setTab(tabKeys[prev]);
    } else if (e.key === "Home") {
      setTab(tabKeys[0]);
    } else if (e.key === "End") {
      setTab(tabKeys[tabKeys.length - 1]);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile tabs bar */}
      <div className="md:hidden sticky top-0 z-20 bg-gray-50 border-b">
        <div
          role="tablist"
          aria-label="Profile sections"
          className="flex gap-2 overflow-x-auto px-3 py-2"
          ref={tablistRef}
          onKeyDown={onTablistKeyDown}
        >
          {SIDEBAR_TABS.map(({ key, label, icon }) => {
            const selected = activeTab === key;
            return (
              <button
                key={key}
                role="tab"
                aria-selected={selected}
                aria-controls={`${key}-panel`}
                id={`${key}-tab`}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm border transition ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-10 px-4 sm:px-6 py-6 sm:py-10">
        {/* Sidebar (desktop) */}
        <nav className="hidden md:block md:w-64 bg-white rounded-lg shadow sticky top-20 p-6 h-fit">
          <ul role="tablist" aria-label="Profile sections" className="space-y-2">
            {SIDEBAR_TABS.map(({ key, label, icon }) => (
              <li key={key}>
                <button
                  role="tab"
                  aria-selected={activeTab === key}
                  aria-controls={`${key}-panel`}
                  id={`${key}-tab`}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg transition font-semibold text-left ${
                    activeTab === key
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-gray-700 hover:bg-blue-100"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span>{label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <main className="flex-1 bg-white rounded-lg shadow p-4 sm:p-6 md:max-w-4xl">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded font-semibold">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded font-semibold">
              {successMsg}
            </div>
          )}

          {/* Profile */}
          {activeTab === "profile" && (
            <section
              role="tabpanel"
              id="profile-panel"
              aria-labelledby="profile-tab"
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold mb-2 text-blue-800">Profile Information</h2>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
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
                    pattern="[0-9]{10,}"
                    inputMode="numeric"
                  />
                </div>

                {user?.role === "owner" && (
                  <>
                    <h3 className="text-xl font-bold mt-4 mb-2 text-blue-700">
                      Owner Verification Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          pattern="[0-9]{10,}"
                          inputMode="numeric"
                        />
                      </div>
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
                      <div className="md:col-span-2">
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
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold w-full transition disabled:opacity-60"
                  disabled={updatingProfile}
                >
                  {updatingProfile ? "Updating..." : "Update Profile"}
                </button>
              </form>
            </section>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <section
              role="tabpanel"
              id="password-panel"
              aria-labelledby="password-tab"
              className="space-y-6"
            >
              <ChangePasswordForm
                form={form}
                setForm={setForm}
                setError={setError}
                setSuccessMsg={setSuccessMsg}
              />
            </section>
          )}

          {/* Verification */}
          {activeTab === "verification" && user?.role === "owner" && (
            <section
              role="tabpanel"
              id="verification-panel"
              aria-labelledby="verification-tab"
              className="space-y-6"
            >
              <VerificationStatus user={user} />
            </section>
          )}

          {/* My Properties */}
          {activeTab === "myProperties" && user?.role === "owner" && (
            <section
              role="tabpanel"
              id="myProperties-panel"
              aria-labelledby="myProperties-tab"
              className="space-y-6"
            >
              <MyProperties />
            </section>
          )}

          {/* Bookings */}
          {activeTab === "myBookings" && (
            <section
              role="tabpanel"
              id="myBookings-panel"
              aria-labelledby="myBookings-tab"
              className="space-y-6"
            >
              {user?.role === "owner" ? <OwnerBookings /> : <MyBookings />}
            </section>
          )}

          {/* Saved */}
          {activeTab === "savedproperties" && (
            <section
              role="tabpanel"
              id="savedproperties-panel"
              aria-labelledby="savedproperties-tab"
              className="space-y-6"
            >
              <Wishlist />
            </section>
          )}

          {/* Inbox */}
          {activeTab === "inbox" && (
            <section
              role="tabpanel"
              id="inbox-panel"
              aria-labelledby="inbox-tab"
              className="space-y-6"
            >
              <Inbox />
            </section>
          )}

          {/* Payments (if exists) */}
          {activeTab === "payments" && (
            <section
              role="tabpanel"
              id="payments-panel"
              aria-labelledby="payments-tab"
              className="space-y-6"
            >
              <Payments />
            </section>
          )}

          {/* Notifications (if exists) */}
          {activeTab === "notifications" && (
            <section
              role="tabpanel"
              id="notifications-panel"
              aria-labelledby="notifications-tab"
              className="space-y-6"
            >
              <Notifications />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// Change Password form component
function ChangePasswordForm({ form, setForm, setError, setSuccessMsg }) {
  const [processing, setProcessing] = useState(false);
  const [show, setShow] = useState({
    current: false,
    next: false,
    confirm: false,
  });

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
      <h2 className="text-2xl font-bold mb-2 text-blue-800">Change Password</h2>

      <div>
        <label htmlFor="currentPassword" className="block font-semibold mb-1">
          Current Password
        </label>
        <div className="flex gap-2">
          <input
            id="currentPassword"
            name="currentPassword"
            type={show.current ? "text" : "password"}
            value={form.currentPassword || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
            className="px-3 rounded bg-gray-100 border border-gray-300"
          >
            {show.current ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="newPassword" className="block font-semibold mb-1">
          New Password
        </label>
        <div className="flex gap-2">
          <input
            id="newPassword"
            name="newPassword"
            type={show.next ? "text" : "password"}
            value={form.newPassword || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, next: !s.next }))}
            className="px-3 rounded bg-gray-100 border border-gray-300"
          >
            {show.next ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block font-semibold mb-1">
          Confirm New Password
        </label>
        <div className="flex gap-2">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type={show.confirm ? "text" : "password"}
            value={form.confirmPassword || ""}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            className="w-full p-3 border border-gray-300 rounded"
            required
            minLength={6}
          />
          <button
            type="button"
            onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
            className="px-3 rounded bg-gray-100 border border-gray-300"
          >
            {show.confirm ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-3 font-semibold w-full transition disabled:opacity-60"
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
      <h2 className="text-2xl font-bold mb-2 text-blue-700">
        Owner Verification Status
      </h2>

      <div className="mb-4 p-4 rounded bg-yellow-100 text-yellow-800 font-semibold shadow">
        Your owner verification status is:{" "}
        <span
          className={`font-black ${
            user.ownerVerified
              ? "text-green-600"
              : user.ownerRejected
              ? "text-red-600"
              : "text-yellow-600"
          }`}
        >
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

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import ProfileSkeleton from "../components/ProfileSkeleton";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSearchParams } from "react-router-dom";
import {
  FaUser,
  FaLock,
  FaHome,
  FaBookmark,
  FaBell,
  FaCreditCard,
  FaCheckCircle,
  FaSignOutAlt,
  FaPencilAlt,
} from "react-icons/fa";
import { Bell, Clock3, Receipt, Trash2 } from "lucide-react";
import MyBookings from "./MyBookings";
import Inbox from "./Inbox";
import MyProperties from "./MyProperties";
import OwnerBookings from "./OwnerBookings";
import Wishlist from "./Wishlist";
import { useNotifications } from "../hooks/useNotifications";
import { generateReceiptPDF } from "../utils/printable";

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
        { key: "payments", label: "Payments", icon: <FaCreditCard /> },
        { key: "savedproperties", label: "Saved Properties", icon: <FaBookmark /> },
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
  }, [searchParams, tabKeys]);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!user?._id) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }

        const res = await API.get("/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (mounted && res.data?.user) setUser(res.data.user);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [user?._id, setUser]);

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

  if (loading) return <ProfileSkeleton />;

  // Avatar initials fallback
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-paper">
      {/* Mobile tab bar */}
      <div className="md:hidden sticky top-0 z-20 bg-paper border-b border-rule">
        <div
          role="tablist"
          aria-label="Profile sections"
          className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-2"
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
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-eyebrow transition ${
                  selected
                    ? "bg-accent text-white"
                    : "bg-card border border-rule text-muted hover:text-ink"
                }`}
              >
                <span className="text-sm">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-6 md:gap-8 px-4 sm:px-6 py-8 sm:py-12">
        {/* Sidebar — desktop */}
        <aside className="hidden md:flex md:flex-col md:w-64 shrink-0 gap-4">
          {/* Avatar card */}
          <div className="bg-card rounded-2xl shadow-card p-6 flex flex-col items-center gap-3 border border-rule">
            <div className="relative group">
              <div className="w-20 h-20 rounded-full bg-accent-soft flex items-center justify-center text-accent font-display text-2xl font-bold select-none ring-4 ring-rule">
                {initials}
              </div>
              <div className="absolute inset-0 rounded-full bg-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <FaPencilAlt className="text-white text-sm" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-display text-lg text-ink leading-tight">{user?.name || "User"}</p>
              <p className="font-eyebrow text-muted mt-0.5">{user?.role || "tenant"}</p>
            </div>
          </div>

          {/* Nav tabs */}
          <nav className="bg-card rounded-2xl shadow-card border border-rule p-3 sticky top-6">
            <ul role="tablist" aria-label="Profile sections" className="space-y-0.5">
              {SIDEBAR_TABS.map(({ key, label, icon }) => {
                const selected = activeTab === key;
                const isLogout = key === "logout";
                return (
                  <li key={key}>
                    <button
                      role="tab"
                      aria-selected={selected}
                      aria-controls={`${key}-panel`}
                      id={`${key}-tab`}
                      onClick={() => setTab(key)}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition text-sm font-medium text-left ${
                        selected
                          ? "bg-accent text-white shadow-soft"
                          : isLogout
                          ? "text-red-500 hover:bg-red-50"
                          : "text-ink hover:bg-paper"
                      }`}
                    >
                      <span className="text-base shrink-0">{icon}</span>
                      <span>{label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Alert banners */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="mb-5 px-4 py-3 bg-sage-soft border border-sage/30 text-sage-hover rounded-2xl text-sm font-medium">
              {successMsg}
            </div>
          )}

          {/* Profile */}
          {activeTab === "profile" && (
            <section
              role="tabpanel"
              id="profile-panel"
              aria-labelledby="profile-tab"
            >
              <div className="bg-card rounded-2xl shadow-card border border-rule p-6 sm:p-8">
                <h2 className="font-display text-2xl text-ink mb-1">Profile Information</h2>
                <p className="text-muted text-sm mb-6">Update your personal details below.</p>

                <form onSubmit={handleProfileUpdate} className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-ink mb-1.5">
                      Full Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      className="input-warm"
                      placeholder="Your full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                      Email <span className="text-muted font-normal">(cannot be changed)</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      disabled
                      className="input-warm opacity-60 cursor-not-allowed bg-paper"
                    />
                  </div>

                  <div>
                    <label htmlFor="contact" className="block text-sm font-medium text-ink mb-1.5">
                      Contact Number
                    </label>
                    <input
                      id="contact"
                      name="contact"
                      type="tel"
                      value={form.contact}
                      onChange={handleChange}
                      className="input-warm"
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10,}"
                      inputMode="numeric"
                    />
                  </div>

                  {user?.role === "owner" && (
                    <>
                      <div className="pt-2 border-t border-rule">
                        <h3 className="font-display text-lg text-ink mb-4 mt-4">
                          Owner Verification Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="ownerName" className="block text-sm font-medium text-ink mb-1.5">
                              Owner Name
                            </label>
                            <input
                              id="ownerName"
                              name="ownerName"
                              type="text"
                              value={form.ownerName}
                              onChange={handleChange}
                              className="input-warm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="ownerEmail" className="block text-sm font-medium text-ink mb-1.5">
                              Owner Email
                            </label>
                            <input
                              id="ownerEmail"
                              name="ownerEmail"
                              type="email"
                              value={form.ownerEmail}
                              onChange={handleChange}
                              className="input-warm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="ownerPhone" className="block text-sm font-medium text-ink mb-1.5">
                              Owner Phone
                            </label>
                            <input
                              id="ownerPhone"
                              name="ownerPhone"
                              type="tel"
                              value={form.ownerPhone}
                              onChange={handleChange}
                              className="input-warm"
                              required
                              pattern="[0-9]{10,}"
                              inputMode="numeric"
                            />
                          </div>
                          <div>
                            <label htmlFor="ownerIdType" className="block text-sm font-medium text-ink mb-1.5">
                              ID Type
                            </label>
                            <input
                              id="ownerIdType"
                              name="ownerIdType"
                              type="text"
                              value={form.ownerIdType}
                              onChange={handleChange}
                              className="input-warm"
                              placeholder="e.g. Aadhaar, PAN"
                              required
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="ownerIdNumber" className="block text-sm font-medium text-ink mb-1.5">
                              ID Number
                            </label>
                            <input
                              id="ownerIdNumber"
                              name="ownerIdNumber"
                              type="text"
                              value={form.ownerIdNumber}
                              onChange={handleChange}
                              className="input-warm"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="btn-accent w-full py-3 text-base disabled:opacity-60"
                      disabled={updatingProfile}
                    >
                      {updatingProfile ? "Updating…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Password */}
          {activeTab === "password" && (
            <section
              role="tabpanel"
              id="password-panel"
              aria-labelledby="password-tab"
            >
              <div className="bg-card rounded-2xl shadow-card border border-rule p-6 sm:p-8">
                <ChangePasswordForm
                  form={form}
                  setForm={setForm}
                  setError={setError}
                  setSuccessMsg={setSuccessMsg}
                />
              </div>
            </section>
          )}

          {/* Verification */}
          {activeTab === "verification" && user?.role === "owner" && (
            <section
              role="tabpanel"
              id="verification-panel"
              aria-labelledby="verification-tab"
            >
              <div className="bg-card rounded-2xl shadow-card border border-rule p-6 sm:p-8">
                <VerificationStatus user={user} />
              </div>
            </section>
          )}

          {/* My Properties */}
          {activeTab === "myProperties" && user?.role === "owner" && (
            <section
              role="tabpanel"
              id="myProperties-panel"
              aria-labelledby="myProperties-tab"
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
            >
              <Inbox />
            </section>
          )}

          {/* Payments */}
          {activeTab === "payments" && (
            <section
              role="tabpanel"
              id="payments-panel"
              aria-labelledby="payments-tab"
            >
              <Payments />
            </section>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <section
              role="tabpanel"
              id="notifications-panel"
              aria-labelledby="notifications-tab"
            >
              <Notifications />
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

// ── Change Password sub-component ──────────────────────────────────────────
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
    <form onSubmit={handleChangePassword} className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink mb-1">Change Password</h2>
        <p className="text-muted text-sm mb-6">Choose a strong password to keep your account safe.</p>
      </div>

      {[
        { id: "currentPassword", label: "Current Password", showKey: "current" },
        { id: "newPassword", label: "New Password", showKey: "next" },
        { id: "confirmPassword", label: "Confirm New Password", showKey: "confirm" },
      ].map(({ id, label, showKey }) => (
        <div key={id}>
          <label htmlFor={id} className="block text-sm font-medium text-ink mb-1.5">
            {label}
          </label>
          <div className="flex gap-2">
            <input
              id={id}
              name={id}
              type={show[showKey] ? "text" : "password"}
              value={form[id] || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [id]: e.target.value }))
              }
              className="input-warm"
              required
              minLength={id !== "currentPassword" ? 6 : undefined}
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
              className="btn-ghost shrink-0 px-4"
            >
              {show[showKey] ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      ))}

      <div className="pt-2">
        <button
          type="submit"
          className="btn-accent w-full py-3 text-base disabled:opacity-60"
          disabled={processing}
        >
          {processing ? "Processing…" : "Update Password"}
        </button>
      </div>
    </form>
  );
}

// ── VerificationStatus sub-component ───────────────────────────────────────
function VerificationStatus({ user }) {
  if (!user || user.role !== "owner") return null;

  const statusLabel = user.ownerVerified
    ? "Verified"
    : user.ownerRejected
    ? "Rejected"
    : "Pending Review";

  const statusStyle = user.ownerVerified
    ? "bg-sage-soft text-sage-hover border-sage/30"
    : user.ownerRejected
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-accent-soft text-accent border-accent/30";

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-2xl text-ink mb-1">Owner Verification</h2>
        <p className="text-muted text-sm">Current status of your owner account verification.</p>
      </div>

      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${statusStyle}`}>
        <span className="font-eyebrow">Status</span>
        <span className="font-semibold text-sm">{statusLabel}</span>
      </div>

      {user.ownerRejected && user.ownerRejectionReason && (
        <div className="px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-sm font-medium text-red-700 mb-1">Reason for rejection</p>
          <p className="text-sm text-red-600">{user.ownerRejectionReason}</p>
        </div>
      )}

      <p className="text-sm text-muted">
        You can update your verification details in the{" "}
        <span className="text-ink font-medium">Profile Information</span> tab.
      </p>
    </div>
  );
}

function Payments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [receiptLoadingId, setReceiptLoadingId] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadPayments = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (mounted) setLoading(false);
          return;
        }

        const res = await API.get("/rent-payments/my", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (mounted) setItems(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.message || "Failed to load payments");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPayments();
    return () => {
      mounted = false;
    };
  }, []);

  const openReceipt = async (paymentId) => {
    try {
      setReceiptLoadingId(paymentId);
      const token = localStorage.getItem("token");
      const { data } = await API.get(`/rent-payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      generateReceiptPDF(data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load receipt");
    } finally {
      setReceiptLoadingId("");
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-card border border-rule p-6 sm:p-8">
      <div>
        <h2 className="font-display text-2xl text-ink mb-1">Payments</h2>
        <p className="text-muted text-sm">Your recorded rent payments and receipts.</p>
      </div>

      {error && (
        <div className="mt-5 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 text-sm text-muted">Loading payments...</div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-rule bg-paper px-5 py-8 text-center">
          <div className="font-medium text-ink">No rent payments yet</div>
          <p className="text-sm text-muted mt-1">Completed rent receipts will appear here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((payment) => (
            <div key={payment._id} className="rounded-2xl border border-rule bg-paper px-4 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-medium text-ink">
                  {payment.property?.title || "Rental payment"}
                </div>
                <div className="text-xs text-muted mt-1">
                  {payment.periodLabel} · {payment.receiptNumber || "Receipt pending"}
                </div>
              </div>
              <div className="flex items-center gap-3 justify-between md:justify-end">
                <div className="text-right">
                  <div className="text-sm font-semibold text-ink">Rs {(Number(payment.amount) || 0).toLocaleString("en-IN")}</div>
                  <div className="text-xs text-muted">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Paid"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => openReceipt(payment._id)}
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-accent transition"
                  disabled={receiptLoadingId === payment._id}
                >
                  <Receipt className="w-4 h-4" />
                  {receiptLoadingId === payment._id ? "Opening..." : "Receipt"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { items, unread, loading, markOneRead, markAllRead, removeOne } = useNotifications();

  return (
    <div className="bg-card rounded-2xl shadow-card border border-rule p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-2xl text-ink mb-1">Notifications</h2>
          <p className="text-muted text-sm">
            {unread > 0 ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You're all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center justify-center rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink hover:bg-paper transition"
          >
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-6 text-sm text-muted">Loading notifications...</div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-rule bg-paper px-5 py-8 text-center">
          <Bell className="w-5 h-5 text-muted mx-auto mb-3" />
          <div className="font-medium text-ink">No notifications yet</div>
          <p className="text-sm text-muted mt-1">Messages, applications, bookings, and issues show up here.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div
              key={item._id}
              className={`rounded-2xl border px-4 py-4 transition ${
                item.read ? "border-rule bg-paper" : "border-accent/20 bg-accent-soft/40"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Clock3 className="w-3.5 h-3.5" />
                    <span>{item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}</span>
                  </div>
                  <div className={`mt-2 text-sm ${item.read ? "font-medium text-ink" : "font-semibold text-ink"}`}>
                    {item.title}
                  </div>
                  {item.body && <p className="mt-1 text-sm text-muted leading-relaxed">{item.body}</p>}
                  {item.link && (
                    <Link
                      to={item.link}
                      onClick={() => {
                        if (!item.read) markOneRead(item._id);
                      }}
                      className="inline-flex items-center mt-3 text-sm font-medium text-accent hover:text-ink transition"
                    >
                      Open
                    </Link>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeOne(item._id)}
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-rule text-muted hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition"
                  aria-label="Delete notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

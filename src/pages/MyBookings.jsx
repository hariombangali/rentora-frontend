import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import { toast } from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";
import PayRentModal from "../components/PayRentModal";
import RaiseIssueModal from "../components/RaiseIssueModal";
import MoveInChecklist from "../components/MoveInChecklist";
import RentalApplicationModal from "../components/RentalApplicationModal";
import { generateAgreementPDF } from "../utils/printable";
import { Calendar, MessageSquare, Clock, MapPin, FileText, Wrench, X, Send, CheckCheck, RefreshCcw, ChevronRight } from "lucide-react";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A");
const formatDateShort = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "N/A");
const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

// Compute the time the visit slot ended (start + 30 min). Returns null if unparseable.
function visitEndedAt(b) {
  if (!b?.visitDate || !b?.visitSlot) return null;
  const m = String(b.visitSlot).match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = (m[3] || "").toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  const d = new Date(b.visitDate);
  d.setHours(h, min + 30, 0, 0);
  return d;
}
// True if the visit slot has ended (and at least 1 hour has passed).
function isVisitWindowOver(b) {
  const end = visitEndedAt(b);
  if (!end) return false;
  return Date.now() >= end.getTime() + 60 * 60 * 1000;
}

// Status chip styles matching the design
export const STATUS_CHIP = {
  approved:    { bg: "oklch(0.94 0.06 150)", color: "oklch(0.45 0.1 150)", label: "Approved" },
  confirmed:   { bg: "oklch(0.94 0.06 150)", color: "oklch(0.45 0.1 150)", label: "Confirmed" },
  reviewing:   { bg: "oklch(0.94 0.05 80)",  color: "oklch(0.45 0.12 60)", label: "Reviewing" },
  pending:     { bg: "var(--chip-bg)",       color: "var(--ink-soft)",    label: "Pending" },
  rescheduled: { bg: "oklch(0.94 0.05 80)",  color: "oklch(0.45 0.12 60)", label: "Rescheduled" },
  rejected:    { bg: "oklch(0.95 0.04 25)",  color: "oklch(0.5 0.15 25)",  label: "Rejected" },
  cancelled:   { bg: "var(--rule)",          color: "var(--ink-soft)",    label: "Cancelled" },
  withdrawn:   { bg: "var(--rule)",          color: "var(--ink-soft)",    label: "Withdrawn" },
  completed:   { bg: "var(--chip-bg)",       color: "var(--ink-soft)",    label: "Completed" },
};

const TABS = [
  { key: "upcoming",     label: "Upcoming visits" },
  { key: "applications", label: "Applications" },
  { key: "active",       label: "Active rental" },
  { key: "past",         label: "Past stays" },
  { key: "cancelled",    label: "Cancelled" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelTarget, setCancelTarget] = useState(null);
  const [withdrawTarget, setWithdrawTarget] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [issueTarget, setIssueTarget] = useState(null);
  const [issueDetail, setIssueDetail] = useState(null); // the issue open in the drawer
  const [reopenInput, setReopenInput] = useState(""); // text for reopen reason
  const [reopenMode, setReopenMode] = useState(false);
  const [issueWorking, setIssueWorking] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [issueLightbox, setIssueLightbox] = useState(null); // {images, idx}
  const [outcomeTarget, setOutcomeTarget] = useState(null);   // visit booking awaiting feedback note
  const [outcomeNote, setOutcomeNote] = useState("");
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [applyTarget, setApplyTarget] = useState(null);       // {property, visitId} for the apply modal
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: "/my-bookings" } });
      return;
    }
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    Promise.allSettled([
      API.get("/bookings/my", auth),
      API.get("/applications/my", auth),
      API.get("/issues/my", auth),
    ])
      .then(([bRes, aRes, iRes]) => {
        if (bRes.status === "fulfilled") setBookings(bRes.value.data || []);
        if (aRes.status === "fulfilled") setApplications(aRes.value.data || []);
        if (iRes.status === "fulfilled") setIssues(iRes.value.data || []);
        if (bRes.status === "rejected" && aRes.status === "rejected") {
          toast.error("Failed to load bookings");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Mark how a visit went. "applied" branches into the rental-application flow.
  const submitVisitOutcome = async (bookingId, outcome, note = "") => {
    setSavingOutcome(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/bookings/${bookingId}/visit-outcome`,
        { outcome, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBookings((prev) => prev.map((b) => (b._id === bookingId ? res.data : b)));
      const labels = {
        applied: "Great — opening application",
        considering: "Saved. Take your time.",
        passed: "Got it — thanks for the feedback.",
        no_show: "Marked as not visited.",
      };
      toast.success(labels[outcome] || "Saved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to save");
    } finally {
      setSavingOutcome(false);
    }
  };

  const acceptReschedule = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(`/bookings/${id}/accept-reschedule`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings((prev) => prev.map((b) => (b._id === id ? res.data : b)));
      toast.success("New time confirmed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };
  const declineReschedule = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(`/bookings/${id}/decline-reschedule`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings((prev) => prev.map((b) => (b._id === id ? res.data : b)));
      toast.success("Declined — owner will be notified");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    }
  };

  const downloadAgreement = async (booking) => {
    try {
      const token = localStorage.getItem("token");
      // Fetch property + owner (populated) for a richer agreement
      const propRes = await API.get(`/properties/${booking.property?._id || booking.property}`);
      generateAgreementPDF({
        booking,
        property: propRes.data,
        owner: propRes.data?.user || booking.owner,
        tenant: JSON.parse(localStorage.getItem("user") || "{}"),
      });
    } catch (e) {
      toast.error("Could not open agreement");
    }
  };

  // Partition into upcoming visits / active rental / past / cancelled
  const { upcoming, active, past, cancelled } = useMemo(() => {
    const upcoming = [];
    const active = [];
    const past = [];
    const cancelled = [];
    for (const b of bookings) {
      if (b.status === "cancelled" || b.status === "rejected") {
        cancelled.push(b);
      } else if (b.type === "rental" && ["approved", "confirmed", "pending"].includes(b.status)) {
        active.push(b);
      } else if (b.type === "visit") {
        // A visit moves to "past" once: status === completed, or tenant has marked an outcome.
        // Until then, even if the slot has ended, it stays in upcoming with a "How did it go?" prompt.
        if (b.status === "completed" || b.outcome) past.push(b);
        else upcoming.push(b);
      } else if (b.type === "lead") {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    }
    return { upcoming, active, past, cancelled };
  }, [bookings]);

  const counts = {
    upcoming: upcoming.length,
    applications: applications.filter((a) => !["withdrawn"].includes(a.status)).length,
    active: active.length,
    past: past.length,
    cancelled: cancelled.length + applications.filter((a) => ["withdrawn", "rejected"].includes(a.status)).length,
  };

  const handleMessageOwner = async (b) => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/messages/conversations", {
        params: { propertyId: b.property?._id, partnerId: b.owner?._id },
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/inbox", { state: { conversation: res.data } });
    } catch {
      toast.error("Could not open chat with owner");
    }
  };

  const handleCancelConfirm = async () => {
    const id = cancelTarget;
    setCancelTarget(null);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(`/bookings/${id}/cancel`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBookings((prev) => prev.map((b) => (b._id === id ? res.data : b)));
      toast.success("Booking cancelled");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel");
    }
  };

  const handleWithdrawConfirm = async () => {
    const id = withdrawTarget;
    setWithdrawTarget(null);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(`/applications/${id}/withdraw`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setApplications((prev) => prev.map((a) => (a._id === id ? { ...a, ...res.data } : a)));
      toast.success("Application withdrawn");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw");
    }
  };

  const fallbackImg = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80";

  // Issue actions (drawer)
  const refreshIssue = (updated) => {
    setIssues((prev) => prev.map((it) => (it._id === updated._id ? updated : it)));
    setIssueDetail((prev) => (prev && prev._id === updated._id ? updated : prev));
  };

  const confirmIssueFix = async () => {
    if (!issueDetail) return;
    setIssueWorking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(`/issues/${issueDetail._id}/confirm`, {}, { headers: { Authorization: `Bearer ${token}` } });
      refreshIssue(res.data);
      toast.success("Thanks — issue closed.");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setIssueWorking(false);
    }
  };

  const reopenIssue = async () => {
    if (!issueDetail) return;
    setIssueWorking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(
        `/issues/${issueDetail._id}/reopen`,
        { reason: reopenInput.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refreshIssue(res.data);
      toast.success("Reopened — owner notified.");
      setReopenMode(false);
      setReopenInput("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setIssueWorking(false);
    }
  };

  const sendIssueComment = async () => {
    if (!issueDetail || !commentText.trim()) return;
    setCommentSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/issues/${issueDetail._id}/comments`,
        { text: commentText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      refreshIssue(res.data);
      setCommentText("");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed");
    } finally {
      setCommentSending(false);
    }
  };

  // Live updates: server emits "issue:updated" and "booking:updated" to this user's room.
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });

    const handleIssueUpdate = (updated) => {
      if (!updated?._id) return;
      setIssues((prev) => {
        const idx = prev.findIndex((it) => it._id === updated._id);
        if (idx === -1) return [updated, ...prev];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      setIssueDetail((prev) => (prev && prev._id === updated._id ? updated : prev));
    };

    const handleBookingUpdate = (updated) => {
      if (!updated?._id) return;
      setBookings((prev) => {
        const idx = prev.findIndex((b) => b._id === updated._id);
        if (idx === -1) return [updated, ...prev];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    };

    socket.on("issue:updated", handleIssueUpdate);
    socket.on("booking:updated", handleBookingUpdate);
    return () => {
      socket.off("issue:updated", handleIssueUpdate);
      socket.off("booking:updated", handleBookingUpdate);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1280px] mx-auto px-6 pt-8 pb-24">
        {/* Breadcrumb */}
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <span>My Bookings</span>
        </div>

        <p className="font-eyebrow text-[color:var(--muted)] mt-4">
          {counts.active} active · {counts.upcoming} upcoming visit{counts.upcoming === 1 ? "" : "s"}
        </p>
        <h1 className="font-display text-[44px] md:text-[56px] leading-[1] mt-2 tracking-[-0.02em]">Bookings &amp; visits.</h1>
        <p className="mt-3 max-w-xl text-[15px] text-[color:var(--muted)]">
          Everything you&rsquo;ve booked, scheduled, or lived in through Rentora.
        </p>

        {/* Tabs */}
        <div className="mt-7 inline-flex bg-card border border-rule rounded-full p-1 gap-0.5 overflow-x-auto max-w-full">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 md:px-5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition ${
                activeTab === t.key ? "bg-ink text-paper" : "text-[color:var(--muted)] hover:text-ink"
              }`}
            >
              {t.label} {counts[t.key] > 0 ? `· ${counts[t.key]}` : ""}
            </button>
          ))}
        </div>

        <ConfirmModal
          isOpen={!!cancelTarget}
          title="Cancel Booking"
          message="Are you sure you want to cancel this request?"
          confirmLabel="Yes, cancel"
          onConfirm={handleCancelConfirm}
          onCancel={() => setCancelTarget(null)}
        />
        <ConfirmModal
          isOpen={!!withdrawTarget}
          title="Withdraw Application"
          message="The owner will be notified and you'll need to reapply to re-enter the queue."
          confirmLabel="Yes, withdraw"
          onConfirm={handleWithdrawConfirm}
          onCancel={() => setWithdrawTarget(null)}
        />

        {loading ? (
          <div className="mt-10 flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-rule rounded-3xl p-2 grid grid-cols-1 md:grid-cols-[180px_1fr_180px] gap-4 items-center animate-pulse">
                <div className="h-[140px] rounded-2xl bg-[#e8e2d3]" />
                <div className="px-3 md:px-0 py-3 space-y-3">
                  <div className="h-5 w-24 rounded-full bg-[#e8e2d3]" />
                  <div className="h-6 w-3/4 rounded-full bg-[#e8e2d3]" />
                  <div className="h-4 w-1/2 rounded-full bg-[#e8e2d3]" />
                  <div className="flex gap-4 pt-1">
                    <div className="space-y-1"><div className="h-3 w-10 rounded-full bg-[#e8e2d3]" /><div className="h-4 w-16 rounded-full bg-[#e8e2d3]" /></div>
                    <div className="space-y-1"><div className="h-3 w-10 rounded-full bg-[#e8e2d3]" /><div className="h-4 w-16 rounded-full bg-[#e8e2d3]" /></div>
                  </div>
                </div>
                <div className="p-3 md:p-5 flex flex-col gap-2">
                  <div className="h-9 w-full rounded-full bg-[#e8e2d3]" />
                  <div className="h-4 w-20 rounded-full bg-[#e8e2d3]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* UPCOMING VISITS */}
            {activeTab === "upcoming" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Upcoming visits</h2>
                {upcoming.length === 0 ? (
                  <EmptyState icon={<Calendar className="w-5 h-5 text-accent" />} title="No upcoming visits" body="Browse properties and request a visit to see it here." />
                ) : (
                  <div className="mt-4 flex flex-col gap-3.5">
                    {upcoming.map((b) => {
                      const status = STATUS_CHIP[b.status] || STATUS_CHIP.pending;
                      const img = b.property?.images?.[0] || fallbackImg;
                      return (
                        <div
                          key={b._id}
                          className="bg-card border border-rule rounded-3xl p-2 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-4 md:gap-5 items-center"
                        >
                          <img src={img} alt="" className="w-full h-[140px] md:h-[140px] object-cover rounded-2xl" />
                          <div className="px-3 md:px-0">
                            <span
                              className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium"
                              style={{ background: status.bg, color: status.color }}
                            >
                              {status.label}
                            </span>
                            <div className="font-semibold text-[18px] mt-2">
                              {b.property?.title || "Property"}
                            </div>
                            <div className="text-[13px] text-[color:var(--muted)] mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {b.property?.location?.locality}, {b.property?.location?.city || "Indore"}
                              {b.owner?.name ? ` · with ${b.owner.name}` : ""}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-6 text-[13px]">
                              <Meta label="Date" value={formatDateShort(b.visitDate || b.createdAt)} />
                              <Meta label="Time" value={b.visitSlot || "—"} />
                              <Meta label="Mode" value="In person" />
                            </div>

                            {b.status === "rescheduled" && b.reschedule?.date && (
                              <div className="mt-4 bg-[oklch(0.94_0.05_80)] border border-rule rounded-2xl p-3.5">
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                  <div>
                                    <div className="font-eyebrow text-[10px] text-[color:var(--muted)]">Owner proposed a new time</div>
                                    <div className="font-medium text-[14px] mt-0.5">
                                      {formatDateShort(b.reschedule.date)} · {b.reschedule.slot}
                                    </div>
                                    {b.reschedule.reason && (
                                      <div className="text-[12px] text-[color:var(--muted)] mt-0.5">{b.reschedule.reason}</div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => acceptReschedule(b._id)}
                                      className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-ink text-paper text-[12px] font-medium hover:bg-accent transition"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => declineReschedule(b._id)}
                                      className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-card border border-rule text-ink text-[12px] font-medium hover:border-ink transition"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Post-visit prompt — appears once the slot has ended and tenant hasn't responded */}
                            {!b.outcome && b.status !== "completed" && isVisitWindowOver(b) && (
                              <div className="mt-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
                                <p className="font-eyebrow text-[10px] text-accent">How did it go?</p>
                                <p className="font-medium text-[14px] mt-1 text-ink">
                                  Tell us what you thought of {b.property?.title || "the place"}.
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => {
                                      submitVisitOutcome(b._id, "applied").then(() => {
                                        setApplyTarget({ property: b.property, visitId: b._id });
                                      });
                                    }}
                                    disabled={savingOutcome}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition disabled:opacity-50"
                                  >
                                    Loved it · Apply
                                  </button>
                                  <button
                                    onClick={() => submitVisitOutcome(b._id, "considering")}
                                    disabled={savingOutcome}
                                    className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition disabled:opacity-50"
                                  >
                                    Still deciding
                                  </button>
                                  <button
                                    onClick={() => { setOutcomeTarget({ id: b._id, kind: "passed" }); setOutcomeNote(""); }}
                                    disabled={savingOutcome}
                                    className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition disabled:opacity-50"
                                  >
                                    Pass — not for me
                                  </button>
                                  <button
                                    onClick={() => submitVisitOutcome(b._id, "no_show")}
                                    disabled={savingOutcome}
                                    className="inline-flex items-center justify-center px-3 py-2 rounded-full bg-card border border-rule text-[color:var(--muted)] text-[13px] font-medium hover:text-ink hover:border-ink transition disabled:opacity-50"
                                  >
                                    I didn&rsquo;t visit
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="p-3 md:p-5 flex flex-row md:flex-col gap-2 md:w-[180px] self-center">
                            <button onClick={() => handleMessageOwner(b)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition">
                              <MessageSquare className="w-3.5 h-3.5" /> Message
                            </button>
                            <button
                              onClick={() => setCancelTarget(b._id)}
                              className="text-[12px] mt-0 md:mt-1 text-[color:var(--danger)] hover:underline"
                              style={{ color: "oklch(0.62 0.15 25)" }}
                            >
                              Cancel visit
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* APPLICATIONS */}
            {activeTab === "applications" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Rental applications</h2>
                {applications.length === 0 ? (
                  <EmptyState
                    icon={<FileText className="w-5 h-5 text-accent" />}
                    title="No applications yet"
                    body="When you apply to a home, you'll see the owner's response here."
                  />
                ) : (
                  <div className="mt-4 flex flex-col gap-3.5">
                    {applications.map((a) => {
                      const status = STATUS_CHIP[a.status] || STATUS_CHIP.pending;
                      const img = a.property?.images?.[0] || fallbackImg;
                      const canWithdraw = ["pending", "reviewing"].includes(a.status);
                      return (
                        <div
                          key={a._id}
                          className="bg-card border border-rule rounded-3xl p-2 grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-4 md:gap-5 items-stretch"
                        >
                          <Link to={a.property?._id ? `/properties/${a.property._id}` : "#"} className="block">
                            <img src={img} alt="" className="w-full h-[140px] object-cover rounded-2xl" />
                          </Link>
                          <div className="px-3 md:px-0 py-3 md:py-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium"
                                style={{ background: status.bg, color: status.color }}
                              >
                                {status.label}
                              </span>
                              <span className="text-[12px] text-[color:var(--muted)]">
                                Applied {formatDate(a.createdAt)}
                              </span>
                            </div>
                            <div className="font-semibold text-[18px] mt-2">{a.property?.title || "Property"}</div>
                            <div className="text-[13px] text-[color:var(--muted)] mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {a.property?.location?.locality}{a.property?.location?.locality ? ", " : ""}
                              {a.property?.location?.city || "Indore"}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
                              <Meta label="Move-in" value={formatDate(a.moveInDate)} />
                              <Meta label="Duration" value={a.duration || "—"} />
                              <Meta label="Occupants" value={`${a.occupantCount} · ${a.occupantType}`} />
                              {a.property?.price && <Meta label="Rent" value={fmtINR(a.property.price) + "/mo"} />}
                            </div>
                            {a.ownerNote && (
                              <div className="mt-3 bg-paper border border-rule rounded-2xl px-3 py-2 text-[13px]">
                                <span className="font-medium">Owner note: </span>
                                <span className="text-[color:var(--muted)]">{a.ownerNote}</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3 md:p-5 flex flex-row md:flex-col gap-2 md:w-[180px] self-center">
                            {a.status === "approved" && a.booking ? (
                              <button
                                onClick={() => setActiveTab("active")}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
                              >
                                View rental
                              </button>
                            ) : (
                              <Link
                                to={a.property?._id ? `/properties/${a.property._id}` : "#"}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                              >
                                View home
                              </Link>
                            )}
                            {canWithdraw && (
                              <button
                                onClick={() => setWithdrawTarget(a._id)}
                                className="text-[12px] text-[color:var(--muted)] hover:text-[color:var(--danger)] transition md:text-left"
                                style={{ color: undefined }}
                              >
                                Withdraw
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ACTIVE RENTAL */}
            {activeTab === "active" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Active rental</h2>
                {active.length === 0 ? (
                  <EmptyState icon={<Clock className="w-5 h-5 text-accent" />} title="No active rental" body="When you move into a Rentora home, you'll see your lease here." />
                ) : (
                  active.map((b) => {
                    if (!b.moveInCompletedAt) {
                      return (
                        <MoveInChecklist
                          key={b._id}
                          booking={b}
                          role="tenant"
                          onUpdated={(updated) =>
                            setBookings((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
                          }
                        />
                      );
                    }
                    return (
                      <ActiveRentalCard
                        key={b._id}
                        b={b}
                        issues={issues.filter((i) => String(i.booking) === String(b._id))}
                        onPay={() => setPayTarget(b)}
                        onDownloadAgreement={() => downloadAgreement(b)}
                        onRaiseIssue={() => setIssueTarget(b)}
                        onOpenIssue={(it) => { setIssueDetail(it); setReopenMode(false); setReopenInput(""); setCommentText(""); }}
                      />
                    );
                  })
                )}
              </section>
            )}

            {/* PAST STAYS */}
            {activeTab === "past" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Past visits &amp; stays</h2>
                {past.length === 0 ? (
                  <EmptyState icon={<Clock className="w-5 h-5 text-accent" />} title="Nothing here yet" body="Visits you've completed and homes you've lived in will appear here." />
                ) : (
                  <div className="mt-4 bg-card border border-rule rounded-3xl overflow-hidden">
                    {past.map((b, i) => {
                      const isVisit = b.type === "visit";
                      const outcomeChip = (() => {
                        if (!isVisit) return null;
                        const map = {
                          applied:     { label: "Applied",     bg: "oklch(0.94 0.06 150)", color: "oklch(0.45 0.1 150)" },
                          considering: { label: "Considering", bg: "oklch(0.96 0.02 80)",  color: "var(--accent)" },
                          passed:      { label: "Passed",      bg: "var(--rule)",          color: "var(--ink-soft)" },
                          no_show:     { label: "No-show",     bg: "var(--rule)",          color: "var(--ink-soft)" },
                        };
                        const m = map[b.outcome];
                        if (!m) return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] bg-paper border border-rule text-[color:var(--muted)]">Visited</span>;
                        return <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
                      })();
                      return (
                        <div
                          key={b._id}
                          className={`px-6 py-5 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_auto_auto] gap-5 items-center ${
                            i !== past.length - 1 ? "border-b border-rule" : ""
                          }`}
                        >
                          <div>
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              {b.property?.title || "Property"}
                              {outcomeChip}
                            </div>
                            <div className="text-[12px] text-[color:var(--muted)]">{b.property?.location?.locality}</div>
                          </div>
                          <div className="text-[13px] text-[color:var(--muted)]">
                            {isVisit
                              ? `Visited ${formatDate(b.visitDate || b.completedAt || b.createdAt)}`
                              : `${formatDate(b.checkIn || b.createdAt)}${b.checkOut ? ` – ${formatDate(b.checkOut)}` : ""}`}
                          </div>
                          <div className="text-[13px] text-[color:var(--muted)]">
                            {!isVisit && b.priceQuoted ? fmtINR(b.priceQuoted) : ""}
                          </div>
                          <div>
                            {isVisit && b.outcome === "considering" ? (
                              <button
                                onClick={() => setApplyTarget({ property: b.property, visitId: b._id })}
                                className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
                              >
                                Apply now
                              </button>
                            ) : !isVisit ? (
                              <button className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-card border border-rule text-[13px] hover:border-ink transition">
                                Write a review
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* CANCELLED */}
            {activeTab === "cancelled" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Cancelled</h2>
                {cancelled.length === 0 ? (
                  <EmptyState icon={<Clock className="w-5 h-5 text-accent" />} title="No cancelled bookings" body="Cancelled visits and rental requests show up here." />
                ) : (
                  <div className="mt-4 flex flex-col gap-3.5">
                    {cancelled.map((b) => (
                      <div key={b._id} className="bg-card border border-rule rounded-3xl p-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{b.property?.title || "Property"}</div>
                          <div className="text-[13px] text-[color:var(--muted)]">
                            {b.type} · {formatDate(b.createdAt)}
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px]" style={{ background: "var(--rule)", color: "var(--ink-soft)" }}>
                          {STATUS_CHIP[b.status]?.label || b.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <PayRentModal
        open={!!payTarget}
        booking={payTarget}
        onClose={() => setPayTarget(null)}
        onPaid={() => { setPayTarget(null); /* rely on the booking.paid flag elsewhere */ }}
      />
      <RaiseIssueModal
        open={!!issueTarget}
        booking={issueTarget}
        onClose={() => setIssueTarget(null)}
        onSubmitted={async () => {
          try {
            const token = localStorage.getItem("token");
            const res = await API.get("/issues/my", { headers: { Authorization: `Bearer ${token}` } });
            setIssues(res.data || []);
          } catch (e) { /* ignore */ }
        }}
      />

      {/* Apply-to-rent flow after a "Loved it" or "Considering → Apply now" outcome */}
      {applyTarget && (
        <RentalApplicationModal
          open={!!applyTarget}
          property={applyTarget.property}
          onClose={() => setApplyTarget(null)}
          onSubmitted={() => { setApplyTarget(null); toast.success("Application sent."); }}
        />
      )}

      {/* "Tell us why" modal for the Pass outcome */}
      {outcomeTarget && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setOutcomeTarget(null)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-[22px]">Anything you'd like the owner to know?</h3>
            <p className="text-[13px] text-[color:var(--muted)] mt-1">Optional — helps them improve the listing.</p>
            <textarea
              rows={3}
              value={outcomeNote}
              onChange={(e) => setOutcomeNote(e.target.value)}
              placeholder="Smaller than expected, no natural light…"
              className="mt-4 w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => { submitVisitOutcome(outcomeTarget.id, "passed"); setOutcomeTarget(null); }}
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition"
              >
                Skip
              </button>
              <button
                onClick={() => { submitVisitOutcome(outcomeTarget.id, "passed", outcomeNote); setOutcomeTarget(null); }}
                disabled={savingOutcome}
                className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
              >
                Send feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue detail drawer (tenant) */}
      {issueDetail && (
        <IssueDrawer
          issue={issueDetail}
          onClose={() => { setIssueDetail(null); setReopenMode(false); setReopenInput(""); setCommentText(""); }}
          onConfirm={confirmIssueFix}
          onReopen={reopenIssue}
          reopenMode={reopenMode}
          setReopenMode={setReopenMode}
          reopenInput={reopenInput}
          setReopenInput={setReopenInput}
          working={issueWorking}
          commentText={commentText}
          setCommentText={setCommentText}
          onSendComment={sendIssueComment}
          commentSending={commentSending}
          onOpenLightbox={(images, idx) => setIssueLightbox({ images, idx })}
        />
      )}

      {issueLightbox && (
        <div className="fixed inset-0 z-[60] bg-ink/90 grid place-items-center p-4" onClick={() => setIssueLightbox(null)}>
          <button onClick={() => setIssueLightbox(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-paper/10 text-paper flex items-center justify-center hover:bg-paper/20">
            <X className="w-5 h-5" />
          </button>
          <img src={issueLightbox.images[issueLightbox.idx]} alt="" className="max-w-full max-h-[88vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function IssueDrawer({
  issue, onClose,
  onConfirm, onReopen, reopenMode, setReopenMode, reopenInput, setReopenInput,
  working, commentText, setCommentText, onSendComment, commentSending,
  onOpenLightbox,
}) {
  const bodyRef = useRef(null);
  const bottomRef = useRef(null);
  const commentCount = issue.comments?.length || 0;

  // Scroll the conversation into view: on open (with messages) and on every new message.
  useEffect(() => {
    const node = bottomRef.current;
    const scroller = bodyRef.current;
    if (!node || !scroller) return;
    // Use rAF so the layout settles before we measure.
    requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
  }, [commentCount, issue._id]);

  const fmtDateTime = (d) => !d ? "—" : new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const statusBg = issue.status === "open" ? "oklch(0.95 0.04 25)" :
                   issue.status === "resolved" ? "oklch(0.94 0.06 150)" :
                   issue.status === "closed" ? "var(--rule)" :
                   "oklch(0.94 0.05 80)";
  const statusFg = issue.status === "open" ? "oklch(0.5 0.15 25)" :
                   issue.status === "resolved" ? "oklch(0.45 0.1 150)" :
                   issue.status === "closed" ? "var(--ink-soft)" :
                   "oklch(0.45 0.12 60)";
  const showConfirmActions = issue.status === "resolved";
  const canReopen = issue.status === "resolved" || issue.status === "closed";

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-stretch md:justify-end" onClick={onClose}>
      <div className="bg-card w-full md:max-w-md h-[92vh] md:h-full rounded-t-3xl md:rounded-none flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-rule flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize" style={{ background: statusBg, color: statusFg }}>
                {issue.status.replace("_", " ")}
              </span>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] bg-paper border border-rule text-[color:var(--muted)]">{issue.priority} priority</span>
              {issue.reopenCount > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-amber-50 text-amber-700">
                  <RefreshCcw className="w-3 h-3" /> Reopened {issue.reopenCount}×
                </span>
              )}
            </div>
            <h3 className="font-display text-[22px] mt-2 truncate">{issue.category}</h3>
            <p className="text-[12px] text-[color:var(--muted)] truncate">{issue.property?.title}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full hover:bg-paper flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto bg-paper/40">
          <div className="p-5 space-y-4">
            {/* Awaiting confirm banner */}
            {issue.status === "resolved" && issue.awaitingTenantConfirm && (
              <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                <p className="font-medium text-[13px] text-amber-900">Owner says it&rsquo;s fixed.</p>
                <p className="text-[12px] text-amber-800 mt-0.5">If everything works, confirm to close it. If not, reopen and tell them what&rsquo;s still wrong.</p>
              </div>
            )}

            {/* Schedule banner */}
            {issue.scheduledFor && (
              <div className="rounded-2xl border border-rule bg-card px-4 py-3 flex items-center gap-2.5 text-[13px]">
                <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                <span className="text-ink"><b>Visit scheduled:</b> {fmtDateTime(issue.scheduledFor)}</span>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-1.5">Your report</p>
              <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap bg-card border border-rule rounded-2xl px-4 py-3">
                {issue.description}
              </p>
            </div>

            {/* Images */}
            {issue.images?.length > 0 && (
              <div>
                <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-1.5">Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {issue.images.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => onOpenLightbox(issue.images, idx)}
                      className="aspect-square rounded-xl overflow-hidden border border-rule hover:border-ink transition"
                    >
                      <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Owner note */}
            {issue.ownerNote && (
              <div>
                <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-1.5">Owner&rsquo;s note</p>
                <p className="text-[14px] text-ink leading-relaxed bg-card border border-rule rounded-2xl px-4 py-3">{issue.ownerNote}</p>
              </div>
            )}

            {/* Comments */}
            <div>
              <p className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2">Conversation</p>
              {issue.comments?.length ? (
                <div className="space-y-2.5">
                  {issue.comments.map((c, i) => {
                    const mine = c.authorRole === "tenant";
                    return (
                      <div key={c._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
                          mine ? "bg-ink text-paper" : "bg-card border border-rule text-ink"
                        }`}>
                          <p className="whitespace-pre-wrap">{c.text}</p>
                          <div className={`mt-1 text-[10px] ${mine ? "text-paper/60" : "text-[color:var(--muted)]"}`}>
                            {c.author?.name || (c.authorRole === "owner" ? "Owner" : "You")}
                            {c.createdAt && <> · {new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] text-[color:var(--muted)] bg-card border border-rule rounded-2xl px-4 py-3">No messages yet. Send the owner an update or question below.</p>
              )}
            </div>
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Reopen mode */}
        {reopenMode ? (
          <div className="px-5 py-4 border-t border-rule bg-card space-y-3">
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)]">What&rsquo;s still wrong? (optional)</label>
            <textarea
              rows={2}
              value={reopenInput}
              onChange={(e) => setReopenInput(e.target.value)}
              placeholder="Tap still drips overnight…"
              className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setReopenMode(false); setReopenInput(""); }} className="inline-flex items-center px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] hover:border-ink transition">Cancel</button>
              <button onClick={onReopen} disabled={working} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-600 text-white text-[13px] font-medium hover:bg-amber-700 transition disabled:opacity-50">
                <RefreshCcw className="w-3.5 h-3.5" /> {working ? "Reopening…" : "Reopen issue"}
              </button>
            </div>
          </div>
        ) : showConfirmActions ? (
          <div className="px-5 py-4 border-t border-rule bg-card flex gap-2">
            <button
              onClick={() => setReopenMode(true)}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Reopen
            </button>
            <button
              onClick={onConfirm}
              disabled={working}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
            >
              <CheckCheck className="w-3.5 h-3.5" /> {working ? "Confirming…" : "Confirm fix"}
            </button>
          </div>
        ) : (
          <div className="px-3 py-3 border-t border-rule bg-card flex items-center gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSendComment(); } }}
              placeholder="Send a message to the owner…"
              disabled={commentSending}
              className="flex-1 rounded-full border border-rule bg-card px-4 py-2.5 text-[14px] focus:outline-none focus:border-ink disabled:opacity-50"
            />
            {canReopen && (
              <button
                onClick={() => setReopenMode(true)}
                title="Reopen issue"
                className="w-10 h-10 rounded-full bg-card border border-rule text-ink flex items-center justify-center hover:border-ink transition"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onSendComment}
              disabled={commentSending || !commentText.trim()}
              className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center hover:bg-accent transition disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="font-eyebrow text-[11px] text-[color:var(--muted)]">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, body }) {
  return (
    <div className="mt-6 bg-card border border-rule rounded-3xl p-12 flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="font-display text-[20px]">{title}</h3>
      <p className="text-[14px] text-[color:var(--muted)] mt-1 max-w-sm">{body}</p>
      <Link to="/properties" className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition">
        Browse homes
      </Link>
    </div>
  );
}

function ActiveRentalCard({ b, issues = [], onPay, onDownloadAgreement, onRaiseIssue, onOpenIssue }) {
  const moveIn = b.checkIn ? new Date(b.checkIn) : null;
  const end = b.checkOut ? new Date(b.checkOut) : null;
  const now = new Date();

  const openIssueCount = issues.filter((i) => ["open", "acknowledged", "in_progress"].includes(i.status)).length;

  let progress = 0;
  let monthsIn = 0;
  let totalMonths = 12;
  if (moveIn && end) {
    totalMonths = Math.max(1, Math.round((end - moveIn) / (30 * 24 * 3600 * 1000)));
    const elapsed = Math.max(0, Math.round((now - moveIn) / (30 * 24 * 3600 * 1000)));
    monthsIn = Math.min(totalMonths, elapsed);
    progress = Math.min(100, Math.max(0, (monthsIn / totalMonths) * 100));
  }

  const nextRentDate = (() => {
    if (!moveIn) return "—";
    const day = moveIn.getDate();
    const due = new Date(now.getFullYear(), now.getMonth(), day);
    if (due < now) due.setMonth(due.getMonth() + 1);
    return due.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  })();

  return (
    <div className="mt-4 bg-card border border-rule rounded-3xl p-7 md:p-8 shadow-card grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8">
      <div>
        <p className="font-eyebrow text-[color:var(--muted)]">Current lease</p>
        <div className="font-display text-[32px] mt-1.5">{b.property?.title || "Property"}</div>
        <div className="text-[14px] text-[color:var(--muted)] mt-1">
          {b.property?.bedrooms ? `${b.property.bedrooms} BHK · ` : ""}
          {b.property?.location?.locality}, {b.property?.location?.city || "Indore"}
          {b.owner?.name ? ` · Owner: ${b.owner.name}` : ""}
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-5">
          <Meta label="Move-in" value={formatDate(b.checkIn)} />
          <Meta label="Lease end" value={formatDate(b.checkOut)} />
          <Meta label="Rent" value={b.priceQuoted ? `${fmtINR(b.priceQuoted)} /mo` : "—"} />
          <Meta label="Deposit" value={b.priceQuoted ? `${fmtINR(b.priceQuoted * 2)} · held` : "—"} />
          <Meta label="Next rent" value={`Due ${nextRentDate}`} />
          <Meta label="Tenancy" value={`${monthsIn} month${monthsIn === 1 ? "" : "s"} in`} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={onPay}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
          >
            Pay rent{b.priceQuoted ? ` · ${fmtINR(b.priceQuoted)}` : ""}
          </button>
          <button
            onClick={onDownloadAgreement}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
          >
            Download agreement
          </button>
          <button
            onClick={onRaiseIssue}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
          >
            Raise issue
            {openIssueCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-paper text-[10px] font-semibold">
                {openIssueCount}
              </span>
            )}
          </button>
        </div>

        {issues.length > 0 && (
          <div className="mt-5 bg-paper border border-rule rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <div className="font-eyebrow text-[10px] text-[color:var(--muted)]">Your issues</div>
              {issues.length > 3 && <span className="text-[11px] text-[color:var(--muted)]">{issues.length} total</span>}
            </div>
            <div className="space-y-2">
              {issues.slice(0, 3).map((i) => {
                const statusBg = i.status === "open" ? "oklch(0.95 0.04 25)" :
                                 i.status === "resolved" ? "oklch(0.94 0.06 150)" :
                                 i.status === "closed" ? "var(--rule)" :
                                 "oklch(0.94 0.05 80)";
                const statusFg = i.status === "open" ? "oklch(0.5 0.15 25)" :
                                 i.status === "resolved" ? "oklch(0.45 0.1 150)" :
                                 i.status === "closed" ? "var(--ink-soft)" :
                                 "oklch(0.45 0.12 60)";
                const needsAction = i.status === "resolved" && i.awaitingTenantConfirm;
                return (
                  <button
                    key={i._id}
                    onClick={() => onOpenIssue?.(i)}
                    className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-xl text-[13px] text-left hover:bg-card transition ${
                      needsAction ? "ring-1 ring-amber-300 bg-amber-50/60" : ""
                    }`}
                  >
                    {i.images?.[0] && (
                      <img src={i.images[0]} alt="" className="w-9 h-9 rounded-lg object-cover border border-rule shrink-0" loading="lazy" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-ink">{i.category}</span>
                        {needsAction && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-800">Needs your reply</span>}
                      </div>
                      <div className="text-[12px] text-[color:var(--muted)] truncate">
                        {i.description.slice(0, 70)}{i.description.length > 70 ? "…" : ""}
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] capitalize shrink-0" style={{ background: statusBg, color: statusFg }}>
                      {i.status.replace("_", " ")}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-[color:var(--muted)] shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl bg-paper p-5">
        <div className="font-medium text-[14px]">Lease progress</div>
        <div className="mt-3.5 h-2 rounded-full bg-rule overflow-hidden">
          <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[12px] text-[color:var(--muted)] mt-1.5">
          <span>{formatDate(b.checkIn)}</span>
          <span>{formatDate(b.checkOut)}</span>
        </div>
        <p className="mt-4 text-[13px] text-[color:var(--muted)] leading-relaxed">
          You&rsquo;ve paid {monthsIn} of {totalMonths} months. Renewal window opens 30 days before lease end. We&rsquo;ll send you a nudge.
        </p>
        <button className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition">
          View payment history
        </button>
      </div>
    </div>
  );
}

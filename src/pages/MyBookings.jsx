import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";
import { Calendar, MessageSquare, Clock, MapPin } from "lucide-react";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A");
const formatDateShort = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "N/A");
const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

// Status chip styles matching the design
const STATUS_CHIP = {
  approved:    { bg: "oklch(0.94 0.06 150)", color: "oklch(0.45 0.1 150)", label: "Confirmed" },
  confirmed:   { bg: "oklch(0.94 0.06 150)", color: "oklch(0.45 0.1 150)", label: "Confirmed" },
  pending:     { bg: "var(--chip-bg)",       color: "var(--ink-soft)",    label: "Awaiting owner" },
  rescheduled: { bg: "oklch(0.94 0.05 80)",  color: "oklch(0.45 0.12 60)", label: "Rescheduled" },
  rejected:    { bg: "oklch(0.95 0.04 25)",  color: "oklch(0.5 0.15 25)",  label: "Rejected" },
  cancelled:   { bg: "var(--rule)",          color: "var(--ink-soft)",    label: "Cancelled" },
  completed:   { bg: "var(--chip-bg)",       color: "var(--ink-soft)",    label: "Completed" },
};

const TABS = [
  { key: "upcoming", label: "Upcoming visits" },
  { key: "active",   label: "Active rental" },
  { key: "past",     label: "Past stays" },
  { key: "cancelled", label: "Cancelled" },
];

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [cancelTarget, setCancelTarget] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { state: { from: "/my-bookings" } });
      return;
    }
    API.get("/bookings/my", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setBookings(res.data || []))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [navigate]);

  // Partition into upcoming visits / active rental / past / cancelled
  const { upcoming, active, past, cancelled } = useMemo(() => {
    const now = Date.now();
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
        const when = new Date(b.visitDate || b.createdAt).getTime();
        if (!isNaN(when) && when >= now - 24 * 3600 * 1000) upcoming.push(b);
        else past.push(b);
      } else if (b.type === "lead") {
        upcoming.push(b);
      } else {
        past.push(b);
      }
    }
    return { upcoming, active, past, cancelled };
  }, [bookings]);

  const counts = { upcoming: upcoming.length, active: active.length, past: past.length, cancelled: cancelled.length };

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

  const fallbackImg = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80";

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

        {loading ? (
          <div className="mt-10 grid gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-card border border-rule animate-pulse" />
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
                          </div>
                          <div className="p-3 md:p-5 flex flex-row md:flex-col gap-2 md:gap-2 md:w-[180px]">
                            <button onClick={() => handleMessageOwner(b)} className="flex-1 md:w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition">
                              <MessageSquare className="w-3.5 h-3.5" /> Message
                            </button>
                            <button
                              onClick={() => toast.info?.("Reschedule coming soon") || toast("Reschedule coming soon")}
                              className="flex-1 md:w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                            >
                              Reschedule
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

            {/* ACTIVE RENTAL */}
            {activeTab === "active" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Active rental</h2>
                {active.length === 0 ? (
                  <EmptyState icon={<Clock className="w-5 h-5 text-accent" />} title="No active rental" body="When you move into a Rentora home, you'll see your lease here." />
                ) : (
                  active.map((b) => <ActiveRentalCard key={b._id} b={b} />)
                )}
              </section>
            )}

            {/* PAST STAYS */}
            {activeTab === "past" && (
              <section className="mt-8">
                <h2 className="font-display text-[24px]">Past stays</h2>
                {past.length === 0 ? (
                  <EmptyState icon={<Clock className="w-5 h-5 text-accent" />} title="No past stays yet" body="Homes you've lived in will appear here." />
                ) : (
                  <div className="mt-4 bg-card border border-rule rounded-3xl overflow-hidden">
                    {past.map((b, i) => (
                      <div
                        key={b._id}
                        className={`px-6 py-5 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-5 items-center ${
                          i !== past.length - 1 ? "border-b border-rule" : ""
                        }`}
                      >
                        <div>
                          <div className="font-medium">{b.property?.title || "Property"}</div>
                          <div className="text-[12px] text-[color:var(--muted)]">{b.property?.location?.locality}</div>
                        </div>
                        <div className="text-[13px] text-[color:var(--muted)]">
                          {formatDate(b.checkIn || b.createdAt)}
                          {b.checkOut ? ` – ${formatDate(b.checkOut)}` : ""}
                        </div>
                        <div className="text-[13px] text-[color:var(--muted)]">
                          {b.priceQuoted ? fmtINR(b.priceQuoted) : "—"}
                        </div>
                        <div>
                          <button className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-card border border-rule text-[13px] hover:border-ink transition">
                            Write a review
                          </button>
                        </div>
                      </div>
                    ))}
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

function ActiveRentalCard({ b }) {
  const moveIn = b.checkIn ? new Date(b.checkIn) : null;
  const end = b.checkOut ? new Date(b.checkOut) : null;
  const now = new Date();

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
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition">
            Pay rent{b.priceQuoted ? ` · ${fmtINR(b.priceQuoted)}` : ""}
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition">
            Download agreement
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition">
            Raise issue
          </button>
        </div>
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

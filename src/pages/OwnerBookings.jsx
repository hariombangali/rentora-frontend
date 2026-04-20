import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { toast } from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";
import { X, MapPin, Calendar, MessageSquare, Clock } from "lucide-react";
import { STATUS_CHIP } from "./MyBookings";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const formatDateShort = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) : "—");

const TABS = [
  { k: "pending",  label: "Pending" },
  { k: "upcoming", label: "Upcoming visits" },
  { k: "active",   label: "Active rentals" },
  { k: "history",  label: "History" },
];

export default function OwnerBookings() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");

  const [approveTarget, setApproveTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [resTarget, setResTarget] = useState(null);
  const [resDate, setResDate] = useState("");
  const [resSlot, setResSlot] = useState("");
  const [resReason, setResReason] = useState("");
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }),
    []
  );

  useEffect(() => {
    API.get("/bookings/owner", authHeader)
      .then((res) => setBookings(res.data || []))
      .catch(() => toast.error("Failed to load booking requests"))
      .finally(() => setLoading(false));
  }, [authHeader]);

  useEffect(() => {
    if (!resTarget || !resDate) return;
    setLoadingSlots(true);
    API.get("/visits/availability", { params: { propertyId: resTarget.property?._id, date: resDate } })
      .then((r) => setSlots(r.data?.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [resTarget, resDate]);

  const refreshOne = (updated) => setBookings((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));

  const approve = async () => {
    if (!approveTarget) return;
    try {
      const res = await API.patch(`/bookings/${approveTarget}/approve`, {}, authHeader);
      refreshOne(res.data);
      toast.success("Booking approved");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to approve");
    } finally {
      setApproveTarget(null);
    }
  };

  const submitReject = async () => {
    if (!rejectTarget) return;
    try {
      const res = await API.patch(`/bookings/${rejectTarget}/reject`, { reason: rejectReason }, authHeader);
      refreshOne(res.data);
      toast.success("Booking rejected");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reject");
    } finally {
      setRejectTarget(null);
      setRejectReason("");
    }
  };

  const cancel = async () => {
    if (!cancelTarget) return;
    try {
      const res = await API.patch(`/bookings/${cancelTarget}/cancel`, {}, authHeader);
      refreshOne(res.data);
      toast.success("Booking cancelled");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to cancel");
    } finally {
      setCancelTarget(null);
    }
  };

  const messageSeeker = async (b) => {
    try {
      const res = await API.get("/messages/conversations", {
        params: { propertyId: b.property?._id, partnerId: b.user?._id },
        ...authHeader,
      });
      navigate("/inbox", { state: { conversation: res.data } });
    } catch {
      toast.error("Could not open chat");
    }
  };

  const openReschedule = (b) => {
    setResTarget(b); setResDate(""); setResSlot(""); setResReason(""); setSlots([]);
  };

  const submitReschedule = async () => {
    if (!resTarget || !resDate || !resSlot) return;
    setRescheduling(true);
    try {
      const res = await API.patch(
        `/bookings/${resTarget._id}/reschedule`,
        { date: resDate, slot: resSlot, reason: resReason },
        authHeader
      );
      refreshOne(res.data);
      toast.success("Visit rescheduled");
      setResTarget(null);
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to reschedule");
    } finally {
      setRescheduling(false);
    }
  };

  const isVisit  = (b) => b.type === "visit";
  const isLead   = (b) => b.type === "lead";
  const isRental = (b) => b.type === "rental";

  // Partition
  const now = Date.now();
  const pending  = bookings.filter((b) => b.status === "pending");
  const upcoming = bookings.filter((b) => isVisit(b) && ["approved", "rescheduled"].includes(b.status) && new Date(b.visitDate).getTime() >= now - 24*3600*1000);
  const active   = bookings.filter((b) => isRental(b) && ["approved", "pending"].includes(b.status));
  const history  = bookings.filter((b) => ["rejected", "cancelled", "completed"].includes(b.status) || (isVisit(b) && ["approved","rescheduled"].includes(b.status) && new Date(b.visitDate).getTime() < now - 24*3600*1000));

  const counts = { pending: pending.length, upcoming: upcoming.length, active: active.length, history: history.length };
  const visible = tab === "pending" ? pending : tab === "upcoming" ? upcoming : tab === "active" ? active : history;

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1280px] mx-auto px-5 md:px-6 pt-8 pb-24">
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <Link to="/owner" className="hover:text-ink">Dashboard</Link>
          <span>·</span>
          <span>Visit requests</span>
        </div>

        <p className="font-eyebrow text-[color:var(--muted)] mt-4">
          {counts.pending} pending · {counts.upcoming} upcoming
        </p>
        <h1 className="font-display text-[40px] md:text-[56px] leading-[1] mt-2 tracking-[-0.02em]">
          Visit requests.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-[color:var(--muted)]">
          Review visits, leads, and rental requests from prospective tenants.
        </p>

        {/* Tabs */}
        <div className="mt-7 inline-flex bg-card border border-rule rounded-full p-1 gap-0.5 overflow-x-auto max-w-full">
          {TABS.map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 md:px-5 py-2 rounded-full text-[13px] font-medium whitespace-nowrap transition ${
                tab === t.k ? "bg-ink text-paper" : "text-[color:var(--muted)] hover:text-ink"
              }`}
            >
              {t.label}{counts[t.k] > 0 ? ` · ${counts[t.k]}` : ""}
            </button>
          ))}
        </div>

        {/* Confirms */}
        <ConfirmModal
          isOpen={!!approveTarget}
          title="Approve request"
          message="The tenant will be notified by email and the booking will move to their active list."
          confirmLabel="Approve"
          confirmClass="bg-ink hover:bg-accent"
          onConfirm={approve}
          onCancel={() => setApproveTarget(null)}
        />
        <ConfirmModal
          isOpen={!!cancelTarget}
          title="Cancel booking"
          message="Cancel this booking request?"
          confirmLabel="Yes, cancel"
          onConfirm={cancel}
          onCancel={() => setCancelTarget(null)}
        />

        {/* Reject modal */}
        {rejectTarget && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setRejectTarget(null)}>
            <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[22px]">Reject booking</h3>
                <button onClick={() => setRejectTarget(null)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Reason (optional)</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Let the tenant know why…"
                className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
              />
              <div className="mt-4 flex justify-end gap-3">
                <button onClick={() => setRejectTarget(null)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink">
                  Cancel
                </button>
                <button
                  onClick={submitReject}
                  className="inline-flex items-center px-5 py-2.5 rounded-full text-paper text-sm font-medium"
                  style={{ background: "oklch(0.62 0.15 25)" }}
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule modal */}
        {resTarget && (
          <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setResTarget(null)}>
            <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-[22px]">Reschedule visit</h3>
                <button onClick={() => setResTarget(null)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">New date</label>
                  <input
                    type="date"
                    value={resDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => { setResDate(e.target.value); setResSlot(""); }}
                    className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                  />
                </div>
                {resDate && (
                  <div>
                    <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">Available time slots</label>
                    {loadingSlots ? (
                      <span className="text-[13px] text-[color:var(--muted)]">Loading slots…</span>
                    ) : slots.length ? (
                      <div className="flex flex-wrap gap-2">
                        {slots.map((s) => (
                          <button
                            key={s.id || s.time}
                            disabled={s.full}
                            onClick={() => setResSlot(s.time)}
                            className={`px-3.5 py-1.5 rounded-full text-[13px] border transition ${
                              resSlot === s.time ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
                            } ${s.full ? "opacity-40 cursor-not-allowed" : ""}`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[13px] text-[color:var(--muted)]">No slots for this date</span>
                    )}
                  </div>
                )}
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Reason (optional)</label>
                  <input
                    value={resReason}
                    onChange={(e) => setResReason(e.target.value)}
                    placeholder="Why is this being rescheduled?"
                    className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button onClick={() => setResTarget(null)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink">
                  Cancel
                </button>
                <button
                  onClick={submitReschedule}
                  disabled={rescheduling || !resDate || !resSlot}
                  className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent disabled:opacity-50"
                >
                  {rescheduling ? "Saving…" : "Confirm reschedule"}
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="mt-8 grid gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-card border border-rule animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-8 bg-card border border-rule rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display text-[20px]">No {TABS.find((t) => t.k === tab)?.label.toLowerCase()} requests</h3>
            <p className="text-[14px] text-[color:var(--muted)] mt-1 max-w-sm mx-auto">
              When a tenant books a visit or sends an enquiry, you'll see it here.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3.5">
            {visible.map((b) => {
              const chip = STATUS_CHIP[b.status] || STATUS_CHIP.pending;
              return (
                <div key={b._id} className="bg-card border border-rule rounded-3xl p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium"
                          style={{ background: chip.bg, color: chip.color }}
                        >
                          {chip.label}
                        </span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] bg-paper border border-rule text-[color:var(--muted)]">
                          {b.type === "visit" ? "Visit" : b.type === "rental" ? "Rental" : b.type === "lead" ? "Enquiry" : b.type}
                        </span>
                      </div>
                      <h3 className="font-semibold text-[18px] mt-2">{b.property?.title || "Property"}</h3>
                      <div className="text-[13px] text-[color:var(--muted)] mt-0.5 flex items-center gap-1 flex-wrap">
                        <MapPin className="w-3.5 h-3.5" />
                        {b.property?.address || "Indore"}
                        {b.user?.name && <> · from <span className="text-ink">{b.user.name}</span></>}
                        {b.user?.email && <> · {b.user.email}</>}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
                        {isVisit(b) && (
                          <>
                            <Meta label="Date" value={formatDateShort(b.visitDate)} />
                            <Meta label="Time" value={b.visitSlot || "—"} />
                          </>
                        )}
                        {isRental(b) && (
                          <>
                            <Meta label="Check-in" value={formatDate(b.checkIn)} />
                            {b.checkOut && <Meta label="Check-out" value={formatDate(b.checkOut)} />}
                            {b.priceQuoted && <Meta label="Rent" value={`₹${b.priceQuoted.toLocaleString("en-IN")}/mo`} />}
                          </>
                        )}
                        {isLead(b) && <Meta label="Type" value="Enquiry" />}
                      </div>
                      {b.status === "rescheduled" && b.reschedule?.date && (
                        <div className="mt-3 bg-[oklch(0.94_0.05_80)] border border-rule rounded-2xl px-3 py-2 text-[13px]">
                          <span className="font-medium">Rescheduled to: </span>
                          {formatDate(b.reschedule.date)} · {b.reschedule.slot}
                          {b.reschedule.reason && <div className="text-[12px] mt-0.5 text-[color:var(--muted)]">{b.reschedule.reason}</div>}
                        </div>
                      )}
                      {b.message && (
                        <div className="mt-3 bg-paper border border-rule rounded-2xl px-3 py-2 text-[13px] whitespace-pre-wrap">
                          {b.message}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-[color:var(--muted)] shrink-0">
                      <Clock className="w-3 h-3 inline mr-0.5" />
                      {new Date(b.createdAt).toLocaleString("en-IN")}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {b.status === "pending" && (
                      <>
                        <button
                          onClick={() => setApproveTarget(b._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setRejectTarget(b._id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-rule text-[13px] font-medium hover:border-[color:var(--danger)] transition"
                          style={{ color: "oklch(0.62 0.15 25)" }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {isVisit(b) && !["cancelled", "completed", "rejected"].includes(b.status) && (
                      <button
                        onClick={() => openReschedule(b)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                      >
                        Reschedule
                      </button>
                    )}
                    {!["cancelled", "completed", "rejected"].includes(b.status) && (
                      <button
                        onClick={() => setCancelTarget(b._id)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-[color:var(--muted)] text-[13px] font-medium hover:border-ink hover:text-ink transition"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={() => messageSeeker(b)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Message
                    </button>
                  </div>
                </div>
              );
            })}
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

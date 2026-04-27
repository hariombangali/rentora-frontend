import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { toast } from "../utils/toast";
import {
  X, MapPin, Phone, Mail, User as UserIcon, Briefcase,
  Calendar, Users, IdCard, Shield, Check,
} from "lucide-react";
import { STATUS_CHIP } from "./MyBookings";

const fmtINR = (n) => (n == null ? "—" : "₹" + Number(n).toLocaleString("en-IN"));
const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const daysAgo = (d) => {
  if (!d) return "recently";
  const diff = Math.round((Date.now() - new Date(d).getTime()) / (24 * 3600 * 1000));
  if (diff <= 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
};

const TABS = [
  { k: "pending",   label: "Pending" },
  { k: "reviewing", label: "Reviewing" },
  { k: "approved",  label: "Approved" },
  { k: "rejected",  label: "Rejected" },
];

export default function OwnerApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [detail, setDetail] = useState(null);

  const [decision, setDecision] = useState(null); // { id, status } — for the note modal
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/applications/owner", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setApps(res.data || []))
      .catch(() => toast.error("Failed to load applications"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, reviewing: 0, approved: 0, rejected: 0, withdrawn: 0 };
    for (const a of apps) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [apps]);

  const filtered = useMemo(
    () => apps.filter((a) => a.status === tab).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [apps, tab]
  );

  const submitDecision = async () => {
    if (!decision) return;
    setWorking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(
        `/applications/${decision.id}/status`,
        { status: decision.status, ownerNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApps((prev) => prev.map((a) => (a._id === decision.id ? { ...a, ...res.data } : a)));
      if (detail?._id === decision.id) setDetail({ ...detail, ...res.data });
      toast.success(
        decision.status === "approved"
          ? "Approved — rental booking created"
          : decision.status === "rejected"
          ? "Application rejected"
          : "Marked as reviewing"
      );
      setDecision(null);
      setNote("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update");
    } finally {
      setWorking(false);
    }
  };

  const openDecision = (id, status) => {
    setDecision({ id, status });
    setNote("");
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1280px] mx-auto px-5 md:px-6 pt-8 pb-24">
        {/* Breadcrumb */}
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <Link to="/owner" className="hover:text-ink">Dashboard</Link>
          <span>·</span>
          <span>Applications</span>
        </div>

        <p className="font-eyebrow text-[color:var(--muted)] mt-4">
          {counts.pending} pending · {counts.reviewing} reviewing · {counts.approved} approved
        </p>
        <h1 className="font-display text-[40px] md:text-[56px] leading-[1] mt-2 tracking-[-0.02em]">
          Rental applications.
        </h1>
        <p className="mt-3 max-w-xl text-[15px] text-[color:var(--muted)]">
          Every application a prospective tenant sends lands here. Review the details, leave a note, and decide.
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

        {loading ? (
          <div className="mt-8 flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-rule rounded-3xl p-2 grid grid-cols-1 md:grid-cols-[120px_1fr_170px] gap-4 items-center animate-pulse">
                <div className="h-[96px] rounded-2xl bg-[#e8e2d3]" />
                <div className="px-3 md:px-0 py-3 space-y-2.5">
                  <div className="h-5 w-20 rounded-full bg-[#e8e2d3]" />
                  <div className="h-5 w-3/4 rounded-full bg-[#e8e2d3]" />
                  <div className="h-4 w-1/2 rounded-full bg-[#e8e2d3]" />
                  <div className="flex gap-3 pt-1">
                    <div className="h-3 w-24 rounded-full bg-[#e8e2d3]" />
                    <div className="h-3 w-16 rounded-full bg-[#e8e2d3]" />
                    <div className="h-3 w-20 rounded-full bg-[#e8e2d3]" />
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-9 w-full rounded-full bg-[#e8e2d3]" />
                  <div className="flex gap-2">
                    <div className="h-9 flex-1 rounded-full bg-[#e8e2d3]" />
                    <div className="h-9 flex-1 rounded-full bg-[#e8e2d3]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-8 bg-card border border-rule rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center mx-auto mb-4">
              <UserIcon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display text-[20px]">No {tab} applications</h3>
            <p className="text-[14px] text-[color:var(--muted)] mt-1 max-w-sm mx-auto">
              {tab === "pending"
                ? "New applications will show up here — they typically take 24 hours to arrive."
                : `You have no applications in the ${tab} state.`}
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3.5">
            {filtered.map((a) => <ApplicationCard key={a._id} a={a} onOpen={() => setDetail(a)} onDecide={openDecision} />)}
          </div>
        )}
      </div>

      {detail && (
        <DetailDrawer
          app={detail}
          onClose={() => setDetail(null)}
          onDecide={openDecision}
        />
      )}

      {decision && (
        <DecisionModal
          decision={decision}
          note={note}
          setNote={setNote}
          working={working}
          onSubmit={submitDecision}
          onCancel={() => { setDecision(null); setNote(""); }}
        />
      )}
    </div>
  );
}

function ApplicationCard({ a, onOpen, onDecide }) {
  const status = STATUS_CHIP[a.status] || STATUS_CHIP.pending;
  const img = a.property?.images?.[0] || "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80";
  const isPending = a.status === "pending" || a.status === "reviewing";

  return (
    <article className="bg-card border border-rule rounded-3xl p-2 grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-4 items-center">
      <button onClick={onOpen} className="block">
        <img src={img} alt="" className="w-full h-[96px] md:h-[96px] object-cover rounded-2xl" />
      </button>
      <button onClick={onOpen} className="text-left px-3 md:px-0 py-3">
        <span
          className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium"
          style={{ background: status.bg, color: status.color }}
        >
          {status.label}
        </span>
        <div className="font-semibold text-[17px] mt-2">
          {a.name} <span className="text-[color:var(--muted)] font-normal text-[14px]">· {a.occupation}</span>
        </div>
        <div className="text-[13px] text-[color:var(--muted)] mt-0.5 flex items-center gap-1 flex-wrap">
          <MapPin className="w-3.5 h-3.5" />
          {a.property?.title} · {a.property?.location?.locality}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-[color:var(--muted)]">
          <span>Move-in {fmtDate(a.moveInDate)}</span>
          <span>· {a.duration}</span>
          <span>· {a.occupantCount} {a.occupantType}</span>
          <span>· Applied {daysAgo(a.createdAt)}</span>
        </div>
      </button>
      <div className="p-3 md:p-4 flex flex-row md:flex-col gap-2 md:w-[170px]">
        <button onClick={onOpen} className="flex-1 md:w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition">
          View details
        </button>
        {isPending && (
          <div className="flex-1 md:w-full flex gap-2">
            <button
              onClick={() => onDecide(a._id, "approved")}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-full bg-ink text-paper text-[12px] font-medium hover:bg-accent transition"
            >
              Approve
            </button>
            <button
              onClick={() => onDecide(a._id, "rejected")}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-full border border-rule text-[color:var(--danger)] text-[12px] font-medium hover:border-[color:var(--danger)] transition"
              style={{ color: "oklch(0.62 0.15 25)" }}
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

function DetailDrawer({ app, onClose, onDecide }) {
  return (
    <div className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm flex items-end md:items-stretch md:justify-end" onClick={onClose}>
      <div
        className="bg-card w-full md:max-w-[520px] h-[92vh] md:h-full rounded-t-3xl md:rounded-none flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 md:px-7 pt-5 pb-4 border-b border-rule flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Application · {daysAgo(app.createdAt)}</p>
            <h2 className="font-display text-[22px] md:text-[28px] mt-1">{app.name}</h2>
            <p className="text-[13px] text-[color:var(--muted)] truncate">{app.property?.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-paper hover:bg-rule flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 space-y-5">
          <Section title="Applicant" icon={<UserIcon className="w-4 h-4" />}>
            <Row k="Name" v={app.name} />
            <Row k="Phone" v={<a href={`tel:${app.phone}`} className="text-ink hover:text-accent"><Phone className="w-3.5 h-3.5 inline mr-1" />{app.phone}</a>} />
            <Row k="Email" v={<a href={`mailto:${app.email}`} className="text-ink hover:text-accent"><Mail className="w-3.5 h-3.5 inline mr-1" />{app.email}</a>} />
            <Row k="Occupation" v={`${app.occupation}${app.employer ? ` · ${app.employer}` : ""}`} />
            {app.monthlyIncome ? <Row k="Income" v={fmtINR(app.monthlyIncome) + "/mo"} /> : null}
          </Section>

          <Section title="Tenancy" icon={<Calendar className="w-4 h-4" />}>
            <Row k="Move-in" v={fmtDate(app.moveInDate)} />
            <Row k="Duration" v={app.duration} />
          </Section>

          <Section title="Occupants" icon={<Users className="w-4 h-4" />}>
            <Row k="People" v={`${app.occupantCount} · ${app.occupantType}`} />
            <Row k="Pets" v={app.hasPets ? "Yes" : "No"} />
          </Section>

          <Section title="Verification" icon={<IdCard className="w-4 h-4" />}>
            <Row k={app.idType} v={app.idNumber} />
            {app.previousAddress && <Row k="Prev. address" v={app.previousAddress} />}
            {app.referenceName && <Row k="Reference" v={`${app.referenceName}${app.referencePhone ? ` · ${app.referencePhone}` : ""}`} />}
          </Section>

          {app.aboutMe && (
            <Section title="About me" icon={<Briefcase className="w-4 h-4" />}>
              <p className="text-[14px] leading-relaxed text-ink">{app.aboutMe}</p>
            </Section>
          )}

          {app.ownerNote && (
            <Section title="Your note" icon={<Shield className="w-4 h-4" />}>
              <p className="text-[14px] leading-relaxed text-ink">{app.ownerNote}</p>
            </Section>
          )}

          {app.status === "approved" && app.booking && (
            <div className="rounded-2xl bg-[oklch(0.96_0.03_150)] border border-rule p-4 flex items-start gap-3">
              <Check className="w-4 h-4 mt-0.5 text-sage" />
              <div className="text-[13px]">
                <div className="font-medium text-ink">Rental booking created</div>
                <p className="text-[color:var(--muted)] mt-0.5">
                  Check-in {fmtDate(app.booking.checkIn)} · Rent {fmtINR(app.booking.priceQuoted)}/mo
                </p>
              </div>
            </div>
          )}
        </div>

        {(app.status === "pending" || app.status === "reviewing") && (
          <div className="px-5 md:px-7 py-4 border-t border-rule flex gap-2 bg-card">
            {app.status === "pending" && (
              <button
                onClick={() => onDecide(app._id, "reviewing")}
                className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
              >
                Mark reviewing
              </button>
            )}
            <button
              onClick={() => onDecide(app._id, "rejected")}
              className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-rule text-[13px] font-medium hover:border-[color:var(--danger)] transition"
              style={{ color: "oklch(0.62 0.15 25)" }}
            >
              Reject
            </button>
            <button
              onClick={() => onDecide(app._id, "approved")}
              className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 text-[color:var(--muted)]">
        {icon}
        <span className="font-eyebrow text-[10px]">{title}</span>
      </div>
      <div className="bg-paper border border-rule rounded-2xl p-4 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-3 text-[13px]">
      <span className="text-[color:var(--muted)] w-28 shrink-0">{k}</span>
      <span className="text-ink break-words min-w-0 flex-1">{v || "—"}</span>
    </div>
  );
}

function DecisionModal({ decision, note, setNote, working, onSubmit, onCancel }) {
  const labels = {
    approved: { title: "Approve application", cta: "Approve & create rental", desc: "A rental booking will be created automatically so the tenant can move in on the agreed date." },
    rejected: { title: "Reject application", cta: "Reject application", desc: "The applicant will be notified by email. A short reason helps them improve next time." },
    reviewing: { title: "Mark as reviewing", cta: "Save", desc: "Let the tenant know you're looking at their application." },
  };
  const label = labels[decision.status] || labels.reviewing;
  const isApprove = decision.status === "approved";
  const isReject = decision.status === "rejected";

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={onCancel}>
      <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-[22px]">{label.title}</h3>
          <button onClick={onCancel} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-[color:var(--muted)] mb-4">{label.desc}</p>
        <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">
          Note to applicant {isReject ? "(recommended)" : "(optional)"}
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={isApprove ? "Welcome! Let's proceed with the move-in steps…" : isReject ? "Unfortunately we chose another applicant because…" : "Reviewing your application…"}
          className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
        />
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={working}
            className={`inline-flex items-center px-5 py-2.5 rounded-full text-paper text-sm font-medium disabled:opacity-50 ${
              isReject ? "" : "bg-ink hover:bg-accent"
            }`}
            style={isReject ? { background: "oklch(0.62 0.15 25)" } : undefined}
          >
            {working ? "Saving…" : label.cta}
          </button>
        </div>
      </div>
    </div>
  );
}

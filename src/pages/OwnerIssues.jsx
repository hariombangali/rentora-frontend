import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { toast } from "../utils/toast";
import { X, Wrench, MapPin } from "lucide-react";

const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const daysAgo = (d) => {
  if (!d) return "recently";
  const diff = Math.round((Date.now() - new Date(d).getTime()) / (24 * 3600 * 1000));
  if (diff <= 0) return "today";
  if (diff === 1) return "1 day ago";
  return `${diff} days ago`;
};

const STATUS_STYLE = {
  open:          { bg: "oklch(0.95 0.04 25)",  color: "oklch(0.5 0.15 25)",  label: "Open" },
  acknowledged:  { bg: "oklch(0.94 0.05 80)",  color: "oklch(0.45 0.12 60)", label: "Acknowledged" },
  in_progress:   { bg: "oklch(0.94 0.05 80)",  color: "oklch(0.45 0.12 60)", label: "In progress" },
  resolved:      { bg: "oklch(0.94 0.06 150)", color: "oklch(0.45 0.1 150)", label: "Resolved" },
  closed:        { bg: "var(--rule)",          color: "var(--ink-soft)",    label: "Closed" },
};

const PRIORITY_STYLE = {
  high:   { bg: "oklch(0.95 0.04 25)",  color: "oklch(0.5 0.15 25)" },
  medium: { bg: "oklch(0.96 0.02 80)",  color: "var(--accent)" },
  low:    { bg: "var(--chip-bg)",       color: "var(--ink-soft)" },
};

const TABS = [
  { k: "open", label: "Open", filter: (i) => ["open", "acknowledged", "in_progress"].includes(i.status) },
  { k: "resolved", label: "Resolved", filter: (i) => i.status === "resolved" },
  { k: "closed", label: "Closed", filter: (i) => i.status === "closed" },
];

export default function OwnerIssues() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("open");
  const [decision, setDecision] = useState(null); // { id, status }
  const [note, setNote] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/issues/owner", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setItems(res.data || []))
      .catch(() => toast.error("Failed to load issues"))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { open: 0, resolved: 0, closed: 0 };
    for (const i of items) {
      if (["open", "acknowledged", "in_progress"].includes(i.status)) c.open++;
      else if (i.status === "resolved") c.resolved++;
      else if (i.status === "closed") c.closed++;
    }
    return c;
  }, [items]);

  const visible = useMemo(() => {
    const t = TABS.find((x) => x.k === tab);
    return items.filter(t.filter).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [items, tab]);

  const openDecision = (id, status) => { setDecision({ id, status }); setNote(""); };

  const submit = async () => {
    if (!decision) return;
    setWorking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(
        `/issues/${decision.id}/status`,
        { status: decision.status, ownerNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prev) => prev.map((i) => (i._id === decision.id ? { ...i, ...res.data } : i)));
      toast.success("Issue updated");
      setDecision(null);
      setNote("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setWorking(false);
    }
  };

  const nextActions = (status) => {
    if (status === "open") return [
      { k: "acknowledged", label: "Acknowledge", primary: false },
      { k: "in_progress",  label: "Start fixing", primary: true },
    ];
    if (status === "acknowledged") return [
      { k: "in_progress", label: "Start fixing", primary: true },
      { k: "resolved",    label: "Mark resolved", primary: false },
    ];
    if (status === "in_progress") return [
      { k: "resolved", label: "Mark resolved", primary: true },
    ];
    if (status === "resolved") return [
      { k: "closed", label: "Close", primary: false },
    ];
    return [];
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="max-w-[1280px] mx-auto px-5 md:px-6 pt-8 pb-24">
        <div className="text-[13px] text-[color:var(--muted)] flex items-center gap-2">
          <Link to="/" className="hover:text-ink">Home</Link>
          <span>·</span>
          <Link to="/owner" className="hover:text-ink">Dashboard</Link>
          <span>·</span>
          <span>Maintenance</span>
        </div>

        <p className="font-eyebrow text-[color:var(--muted)] mt-4">
          {counts.open} open · {counts.resolved} resolved
        </p>
        <h1 className="font-display text-[40px] md:text-[56px] leading-[1] mt-2 tracking-[-0.02em]">Maintenance.</h1>
        <p className="mt-3 max-w-xl text-[15px] text-[color:var(--muted)]">
          Every issue your tenants raise shows up here. Acknowledge, update progress, and mark resolved.
        </p>

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
          <div className="mt-8 grid gap-4">
            {[...Array(2)].map((_, i) => <div key={i} className="h-32 rounded-3xl bg-card border border-rule animate-pulse" />)}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-8 bg-card border border-rule rounded-3xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-[oklch(0.96_0.02_80)] flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-display text-[20px]">No {tab === "open" ? "open" : tab} issues</h3>
            <p className="text-[14px] text-[color:var(--muted)] mt-1 max-w-sm mx-auto">
              Tenants can raise maintenance requests from their active rental card. They'll show up here.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3.5">
            {visible.map((i) => {
              const st = STATUS_STYLE[i.status] || STATUS_STYLE.open;
              const pr = PRIORITY_STYLE[i.priority] || PRIORITY_STYLE.medium;
              return (
                <article key={i._id} className="bg-card border border-rule rounded-3xl p-5 md:p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: pr.bg, color: pr.color }}>{i.priority} priority</span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] bg-paper border border-rule text-[color:var(--muted)]">{i.category}</span>
                      </div>
                      <div className="font-semibold text-[17px] mt-2 flex items-center gap-2">
                        {i.property?.title || "Property"}
                      </div>
                      <div className="text-[13px] text-[color:var(--muted)] mt-0.5 flex items-center gap-1 flex-wrap">
                        <MapPin className="w-3.5 h-3.5" />
                        {i.property?.location?.locality}, {i.property?.location?.city || "Indore"}
                        {i.tenant?.name && <> · from <span className="text-ink">{i.tenant.name}</span></>}
                        · raised {daysAgo(i.createdAt)}
                      </div>
                      <p className="mt-3 bg-paper border border-rule rounded-2xl px-3 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
                        {i.description}
                      </p>
                      {i.ownerNote && (
                        <p className="mt-2 text-[13px] text-[color:var(--muted)]">
                          <b className="text-ink">Your note:</b> {i.ownerNote}
                        </p>
                      )}
                      {i.resolvedAt && (
                        <p className="mt-2 text-[12px] text-[color:var(--muted)]">Resolved on {fmtDate(i.resolvedAt)}</p>
                      )}
                    </div>
                  </div>

                  {nextActions(i.status).length > 0 && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {nextActions(i.status).map((a) => (
                        <button
                          key={a.k}
                          onClick={() => openDecision(i._id, a.k)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition ${
                            a.primary
                              ? "bg-ink text-paper hover:bg-accent"
                              : "bg-card border border-rule text-ink hover:border-ink"
                          }`}
                        >
                          {a.label}
                        </button>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      {decision && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setDecision(null)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[22px]">
                {STATUS_STYLE[decision.status]?.label || decision.status}
              </h3>
              <button onClick={() => setDecision(null)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Note to tenant (optional)</label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={decision.status === "resolved" ? "Plumber visited today and replaced the washer." : "Electrician will come tomorrow at 11 AM."}
              className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
            />
            <div className="mt-4 flex justify-end gap-3">
              <button onClick={() => setDecision(null)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink">Cancel</button>
              <button onClick={submit} disabled={working} className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent disabled:opacity-50">
                {working ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

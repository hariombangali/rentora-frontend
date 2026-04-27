import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { io } from "socket.io-client";
import API from "../services/api";
import { toast } from "../utils/toast";
import { X, Wrench, MapPin, Calendar, Send, MessageCircle, RefreshCcw } from "lucide-react";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace("/api", "");

const fmtDate = (d) =>
  !d ? "—" : new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const fmtDateTime = (d) =>
  !d ? "—" : new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
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
  const [scheduleTarget, setScheduleTarget] = useState(null); // issue
  const [scheduleValue, setScheduleValue] = useState("");
  const [thread, setThread] = useState(null); // issue obj
  const [threadText, setThreadText] = useState("");
  const [threadSending, setThreadSending] = useState(false);
  const [lightbox, setLightbox] = useState(null); // {images, idx}

  useEffect(() => {
    const token = localStorage.getItem("token");
    API.get("/issues/owner", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setItems(res.data || []))
      .catch(() => toast.error("Failed to load issues"))
      .finally(() => setLoading(false));
  }, []);

  // Live updates: refresh local state when the tenant adds a comment, confirms, or reopens.
  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    const socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });

    const handleUpdate = (updated) => {
      if (!updated?._id) return;
      setItems((prev) => {
        const idx = prev.findIndex((it) => it._id === updated._id);
        if (idx === -1) return [updated, ...prev];
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
      setThread((prev) => (prev && prev._id === updated._id ? updated : prev));
    };

    socket.on("issue:updated", handleUpdate);
    return () => {
      socket.off("issue:updated", handleUpdate);
      socket.disconnect();
    };
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

  const submitDecision = async () => {
    if (!decision) return;
    setWorking(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.patch(
        `/issues/${decision.id}/status`,
        { status: decision.status, ownerNote: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prev) => prev.map((i) => (i._id === decision.id ? res.data : i)));
      if (thread?._id === decision.id) setThread(res.data);
      toast.success("Issue updated");
      setDecision(null);
      setNote("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setWorking(false);
    }
  };

  const openSchedule = (issue) => {
    setScheduleTarget(issue);
    if (issue.scheduledFor) {
      const d = new Date(issue.scheduledFor);
      const off = d.getTimezoneOffset();
      const local = new Date(d.getTime() - off * 60000);
      setScheduleValue(local.toISOString().slice(0, 16));
    } else {
      setScheduleValue("");
    }
  };

  const submitSchedule = async () => {
    if (!scheduleTarget) return;
    setWorking(true);
    try {
      const token = localStorage.getItem("token");
      const iso = scheduleValue ? new Date(scheduleValue).toISOString() : null;
      const res = await API.patch(
        `/issues/${scheduleTarget._id}/schedule`,
        { scheduledFor: iso },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prev) => prev.map((i) => (i._id === scheduleTarget._id ? res.data : i)));
      if (thread?._id === scheduleTarget._id) setThread(res.data);
      toast.success(iso ? "Visit scheduled" : "Schedule cleared");
      setScheduleTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setWorking(false);
    }
  };

  const submitComment = async () => {
    if (!thread || !threadText.trim()) return;
    setThreadSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/issues/${thread._id}/comments`,
        { text: threadText.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setItems((prev) => prev.map((i) => (i._id === thread._id ? res.data : i)));
      setThread(res.data);
      setThreadText("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setThreadSending(false);
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
          Every issue your tenants raise shows up here. Schedule visits, chat, and mark resolved.
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
          <div className="mt-8 flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-card border border-rule rounded-3xl p-5 md:p-6 animate-pulse space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <div className="h-6 w-20 rounded-full bg-[#e8e2d3]" />
                  <div className="h-6 w-16 rounded-full bg-[#e8e2d3]" />
                  <div className="h-6 w-24 rounded-full bg-[#e8e2d3]" />
                </div>
                <div className="h-5 w-2/3 rounded-full bg-[#e8e2d3]" />
                <div className="h-4 w-1/2 rounded-full bg-[#e8e2d3]" />
                <div className="h-16 rounded-2xl bg-[#e8e2d3]" />
                <div className="flex gap-2">
                  <div className="h-9 w-32 rounded-full bg-[#e8e2d3]" />
                  <div className="h-9 w-28 rounded-full bg-[#e8e2d3]" />
                </div>
              </div>
            ))}
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
              const upcoming = i.scheduledFor && new Date(i.scheduledFor).getTime() > Date.now() - 24 * 3600 * 1000;
              return (
                <article key={i._id} className="bg-card border border-rule rounded-3xl p-5 md:p-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[11px] font-medium" style={{ background: pr.bg, color: pr.color }}>{i.priority} priority</span>
                        <span className="inline-flex items-center rounded-full px-3 py-1 text-[12px] bg-paper border border-rule text-[color:var(--muted)]">{i.category}</span>
                        {i.reopenCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium bg-amber-50 text-amber-700">
                            <RefreshCcw className="w-3 h-3" /> Reopened {i.reopenCount}×
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-[17px] mt-2">{i.property?.title || "Property"}</div>
                      <div className="text-[13px] text-[color:var(--muted)] mt-0.5 flex items-center gap-1 flex-wrap">
                        <MapPin className="w-3.5 h-3.5" />
                        {i.property?.location?.locality}, {i.property?.location?.city || "Indore"}
                        {i.tenant?.name && <> · from <span className="text-ink">{i.tenant.name}</span></>}
                        · raised {daysAgo(i.createdAt)}
                      </div>

                      <p className="mt-3 bg-paper border border-rule rounded-2xl px-3 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
                        {i.description}
                      </p>

                      {/* Images */}
                      {i.images?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {i.images.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => setLightbox({ images: i.images, idx })}
                              className="w-20 h-20 rounded-xl overflow-hidden border border-rule hover:border-ink transition"
                            >
                              <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Schedule banner */}
                      {i.scheduledFor && (
                        <div className={`mt-3 rounded-2xl border px-3 py-2.5 text-[13px] flex items-center gap-2 flex-wrap ${
                          upcoming ? "bg-[oklch(0.96_0.02_80)] border-rule text-ink" : "bg-paper border-rule text-[color:var(--muted)]"
                        }`}>
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>Scheduled for <b className="text-ink">{fmtDateTime(i.scheduledFor)}</b></span>
                        </div>
                      )}

                      {i.ownerNote && (
                        <p className="mt-2 text-[13px] text-[color:var(--muted)]">
                          <b className="text-ink">Your note:</b> {i.ownerNote}
                        </p>
                      )}
                      {i.resolvedAt && (
                        <p className="mt-2 text-[12px] text-[color:var(--muted)]">
                          Resolved on {fmtDate(i.resolvedAt)}
                          {i.tenantConfirmedAt && <> · Tenant confirmed {fmtDate(i.tenantConfirmedAt)}</>}
                        </p>
                      )}
                      {i.status === "resolved" && i.awaitingTenantConfirm && (
                        <p className="mt-2 text-[12px] text-amber-700">Waiting for tenant to confirm the fix.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
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
                    {["acknowledged", "in_progress"].includes(i.status) && (
                      <button
                        onClick={() => openSchedule(i)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {i.scheduledFor ? "Reschedule" : "Schedule visit"}
                      </button>
                    )}
                    <button
                      onClick={() => setThread(i)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Conversation
                      {i.comments?.length > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-paper text-[10px] font-semibold">
                          {i.comments.length}
                        </span>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision (status change) modal */}
      {decision && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setDecision(null)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[22px]">{STATUS_STYLE[decision.status]?.label || decision.status}</h3>
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
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setDecision(null)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">Cancel</button>
              <button onClick={submitDecision} disabled={working} className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50">
                {working ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule modal */}
      {scheduleTarget && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm grid place-items-center px-4" onClick={() => setScheduleTarget(null)}>
          <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-card-hover" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-[22px]">Schedule visit</h3>
              <button onClick={() => setScheduleTarget(null)} className="w-8 h-8 rounded-full hover:bg-paper flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[13px] text-[color:var(--muted)] mb-4">When will you (or someone you send) show up to fix this?</p>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Date &amp; time</label>
            <input
              type="datetime-local"
              value={scheduleValue}
              onChange={(e) => setScheduleValue(e.target.value)}
              min={new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink"
            />
            <div className="mt-4 flex items-center justify-between gap-2">
              {scheduleTarget.scheduledFor && (
                <button
                  onClick={() => { setScheduleValue(""); }}
                  className="text-[13px] text-[color:var(--muted)] hover:text-ink underline underline-offset-2"
                >
                  Clear
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button onClick={() => setScheduleTarget(null)} className="inline-flex items-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">Cancel</button>
                <button onClick={submitSchedule} disabled={working} className="inline-flex items-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50">
                  {working ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversation drawer */}
      {thread && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-stretch md:justify-end" onClick={() => setThread(null)}>
          <div className="bg-card w-full md:max-w-md h-[88vh] md:h-full rounded-t-3xl md:rounded-none flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-rule flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Conversation</p>
                <h3 className="font-display text-[20px] truncate">{thread.category} · {thread.property?.title}</h3>
                <p className="text-[12px] text-[color:var(--muted)] truncate">with {thread.tenant?.name || "tenant"}</p>
              </div>
              <button onClick={() => setThread(null)} className="w-9 h-9 rounded-full hover:bg-paper flex items-center justify-center shrink-0"><X className="w-4 h-4" /></button>
            </div>
            <CommentList comments={thread.comments || []} viewerRole="owner" tenantName={thread.tenant?.name} />
            <CommentBox value={threadText} setValue={setThreadText} onSend={submitComment} sending={threadSending} />
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-ink/90 grid place-items-center p-4" onClick={() => setLightbox(null)}>
          <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-paper/10 text-paper flex items-center justify-center hover:bg-paper/20">
            <X className="w-5 h-5" />
          </button>
          <img src={lightbox.images[lightbox.idx]} alt="" className="max-w-full max-h-[88vh] object-contain rounded-2xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function CommentList({ comments, viewerRole, tenantName }) {
  const scrollerRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    });
  }, [comments.length]);

  if (!comments.length) {
    return (
      <div className="flex-1 flex items-center justify-center px-6 text-center">
        <p className="text-[13px] text-[color:var(--muted)] max-w-xs">No messages yet. Send a quick update so {tenantName || "the tenant"} knows you&rsquo;re on it.</p>
      </div>
    );
  }
  return (
    <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-paper/40">
      {comments.map((c, i) => {
        const mine = c.authorRole === viewerRole;
        return (
          <div key={c._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-[14px] leading-relaxed ${
              mine ? "bg-ink text-paper" : "bg-card border border-rule text-ink"
            }`}>
              <p className="whitespace-pre-wrap">{c.text}</p>
              <div className={`mt-1 text-[10px] ${mine ? "text-paper/60" : "text-[color:var(--muted)]"}`}>
                {c.author?.name || (c.authorRole === "owner" ? "Owner" : "Tenant")}
                {c.createdAt && <> · {new Date(c.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</>}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}

function CommentBox({ value, setValue, onSend, sending }) {
  return (
    <div className="px-3 py-3 border-t border-rule bg-card flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }}
        placeholder="Type a message…"
        disabled={sending}
        className="flex-1 rounded-full border border-rule bg-card px-4 py-2.5 text-[14px] focus:outline-none focus:border-ink disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={sending || !value.trim()}
        className="w-10 h-10 rounded-full bg-ink text-paper flex items-center justify-center hover:bg-accent transition disabled:opacity-50"
        aria-label="Send"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

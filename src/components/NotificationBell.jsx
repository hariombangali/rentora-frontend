import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Check, FileText, CalendarDays, MessageSquare, Clock, XCircle, RefreshCw,
} from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";

const KIND_ICON = {
  application_new:       { Icon: FileText,     tone: "accent" },
  application_status:    { Icon: Check,        tone: "sage" },
  application_withdrawn: { Icon: XCircle,      tone: "muted" },
  booking_new:           { Icon: CalendarDays, tone: "accent" },
  booking_status:        { Icon: Check,        tone: "sage" },
  booking_rescheduled:   { Icon: RefreshCw,    tone: "warm" },
  message_new:           { Icon: MessageSquare, tone: "accent" },
};

const TONE_BG = {
  accent: "oklch(0.96 0.03 60)",
  sage:   "oklch(0.94 0.06 150)",
  warm:   "oklch(0.94 0.05 80)",
  muted:  "var(--chip-bg)",
};

const TONE_FG = {
  accent: "var(--accent)",
  sage:   "oklch(0.45 0.1 150)",
  warm:   "oklch(0.45 0.12 60)",
  muted:  "var(--ink-soft)",
};

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { items, unread, loading, markOneRead, markAllRead } = useNotifications();

  useEffect(() => {
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const handleItemClick = (n) => {
    if (!n.read) markOneRead(n._id);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-full bg-card border border-rule flex items-center justify-center hover:border-ink transition"
      >
        <Bell className="w-4 h-4 text-ink" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-paper text-[10px] font-semibold flex items-center justify-center leading-none">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-24px)] bg-card border border-rule rounded-3xl shadow-card-hover z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-rule">
            <div>
              <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Notifications</p>
              <div className="font-semibold text-[15px]">
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[12px] text-accent hover:text-ink transition underline underline-offset-2"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="p-8 text-center text-[color:var(--muted)] text-[13px]">Loading…</div>
            ) : items.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="w-10 h-10 rounded-full bg-paper flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-4 h-4 text-[color:var(--muted)]" />
                </div>
                <div className="text-[13px] font-medium">No notifications yet</div>
                <p className="text-[12px] text-[color:var(--muted)] mt-1 max-w-[220px] mx-auto">
                  New visits, applications, and messages will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-rule">
                {items.map((n) => {
                  const { Icon, tone } = KIND_ICON[n.kind] || { Icon: Bell, tone: "muted" };
                  return (
                    <li key={n._id}>
                      <Link
                        to={n.link || "/"}
                        onClick={() => handleItemClick(n)}
                        className={`flex gap-3 px-5 py-3.5 hover:bg-paper transition ${n.read ? "" : "bg-[oklch(0.97_0.015_80)]"}`}
                      >
                        <div
                          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center"
                          style={{ background: TONE_BG[tone], color: TONE_FG[tone] }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className={`text-[13.5px] leading-snug ${n.read ? "font-normal" : "font-semibold"}`}>
                              {n.title}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[color:var(--muted)] shrink-0">
                              <Clock className="w-3 h-3" />
                              {timeAgo(n.createdAt)}
                            </div>
                          </div>
                          {n.body && (
                            <p className="text-[12.5px] text-[color:var(--muted)] mt-0.5 line-clamp-2">
                              {n.body}
                            </p>
                          )}
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-2.5" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

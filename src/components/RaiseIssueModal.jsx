import { useState } from "react";
import { X, Wrench, AlertTriangle } from "lucide-react";
import API from "../services/api";
import { toast } from "../utils/toast";

const CATEGORIES = [
  { k: "Electrical", desc: "Lights, fans, power" },
  { k: "Plumbing",   desc: "Tap, drain, leak" },
  { k: "Appliance",  desc: "AC, geyser, fridge" },
  { k: "Cleaning",   desc: "Pest, mould, waste" },
  { k: "Furniture",  desc: "Bed, cupboard, sofa" },
  { k: "Pest",       desc: "Rats, cockroaches" },
  { k: "Other",      desc: "Anything else" },
];

const PRIORITY = [
  { k: "low",    label: "Low",    desc: "Can wait a week" },
  { k: "medium", label: "Medium", desc: "Within 2-3 days" },
  { k: "high",   label: "High",   desc: "Urgent, same day" },
];

export default function RaiseIssueModal({ open, onClose, booking, onSubmitted }) {
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!category) { toast.error("Pick a category"); return; }
    if (!description.trim() || description.trim().length < 10) {
      toast.error("Add a few lines of detail (min 10 chars)");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await API.post(
        "/issues",
        { bookingId: booking._id, category, description: description.trim(), priority },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Issue raised — the owner will respond soon");
      onSubmitted?.();
      setCategory(""); setDescription(""); setPriority("medium");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div
        className="bg-card w-full md:max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-card-hover max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 md:px-7 pt-5 pb-4 border-b border-rule flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[oklch(0.96_0.02_80)] text-accent flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Raise maintenance issue</p>
              <h2 className="font-display text-[22px] md:text-[24px] mt-1">{booking?.property?.title || "Your rental"}</h2>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-paper hover:bg-rule flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 space-y-5">
          <div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">Category</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.k}
                  type="button"
                  onClick={() => setCategory(c.k)}
                  className={`text-left rounded-2xl border p-3 transition ${
                    category === c.k ? "bg-ink text-paper border-ink" : "bg-card border-rule hover:border-ink"
                  }`}
                >
                  <div className="text-[14px] font-medium">{c.k}</div>
                  <div className={`text-[11px] ${category === c.k ? "text-paper/70" : "text-[color:var(--muted)]"}`}>{c.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">How urgent?</label>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITY.map((p) => (
                <button
                  key={p.k}
                  type="button"
                  onClick={() => setPriority(p.k)}
                  className={`rounded-full px-3 py-2 text-[13px] border transition ${
                    priority === p.k ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-[color:var(--muted)] mt-1">{PRIORITY.find((x) => x.k === priority)?.desc}</div>
          </div>

          <div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">Describe the issue</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tap in kitchen has been dripping since yesterday, water pools under the sink."
              className="w-full rounded-xl border border-rule bg-card px-3 py-2.5 text-[14px] focus:outline-none focus:border-ink resize-none"
            />
            <div className="text-[11px] text-[color:var(--muted)] mt-1">Owner will see this and update status. You can follow progress in My Bookings.</div>
          </div>

          {priority === "high" && (
            <div className="flex items-start gap-2 text-[12px] bg-[oklch(0.95_0.04_25)] rounded-2xl p-3 text-[color:var(--danger)]" style={{ color: "oklch(0.5 0.15 25)" }}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>High-priority issues are for same-day safety concerns (gas leak, no water, electrical hazard). For non-urgent things, pick Medium.</span>
            </div>
          )}
        </div>

        <div className="px-5 md:px-7 py-4 border-t border-rule flex gap-2 bg-card">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit issue"}
          </button>
        </div>
      </div>
    </div>
  );
}

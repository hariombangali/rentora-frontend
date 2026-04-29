import { useState } from "react";
import { X, Shield, Check } from "lucide-react";
import API from "../services/api";
import { toast } from "../utils/toast";

const METHODS = [
  { k: "UPI",        label: "UPI",        desc: "GPay, PhonePe, Paytm" },
  { k: "Card",       label: "Card",       desc: "Credit / Debit" },
  { k: "Netbanking", label: "Netbanking", desc: "Any Indian bank" },
  { k: "Cash",       label: "Cash",       desc: "Pay owner directly" },
];

const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

export default function MoveInPaymentModal({ open, onClose, booking, onPaid }) {
  const [method, setMethod] = useState("UPI");
  const [processing, setProcessing] = useState(false);

  if (!open || !booking) return null;

  const rent = Number(booking.priceQuoted) || Number(booking.property?.price) || 0;
  const deposit = Number(booking.property?.deposit) || rent * 2;
  const total = rent + deposit;

  const submit = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/bookings/${booking._id}/movein/payment`,
        { method },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onPaid?.(res.data);
      toast.success("Move-in payment recorded");
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="bg-card w-full md:max-w-md rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-card-hover max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 md:px-7 pt-5 pb-4 border-b border-rule flex items-start justify-between gap-4">
          <div>
            <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Move-in payment</p>
            <h2 className="font-display text-[22px] md:text-[26px] mt-1">{booking.property?.title || "Your rental"}</h2>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-paper hover:bg-rule flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 space-y-5">
          <div className="bg-paper rounded-2xl border border-rule p-4 space-y-2.5">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-[color:var(--muted)]">Security deposit</span>
              <span className="text-ink">{fmtINR(deposit)}</span>
            </div>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-[color:var(--muted)]">First month rent</span>
              <span className="text-ink">{fmtINR(rent)}</span>
            </div>
            <div className="h-px bg-rule" />
            <div className="flex items-baseline justify-between">
              <span className="font-eyebrow text-[11px] text-[color:var(--muted)]">Total due</span>
              <span className="font-display text-[28px]">{fmtINR(total)}</span>
            </div>
          </div>

          <div>
            <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">Method</label>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m.k}
                  type="button"
                  onClick={() => setMethod(m.k)}
                  className={`text-left rounded-2xl border p-3 transition ${
                    method === m.k ? "bg-ink text-paper border-ink" : "bg-card border-rule hover:border-ink"
                  }`}
                >
                  <div className="text-[14px] font-medium">{m.label}</div>
                  <div className={`text-[11px] ${method === m.k ? "text-paper/70" : "text-[color:var(--muted)]"}`}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 text-[12px] text-[color:var(--muted)] bg-[oklch(0.96_0.02_80)] rounded-2xl p-3">
            <Shield className="w-3.5 h-3.5 mt-0.5 text-accent shrink-0" />
            <span>Demo environment. The deposit is held against your booking and will be released on move-out (minus deductions). The first-month rent is credited to the owner.</span>
          </div>
        </div>

        <div className="px-5 md:px-7 py-4 border-t border-rule flex gap-2 bg-card">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">Cancel</button>
          <button onClick={submit} disabled={processing} className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50">
            {processing ? "Processing…" : `Pay ${fmtINR(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { X, Check, Shield } from "lucide-react";
import API from "../services/api";
import { toast } from "../utils/toast";
import { generateReceiptPDF } from "../utils/printable";

const METHODS = [
  { k: "UPI",        label: "UPI",        desc: "GPay, PhonePe, Paytm" },
  { k: "Card",       label: "Card",       desc: "Credit / Debit" },
  { k: "Netbanking", label: "Netbanking", desc: "Any Indian bank" },
  { k: "Cash",       label: "Cash",       desc: "Pay owner directly" },
];

const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

function periodOptions(checkIn) {
  const base = checkIn ? new Date(checkIn) : new Date();
  const now = new Date();
  const options = [];
  // Include current month + next month + last 3 months
  for (let offset = -3; offset <= 1; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    if (d < new Date(base.getFullYear(), base.getMonth(), 1)) continue;
    options.push({
      label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }),
      month: d.getMonth() + 1,
      year: d.getFullYear(),
      isNow: offset === 0,
    });
  }
  return options;
}

export default function PayRentModal({ open, onClose, booking, onPaid }) {
  const [method, setMethod] = useState("UPI");
  const [periods] = useState(() => periodOptions(booking?.checkIn));
  const currentPeriod = periods.find((p) => p.isNow) || periods[periods.length - 1] || periods[0];
  const [selectedPeriod, setSelectedPeriod] = useState(currentPeriod ? `${currentPeriod.year}-${currentPeriod.month}` : null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(null);

  const period = useMemo(() => periods.find((p) => `${p.year}-${p.month}` === selectedPeriod) || currentPeriod, [periods, selectedPeriod, currentPeriod]);
  const amount = booking?.priceQuoted || booking?.property?.price || 0;

  if (!open) return null;

  const confirm = async () => {
    if (!period) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        "/rent-payments",
        {
          bookingId: booking._id,
          periodLabel: period.label,
          periodMonth: period.month,
          periodYear: period.year,
          method,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDone(res.data);
      onPaid?.(res.data);
      toast.success(`Rent for ${period.label} marked as paid`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.payment) {
        setDone(err.response.data.payment);
        toast.info?.(err.response.data.message) || toast(err.response.data.message);
      } else {
        toast.error(err.response?.data?.message || "Payment failed");
      }
    } finally {
      setProcessing(false);
    }
  };

  const downloadReceipt = async () => {
    if (!done) return;
    try {
      const token = localStorage.getItem("token");
      const { data } = await API.get(`/rent-payments/${done._id}`, { headers: { Authorization: `Bearer ${token}` } });
      generateReceiptPDF(data);
    } catch (e) {
      toast.error("Could not load receipt");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div
        className="bg-card w-full md:max-w-md rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-card-hover max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 md:px-7 pt-5 pb-4 border-b border-rule flex items-start justify-between gap-4">
          <div>
            <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">{done ? "Payment complete" : "Pay rent"}</p>
            <h2 className="font-display text-[22px] md:text-[26px] mt-1">{booking?.property?.title || "Your rental"}</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-paper hover:bg-rule flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!done ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 space-y-5">
              <div className="bg-paper rounded-2xl border border-rule p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[13px] text-[color:var(--muted)]">Amount</span>
                  <span className="font-display text-[32px]">{fmtINR(amount)}</span>
                </div>
                {period && (
                  <div className="flex items-baseline justify-between mt-1">
                    <span className="text-[13px] text-[color:var(--muted)]">For period</span>
                    <span className="text-[14px] font-medium">{period.label}</span>
                  </div>
                )}
              </div>

              {periods.length > 1 && (
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-2">Pay for</label>
                  <div className="flex flex-wrap gap-1.5">
                    {periods.map((p) => {
                      const k = `${p.year}-${p.month}`;
                      const active = k === selectedPeriod;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setSelectedPeriod(k)}
                          className={`rounded-full px-3.5 py-1.5 text-[12px] border transition ${
                            active ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                <span>Demo environment. No real payment is processed — a rent receipt is generated and the payment is recorded against this booking. Hook up Razorpay / Stripe here when ready.</span>
              </div>
            </div>

            <div className="px-5 md:px-7 py-4 border-t border-rule flex gap-2 bg-card">
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition"
              >
                Cancel
              </button>
              <button
                onClick={confirm}
                disabled={processing || !period}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
              >
                {processing ? "Processing…" : `Pay ${fmtINR(amount)}`}
              </button>
            </div>
          </>
        ) : (
          <div className="px-5 md:px-7 py-8 space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-sage text-paper flex items-center justify-center mb-3">
                <Check className="w-6 h-6" />
              </div>
              <div className="font-display text-[24px]">Payment recorded</div>
              <p className="text-[13px] text-[color:var(--muted)] mt-1 max-w-[260px]">
                Receipt <b>{done.receiptNumber}</b> for {done.periodLabel} &middot; {fmtINR(done.amount)}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition"
              >
                Done
              </button>
              <button
                onClick={downloadReceipt}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition"
              >
                Download receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

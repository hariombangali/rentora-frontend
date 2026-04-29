import { useState } from "react";
import { X, FileSignature, Download, ShieldCheck } from "lucide-react";
import API from "../services/api";
import { toast } from "../utils/toast";
import { generateAgreementPDF } from "../utils/printable";

const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");

export default function SignAgreementModal({ open, onClose, booking, role, onSigned }) {
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!open || !booking) return null;

  const m = booking.moveIn || {};
  const tenantSigned = !!m.tenantSignedAt;
  const ownerSigned  = !!m.ownerSignedAt;
  const youSigned = role === "tenant" ? tenantSigned : ownerSigned;
  const otherSigned = role === "tenant" ? ownerSigned : tenantSigned;

  const rent = Number(booking.priceQuoted) || Number(booking.property?.price) || 0;
  const deposit = Number(m.depositAmount) || Number(booking.property?.deposit) || rent * 2;

  const sign = async () => {
    if (!agreed) {
      toast.error("Please tick the agreement checkbox");
      return;
    }
    setSigning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/bookings/${booking._id}/movein/sign`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSigned?.(res.data);
      toast.success("Agreement signed");
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to sign");
    } finally {
      setSigning(false);
    }
  };

  const downloadPdf = async () => {
    try {
      const token = localStorage.getItem("token");
      const propRes = await API.get(`/properties/${booking.property?._id || booking.property}`);
      generateAgreementPDF({
        booking,
        property: propRes.data,
        owner: propRes.data?.user || booking.owner,
        tenant: JSON.parse(localStorage.getItem("user") || "{}"),
      });
    } catch {
      toast.error("Could not open agreement");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="bg-card w-full md:max-w-lg rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-card-hover max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 md:px-7 pt-5 pb-4 border-b border-rule flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[oklch(0.96_0.02_80)] text-accent flex items-center justify-center shrink-0">
              <FileSignature className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Rental agreement</p>
              <h2 className="font-display text-[22px] md:text-[24px] mt-1 truncate">{booking.property?.title || "Your rental"}</h2>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-paper hover:bg-rule flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6 space-y-5">
          {/* Key terms */}
          <div className="bg-paper rounded-2xl border border-rule p-4 space-y-2 text-[13px]">
            <Row k="Property" v={booking.property?.title} />
            <Row k="Address" v={[booking.property?.location?.locality, booking.property?.location?.city].filter(Boolean).join(", ") || "—"} />
            <Row k="Move-in" v={fmtDate(booking.checkIn)} />
            <Row k="Lease end" v={fmtDate(booking.checkOut)} />
            <Row k="Monthly rent" v={fmtINR(rent)} />
            <Row k="Security deposit" v={fmtINR(deposit)} />
          </div>

          {/* Plain-language clauses */}
          <div className="space-y-3 text-[13px] leading-relaxed text-ink">
            <p>
              By signing, you acknowledge that you have read the standard Rentora rental agreement
              (downloadable below) and accept its terms. The lease is valid from the move-in date for the
              full lease period at the agreed monthly rent.
            </p>
            <p className="text-[color:var(--muted)]">
              Standard clauses cover: rent due on the move-in date each month, deposit refund on move-out
              minus reasonable deductions, notice period, maintenance responsibilities, and dispute
              resolution.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadPdf}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
          >
            <Download className="w-3.5 h-3.5" /> Download full agreement
          </button>

          {/* Signature status */}
          <div className="bg-paper rounded-2xl border border-rule p-4 space-y-2.5">
            <p className="font-eyebrow text-[10px] text-[color:var(--muted)]">Signature status</p>
            <SignatureRow label="Tenant" signedAt={m.tenantSignedAt} />
            <SignatureRow label="Owner" signedAt={m.ownerSignedAt} />
          </div>

          {!youSigned && (
            <label className="flex items-start gap-2.5 text-[13px] cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[color:var(--ink)]"
              />
              <span className="text-ink leading-relaxed">
                I have read and agree to the terms of this rental agreement, and I confirm my electronic signature is binding.
              </span>
            </label>
          )}

          {youSigned && otherSigned && (
            <div className="flex items-start gap-2 text-[12px] bg-[oklch(0.94_0.06_150)] text-[oklch(0.45_0.1_150)] rounded-2xl p-3">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>Both parties have signed. The next step is the move-in confirmation.</span>
            </div>
          )}
          {youSigned && !otherSigned && (
            <div className="flex items-start gap-2 text-[12px] bg-[oklch(0.94_0.05_80)] text-[oklch(0.45_0.12_60)] rounded-2xl p-3">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>You&rsquo;ve signed. Waiting for the {role === "tenant" ? "owner" : "tenant"} to sign.</span>
            </div>
          )}
        </div>

        <div className="px-5 md:px-7 py-4 border-t border-rule flex gap-2 bg-card">
          <button onClick={onClose} className="flex-1 inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-card border border-rule text-ink text-sm hover:border-ink transition">
            {youSigned ? "Close" : "Cancel"}
          </button>
          {!youSigned && (
            <button
              onClick={sign}
              disabled={signing || !agreed}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-50"
            >
              {signing ? "Signing…" : "Sign agreement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[color:var(--muted)] shrink-0">{k}</span>
      <span className="text-ink text-right truncate">{v || "—"}</span>
    </div>
  );
}

function SignatureRow({ label, signedAt }) {
  const fmt = (d) => new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-[color:var(--muted)]">{label}</span>
      {signedAt ? (
        <span className="inline-flex items-center gap-1 text-[oklch(0.45_0.1_150)]">
          <ShieldCheck className="w-3.5 h-3.5" /> Signed · {fmt(signedAt)}
        </span>
      ) : (
        <span className="text-[color:var(--muted)] italic">Pending</span>
      )}
    </div>
  );
}

import { useState } from "react";
import { Check, CreditCard, FileSignature, Key, Sparkles } from "lucide-react";
import API from "../services/api";
import { toast } from "../utils/toast";
import MoveInPaymentModal from "./MoveInPaymentModal";
import SignAgreementModal from "./SignAgreementModal";

const fmtINR = (n) => "₹" + (Number(n) || 0).toLocaleString("en-IN");

export default function MoveInChecklist({ booking, role, onUpdated }) {
  const [payOpen, setPayOpen] = useState(false);
  const [signOpen, setSignOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const m = booking.moveIn || {};
  const paid = !!m.paymentDone;
  const tenantSigned = !!m.tenantSignedAt;
  const ownerSigned = !!m.ownerSignedAt;
  const bothSigned = tenantSigned && ownerSigned;
  const tenantConfirmed = !!m.tenantConfirmedAt;
  const ownerConfirmed = !!m.ownerConfirmedAt;
  const youSigned   = role === "tenant" ? tenantSigned : ownerSigned;
  const youConfirmed = role === "tenant" ? tenantConfirmed : ownerConfirmed;
  const otherConfirmed = role === "tenant" ? ownerConfirmed : tenantConfirmed;

  // Step status
  const stepPayState = paid ? "done" : (role === "tenant" ? "active" : "waiting");
  const stepSignState = !paid ? "locked" : youSigned ? (bothSigned ? "done" : "waiting") : "active";
  const stepConfirmState = !bothSigned
    ? "locked"
    : youConfirmed
    ? (otherConfirmed ? "done" : "waiting")
    : "active";

  const rent = Number(booking.priceQuoted) || Number(booking.property?.price) || 0;
  const deposit = Number(m.depositAmount) || Number(booking.property?.deposit) || rent * 2;
  const total = (m.paymentAmount) || (rent + deposit);

  const confirmMoveIn = async () => {
    setConfirming(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post(
        `/bookings/${booking._id}/movein/confirm`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onUpdated?.(res.data);
      toast.success(role === "tenant" ? "Move-in confirmed" : "Handover confirmed");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to confirm");
    } finally {
      setConfirming(false);
    }
  };

  const completedCount = [paid, bothSigned, tenantConfirmed && ownerConfirmed].filter(Boolean).length;

  return (
    <div className="mt-4 bg-card border border-accent/30 rounded-3xl p-7 md:p-8 shadow-card">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-eyebrow text-accent text-[11px]">{role === "tenant" ? "Almost home" : "Move-in pending"}</p>
          <h3 className="font-display text-[26px] md:text-[30px] mt-1 leading-tight">
            {role === "tenant" ? "Complete your move-in" : "Approve & hand over"}
          </h3>
          <p className="mt-1.5 text-[14px] text-[color:var(--muted)]">
            {booking.property?.title}
            {role === "tenant"
              ? " — three quick steps and the keys are yours."
              : " — sign and confirm to release the keys."}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-6">
        <div className="h-1.5 rounded-full bg-rule overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${(completedCount / 3) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-[12px] text-[color:var(--muted)]">{completedCount} of 3 steps complete</p>
      </div>

      {/* Steps */}
      <ol className="mt-6 space-y-3">
        <Step
          num={1}
          icon={<CreditCard className="w-4 h-4" />}
          state={stepPayState}
          title="Pay deposit + first rent"
          subtitle={
            paid
              ? `${fmtINR(total)} paid · ${m.paymentMode || "—"}`
              : role === "tenant"
              ? `${fmtINR(rent + deposit)} due before signing`
              : `Tenant pays ${fmtINR(rent + deposit)}`
          }
          action={
            role === "tenant" && !paid && (
              <button
                onClick={() => setPayOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
              >
                Pay now
              </button>
            )
          }
        />

        <Step
          num={2}
          icon={<FileSignature className="w-4 h-4" />}
          state={stepSignState}
          title="Sign the agreement"
          subtitle={
            !paid
              ? "Available after payment"
              : bothSigned
              ? "Both parties signed"
              : youSigned
              ? `Waiting for the ${role === "tenant" ? "owner" : "tenant"} to sign`
              : "Review the terms and sign"
          }
          action={
            paid && !youSigned && (
              <button
                onClick={() => setSignOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
              >
                Review &amp; sign
              </button>
            )
          }
          secondary={
            paid && youSigned && (
              <button
                onClick={() => setSignOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-full bg-card border border-rule text-ink text-[13px] font-medium hover:border-ink transition"
              >
                View
              </button>
            )
          }
        />

        <Step
          num={3}
          icon={<Key className="w-4 h-4" />}
          state={stepConfirmState}
          title={role === "tenant" ? "Confirm move-in" : "Confirm handover"}
          subtitle={
            !bothSigned
              ? "Available after both parties sign"
              : tenantConfirmed && ownerConfirmed
              ? "Lease is live"
              : youConfirmed
              ? `Waiting for the ${role === "tenant" ? "owner" : "tenant"} to confirm`
              : role === "tenant"
              ? "Confirm once the keys are with you"
              : "Confirm once you've handed over the keys"
          }
          action={
            bothSigned && !youConfirmed && (
              <button
                onClick={confirmMoveIn}
                disabled={confirming}
                className="inline-flex items-center px-4 py-2 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition disabled:opacity-50"
              >
                {confirming ? "Confirming…" : role === "tenant" ? "I've moved in" : "Keys handed over"}
              </button>
            )
          }
        />
      </ol>

      <MoveInPaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        booking={booking}
        onPaid={(updated) => onUpdated?.(updated)}
      />
      <SignAgreementModal
        open={signOpen}
        onClose={() => setSignOpen(false)}
        booking={booking}
        role={role}
        onSigned={(updated) => onUpdated?.(updated)}
      />
    </div>
  );
}

function Step({ num, icon, state, title, subtitle, action, secondary }) {
  const isDone = state === "done";
  const isActive = state === "active";
  const isLocked = state === "locked";

  return (
    <li
      className={`flex items-start gap-4 rounded-2xl border px-4 py-3.5 transition ${
        isDone
          ? "bg-[oklch(0.96_0.04_150)] border-[oklch(0.85_0.07_150)]"
          : isActive
          ? "bg-paper border-accent/30"
          : "bg-paper border-rule opacity-70"
      }`}
    >
      {/* Marker */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
          isDone
            ? "bg-[oklch(0.65_0.13_150)] text-paper"
            : isActive
            ? "bg-accent text-paper"
            : "bg-card border border-rule text-[color:var(--muted)]"
        }`}
      >
        {isDone ? <Check className="w-4 h-4" /> : icon}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-eyebrow text-[10px] text-[color:var(--muted)]">Step {num}</span>
          {isDone && <span className="font-eyebrow text-[10px] text-[oklch(0.45_0.1_150)]">Done</span>}
          {isActive && <span className="font-eyebrow text-[10px] text-accent">Now</span>}
          {isLocked && <span className="font-eyebrow text-[10px] text-[color:var(--muted)]">Locked</span>}
        </div>
        <p className="mt-0.5 font-medium text-[15px] text-ink">{title}</p>
        <p className="text-[13px] text-[color:var(--muted)] mt-0.5">{subtitle}</p>
      </div>

      {/* Action */}
      {(action || secondary) && (
        <div className="flex items-center gap-2 shrink-0 self-center">{action || secondary}</div>
      )}
    </li>
  );
}

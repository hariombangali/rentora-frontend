import { useState } from "react";
import { X, Check, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import API from "../services/api";
import { toast } from "../utils/toast";

const STEPS = [
  { k: "about",     label: "About you" },
  { k: "tenancy",   label: "Tenancy" },
  { k: "occupants", label: "Occupants" },
  { k: "docs",      label: "References" },
  { k: "review",    label: "Review" },
];

const OCCUPATIONS = ["Student", "Working professional", "Self-employed", "Business owner", "Other"];
const DURATIONS = ["6 months", "11 months", "1 year", "2+ years"];
const ID_TYPES = ["Aadhar", "PAN", "Driving license", "Passport", "Other"];

function fmtINR(n) { return "₹" + (Number(n) || 0).toLocaleString("en-IN"); }

export default function RentalApplicationModal({ open, onClose, property, onSubmitted }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [occupation, setOccupation] = useState("");
  const [employer, setEmployer] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  const [moveIn, setMoveIn] = useState("");
  const [duration, setDuration] = useState("11 months");

  const [occupantCount, setOccupantCount] = useState("1");
  const [occupantType, setOccupantType] = useState("Self");
  const [hasPets, setHasPets] = useState(false);

  const [idType, setIdType] = useState("Aadhar");
  const [idNumber, setIdNumber] = useState("");
  const [previousAddress, setPreviousAddress] = useState("");
  const [referenceName, setReferenceName] = useState("");
  const [referencePhone, setReferencePhone] = useState("");
  const [aboutMe, setAboutMe] = useState("");

  if (!open) return null;

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const validateStep = () => {
    switch (step.k) {
      case "about":
        if (!name.trim() || !phone.trim() || !email.trim() || !occupation) {
          toast.error("Fill name, phone, email, occupation");
          return false;
        }
        return true;
      case "tenancy":
        if (!moveIn || !duration) {
          toast.error("Pick move-in date and duration");
          return false;
        }
        return true;
      case "occupants":
        if (!occupantCount) return false;
        return true;
      case "docs":
        if (!idNumber.trim()) {
          toast.error("ID number is required for verification");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const next = () => {
    if (!validateStep()) return;
    setStepIdx((i) => Math.min(STEPS.length - 1, i + 1));
  };
  const back = () => setStepIdx((i) => Math.max(0, i - 1));

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      await API.post(
        "/applications",
        {
          propertyId: property._id,
          name, phone, email, occupation, employer,
          monthlyIncome: monthlyIncome ? Number(monthlyIncome) : null,
          moveInDate: moveIn,
          duration,
          occupantCount, occupantType, hasPets,
          idType, idNumber, previousAddress,
          referenceName, referencePhone, aboutMe,
        },
        config
      );

      toast.success("Application sent! The owner will respond within 24 hours.");
      onSubmitted?.();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to send application";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div
        className="bg-card w-full md:max-w-2xl max-h-[92vh] md:max-h-[88vh] rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-card-hover"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 md:px-7 pt-5 pb-4 border-b border-rule flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-eyebrow text-[11px] text-[color:var(--muted)]">Step {stepIdx + 1} of {STEPS.length}</p>
            <h2 className="font-display text-[22px] md:text-[26px] mt-1">Apply to rent</h2>
            <p className="text-[12px] md:text-[13px] text-[color:var(--muted)] truncate">{property?.title}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full bg-paper hover:bg-rule flex items-center justify-center shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="px-5 md:px-7 pt-3 pb-1 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s.k} className="flex-1">
              <div className={`h-1 rounded-full transition-all ${i <= stepIdx ? "bg-accent" : "bg-rule"}`} />
              <div className={`mt-1.5 hidden md:block text-[10px] font-medium text-center ${i <= stepIdx ? "text-ink" : "text-[color:var(--muted)]"}`}>
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 md:px-7 py-6">
          {step.k === "about" && (
            <div className="space-y-4">
              <Field label="Full name">
                <input value={name} onChange={(e) => setName(e.target.value)} className="field-input" placeholder="Ananya Sharma" />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Phone">
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="field-input" placeholder="+91 98260 00000" type="tel" />
                </Field>
                <Field label="Email">
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="you@domain.com" type="email" />
                </Field>
              </div>
              <Field label="Occupation">
                <div className="flex flex-wrap gap-1.5">
                  {OCCUPATIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setOccupation(o)}
                      className={`chip-btn ${occupation === o ? "active" : ""}`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={`${occupation === "Student" ? "Institution" : "Employer"}`}>
                  <input value={employer} onChange={(e) => setEmployer(e.target.value)} className="field-input" placeholder={occupation === "Student" ? "DAVV, IIT-Indore..." : "Company name"} />
                </Field>
                <Field label="Monthly income (optional)">
                  <input value={monthlyIncome} onChange={(e) => setMonthlyIncome(e.target.value)} className="field-input" placeholder="45000" type="number" />
                </Field>
              </div>
            </div>
          )}

          {step.k === "tenancy" && (
            <div className="space-y-5">
              <Field label="Preferred move-in date">
                <input type="date" value={moveIn} onChange={(e) => setMoveIn(e.target.value)} className="field-input" />
              </Field>
              <Field label="Lease duration">
                <div className="flex flex-wrap gap-1.5">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`chip-btn ${duration === d ? "active" : ""}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Cost preview */}
              {property?.price && (
                <div className="bg-paper border border-rule rounded-2xl p-4">
                  <p className="font-eyebrow text-[10px] text-[color:var(--muted)]">Estimated monthly outflow</p>
                  <div className="mt-2 space-y-1.5 text-[13px]">
                    <Row label="Rent" value={fmtINR(property.price)} />
                    <Row label={`Deposit (${property.deposit ? "" : "est. "}2× rent)`} value={fmtINR(property.deposit || property.price * 2)} />
                    <Row label="Brokerage" value="₹0 · always" tone="sage" />
                    <div className="h-px bg-rule my-2" />
                    <Row label={`Month 1 total`} value={fmtINR((property.deposit || property.price * 2) + property.price)} strong />
                  </div>
                </div>
              )}
            </div>
          )}

          {step.k === "occupants" && (
            <div className="space-y-5">
              <Field label="How many people will stay here?">
                <div className="grid grid-cols-5 gap-2">
                  {["1", "2", "3", "4", "5+"].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setOccupantCount(n)}
                      className={`py-3 rounded-xl border text-[14px] transition ${
                        occupantCount === n ? "bg-ink text-paper border-ink" : "bg-card border-rule hover:border-ink"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Who are they?">
                <div className="flex flex-wrap gap-1.5">
                  {["Self", "Couple", "Family", "Friends", "Colleagues"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOccupantType(t)}
                      className={`chip-btn ${occupantType === t ? "active" : ""}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Do you have pets?">
                <div className="inline-flex bg-card border border-rule rounded-full p-1 gap-0.5">
                  {[
                    { k: false, label: "No" },
                    { k: true, label: "Yes" },
                  ].map((o) => (
                    <button
                      key={String(o.k)}
                      type="button"
                      onClick={() => setHasPets(o.k)}
                      className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition ${
                        hasPets === o.k ? "bg-ink text-paper" : "text-[color:var(--muted)] hover:text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {step.k === "docs" && (
            <div className="space-y-4">
              <div className="bg-[oklch(0.96_0.02_80)] border border-rule rounded-2xl p-4 flex gap-3 items-start">
                <Upload className="w-4 h-4 mt-0.5 text-accent shrink-0" />
                <p className="text-[13px] text-ink">
                  We only verify your ID &mdash; no documents are shared with the owner. Your privacy is protected.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ID type">
                  <select value={idType} onChange={(e) => setIdType(e.target.value)} className="field-input">
                    {ID_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="ID number">
                  <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="field-input" placeholder="XXXX-XXXX-XXXX" />
                </Field>
              </div>
              <Field label="Current / previous address (optional)">
                <textarea value={previousAddress} onChange={(e) => setPreviousAddress(e.target.value)} rows={2} className="field-input resize-none" placeholder="Where are you living right now?" />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Reference name (optional)">
                  <input value={referenceName} onChange={(e) => setReferenceName(e.target.value)} className="field-input" placeholder="Previous landlord / employer" />
                </Field>
                <Field label="Reference phone (optional)">
                  <input value={referencePhone} onChange={(e) => setReferencePhone(e.target.value)} className="field-input" placeholder="+91 ..." type="tel" />
                </Field>
              </div>
              <Field label="A line or two about you (owner reads this)">
                <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} rows={3} className="field-input resize-none" placeholder="Quiet person, early riser, work from home. Moving because..." />
              </Field>
            </div>
          )}

          {step.k === "review" && (
            <div className="space-y-4">
              <div className="bg-[oklch(0.96_0.02_80)] border border-rule rounded-2xl p-5 flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full bg-accent text-paper flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium text-[14px]">Ready to send</div>
                  <p className="text-[13px] text-[color:var(--muted)] mt-1">
                    Review and submit. Owner typically replies within 24 hours. You can always chat with them in Inbox after you apply.
                  </p>
                </div>
              </div>

              <ReviewSection title="Applicant">
                <ReviewRow k="Name" v={name} />
                <ReviewRow k="Phone" v={phone} />
                <ReviewRow k="Email" v={email} />
                <ReviewRow k="Occupation" v={occupation + (employer ? ` · ${employer}` : "")} />
                {monthlyIncome && <ReviewRow k="Income" v={`₹${Number(monthlyIncome).toLocaleString("en-IN")}/mo`} />}
              </ReviewSection>

              <ReviewSection title="Tenancy">
                <ReviewRow k="Move-in" v={moveIn || "—"} />
                <ReviewRow k="Duration" v={duration} />
              </ReviewSection>

              <ReviewSection title="Occupants">
                <ReviewRow k="People" v={`${occupantCount} · ${occupantType}`} />
                <ReviewRow k="Pets" v={hasPets ? "Yes" : "No"} />
              </ReviewSection>

              <ReviewSection title="Verification">
                <ReviewRow k={idType} v={idNumber} />
                {previousAddress && <ReviewRow k="Prev. address" v={previousAddress} />}
                {referenceName && <ReviewRow k="Reference" v={`${referenceName}${referencePhone ? ` (${referencePhone})` : ""}`} />}
              </ReviewSection>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 md:px-7 py-4 border-t border-rule flex items-center justify-between gap-3 bg-card">
          <button
            type="button"
            onClick={stepIdx === 0 ? onClose : back}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-medium text-[color:var(--muted)] hover:text-ink transition"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {stepIdx === 0 ? "Cancel" : "Back"}
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit application"}
              <Check className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-ink text-paper text-[13px] font-medium hover:bg-accent transition"
            >
              Continue
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <style>{`
        .field-input {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--rule);
          border-radius: 12px;
          padding: 11px 13px;
          font-size: 14px;
          outline: none;
          color: var(--ink);
          transition: border-color .15s ease;
        }
        .field-input:focus { border-color: var(--ink); }
        .chip-btn {
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 13px;
          background: var(--card);
          border: 1px solid var(--rule);
          color: var(--ink);
          transition: all .15s ease;
        }
        .chip-btn:hover { border-color: var(--ink); }
        .chip-btn.active { background: var(--ink); color: var(--paper); border-color: var(--ink); }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Row({ label, value, strong, tone }) {
  return (
    <div className="flex justify-between">
      <span className="text-[color:var(--muted)]">{label}</span>
      <span className={`${tone === "sage" ? "text-sage font-medium" : "text-ink"} ${strong ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div className="bg-card border border-rule rounded-2xl p-4">
      <div className="font-eyebrow text-[10px] text-[color:var(--muted)] mb-2.5">{title}</div>
      <div className="space-y-1.5 text-[13px]">{children}</div>
    </div>
  );
}

function ReviewRow({ k, v }) {
  return (
    <div className="flex gap-3">
      <span className="text-[color:var(--muted)] w-28 shrink-0">{k}</span>
      <span className="text-ink break-words min-w-0 flex-1">{v || "—"}</span>
    </div>
  );
}

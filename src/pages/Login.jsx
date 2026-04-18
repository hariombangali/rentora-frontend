import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

const containerIn = {
  hidden: { opacity: 0, y: 22, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const stepSwap = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.18, ease: "easeIn" } },
};

const bannerError = {
  hidden: { opacity: 0, y: -6 },
  show: {
    opacity: 1,
    y: 0,
    x: [0, -7, 7, -5, 5, 0],
    transition: { duration: 0.35, ease: "easeOut" },
  },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

const bannerSuccess = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between gap-3">
        <label className="text-xs font-medium text-white/70">{label}</label>
        {hint ? <span className="text-[11px] text-white/40">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Pill({ active, done, children }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-medium backdrop-blur",
        active
          ? "border-white/15 bg-white/10 text-white"
          : done
          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
          : "border-white/10 bg-white/5 text-white/60",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-white" : done ? "bg-emerald-300" : "bg-white/40",
        ].join(" ")}
      />
      {children}
    </div>
  );
}

export default function Login() {
  const [step, setStep] = useState("enter"); // enter, otp, setPassword
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const [otp, setOtp] = useState("");

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [flash, setFlash] = useState(""); // success/info banner
  const [devOtp, setDevOtp] = useState("");

  const [resendIn, setResendIn] = useState(0);

  const otpRefs = useRef(Array.from({ length: 6 }, () => null));
  const navigate = useNavigate();
  const { login } = useAuth();

  const canResend = resendIn === 0;

  useEffect(() => {
    if (!resendIn) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  useEffect(() => {
    setOtp(otpInputs.join(""));
  }, [otpInputs]);

  useEffect(() => {
    if (step !== "otp") return;
    const t = setTimeout(() => otpRefs.current?.[0]?.focus?.(), 80);
    return () => clearTimeout(t);
  }, [step]);

  const stepIndex = ["enter", "otp", "setPassword"].indexOf(step);

  const StepTitle = useMemo(() => {
    if (step === "enter") return "Sign in";
    if (step === "otp") return "Verify code";
    return "Create password";
  }, [step]);

  const startResendTimer = () => setResendIn(30);

  const resetToEmailStep = () => {
    setStep("enter");
    setOtpInputs(["", "", "", "", "", ""]);
    setOtp("");
    setDevOtp("");
    setResendIn(0);
    setError("");
    setFlash("");
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setFlash("");

    if (!email) {
      setError("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/send-otp", { email });
      setStep("otp");
      setDevOtp(res.data?.otp || "");
      setOtpInputs(["", "", "", "", "", ""]);
      startResendTimer();
      setFlash("A verification code was sent to your email.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend || !email) return;
    setError("");
    setFlash("");

    try {
      const res = await API.post("/auth/send-otp", { email });
      setDevOtp(res.data?.otp || "");
      setOtpInputs(["", "", "", "", "", ""]);
      otpRefs.current?.[0]?.focus?.();
      startResendTimer();
      setFlash("A new code has been sent.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setFlash("");

    if (otp.length !== 6) {
      setError("Please enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });

      if (res.data?.newUser) {
        setStep("setPassword");
        setFlash("Verified. Please create a password to continue.");
        return;
      }

      localStorage.setItem("token", res.data.token);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setFlash("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/set-password", { email, name, password });
      localStorage.setItem("token", res.data.token);
      login(res.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  const onOtpChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otpInputs];
    next[i] = v;
    setOtpInputs(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus?.();
  };

  const onOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otpInputs[i] && i > 0) {
      otpRefs.current[i - 1]?.focus?.();
    }
    if (e.key === "ArrowLeft" && i > 0) otpRefs.current[i - 1]?.focus?.();
    if (e.key === "ArrowRight" && i < 5) otpRefs.current[i + 1]?.focus?.();
  };

  const onOtpPaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!text) return;

    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtpInputs(next);

    const focusIndex = Math.min(text.length, 5);
    requestAnimationFrame(() => otpRefs.current[focusIndex]?.focus?.());
  };

  const onSubmit =
    step === "enter" ? sendOtp : step === "otp" ? verifyOtp : handleSetPassword;

  const isOtpReady = otp.length === 6;

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-16 h-[28rem] w-[28rem] rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-[30rem] w-[30rem] rounded-full bg-fuchsia-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_55%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <motion.div
          variants={containerIn}
          initial="hidden"
          animate="show"
          className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10"
        >
          {/* Brand panel */}
          <div className="hidden lg:block">
            <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-10 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_25%,rgba(34,211,238,0.16),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(217,70,239,0.14),transparent_50%)]" />

              <div className="relative flex h-full flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-sm font-extrabold tracking-tight">
                      R4
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/60">
                        Dashboard access
                      </p>
                      <p className="text-sm text-white/70">OTP-first secure login</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h1 className="text-4xl font-semibold tracking-tight">
                      Premium sign-in,
                      <span className="block bg-gradient-to-r from-cyan-200 via-sky-200 to-emerald-200 bg-clip-text text-transparent">
                        with smooth verification.
                      </span>
                    </h1>
                    <p className="max-w-md text-sm text-white/65">
                      Minimal UI. Subtle motion. Clear steps. Built to feel fast and trustworthy.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Pill active={stepIndex === 0} done={stepIndex > 0}>Email</Pill>
                    <Pill active={stepIndex === 1} done={stepIndex > 1}>OTP</Pill>
                    <Pill active={stepIndex === 2} done={false}>Password</Pill>
                  </div>
                </div>

                <div className="relative mt-10 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-white/60">
                  Use a one-time code to verify identity, then continue with an encrypted session token.
                </div>
              </div>
            </div>
          </div>

          {/* Form card */}
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl bg-white/[0.03] blur-2xl" />

            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/45 backdrop-blur-xl">
              <div className="px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
                      Authentication
                    </p>
                    <h2 className="text-2xl font-semibold tracking-tight">{StepTitle}</h2>
                    <p className="text-sm text-white/60">
                      Continue with email and a one-time passcode.
                    </p>
                  </div>

                  <div className="hidden sm:flex flex-col items-end gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/60">
                      Step {stepIndex + 1} / 3
                    </span>
                    <div className="flex gap-2">
                      <Pill active={stepIndex === 0} done={stepIndex > 0}>1</Pill>
                      <Pill active={stepIndex === 1} done={stepIndex > 1}>2</Pill>
                      <Pill active={stepIndex === 2} done={false}>3</Pill>
                    </div>
                  </div>
                </div>

                {/* Banners */}
                <div className="mt-5 space-y-3">
                  <AnimatePresence mode="wait" initial={false}>
                    {error ? (
                      <motion.div
                        key={`err-${error}`}
                        variants={bannerError}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        role="alert"
                        aria-live="assertive"
                        className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-300" />
                          <p className="leading-snug">{error}</p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence mode="wait" initial={false}>
                    {flash ? (
                      <motion.div
                        key={`ok-${flash}`}
                        variants={bannerSuccess}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300" />
                          <p className="leading-snug">{flash}</p>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <form onSubmit={onSubmit} className="mt-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {step === "enter" && (
                      <motion.div
                        key="step-enter"
                        variants={stepSwap}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="space-y-5"
                      >
                        <Field label="Work email" hint="OTP login">
                          <div className="group relative">
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="name@example.com"
                              required
                              autoComplete="email"
                              inputMode="email"
                              enterKeyHint="go"
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/35 outline-none transition duration-200 ease-out
                                         focus:border-cyan-300/40 focus:bg-white/7 focus:ring-4 focus:ring-cyan-300/10
                                         focus:scale-[1.02] motion-reduce:focus:scale-100"
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[11px] text-white/35">
                              Secure
                            </div>
                          </div>
                        </Field>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                          disabled={loading}
                          className="relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-400/90 via-sky-400/90 to-emerald-300/90 px-4 py-3 text-sm font-semibold text-slate-950
                                     shadow-lg shadow-cyan-500/15 transition
                                     disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/80 border-t-transparent" />
                              Sending code…
                            </>
                          ) : (
                            "Send OTP"
                          )}
                        </motion.button>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-white/50">
                            By continuing, acceptance of Terms & Privacy Policy is implied.
                          </p>

                          <button
                            type="button"
                            onClick={() => alert("Coming soon")}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 transition hover:bg-white/10 hover:text-white"
                          >
                            Google (soon)
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {step === "otp" && (
                      <motion.div
                        key="step-otp"
                        variants={stepSwap}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="space-y-5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-white/50">Email</p>
                            <p className="truncate text-sm font-medium text-white/90">{email}</p>
                          </div>
                          <button
                            type="button"
                            onClick={resetToEmailStep}
                            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/70 transition hover:bg-white/10 hover:text-white"
                          >
                            Change
                          </button>
                        </div>

                        {devOtp && import.meta?.env?.DEV ? (
                          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-[12px] text-emerald-50">
                            Dev only OTP:{" "}
                            <span className="font-mono font-semibold tracking-[0.25em]">{devOtp}</span>
                          </div>
                        ) : null}

                        <Field label="Enter 6-digit code" hint="Paste supported">
                          <div
                            className="grid grid-cols-6 gap-2 sm:gap-2.5"
                            onPaste={onOtpPaste}
                          >
                            {otpInputs.map((v, i) => (
                              <input
                                key={i}
                                ref={(el) => (otpRefs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="one-time-code"
                                enterKeyHint={i === 5 ? "done" : "next"}
                                maxLength={1}
                                value={v}
                                onChange={(e) => onOtpChange(i, e.target.value)}
                                onKeyDown={(e) => onOtpKeyDown(i, e)}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 text-center text-lg font-semibold text-white/90 outline-none transition duration-200 ease-out
                                           focus:border-cyan-300/40 focus:bg-white/7 focus:ring-4 focus:ring-cyan-300/10
                                           focus:scale-[1.03] motion-reduce:focus:scale-100"
                              />
                            ))}
                          </div>
                        </Field>

                        <div className="flex items-center justify-between gap-3 text-xs text-white/55">
                          <button
                            type="button"
                            onClick={resendOtp}
                            disabled={!canResend}
                            className={[
                              "font-medium transition",
                              canResend
                                ? "text-cyan-200 hover:text-cyan-100"
                                : "cursor-not-allowed text-white/30",
                            ].join(" ")}
                          >
                            {canResend ? "Resend code" : `Resend in ${resendIn}s`}
                          </button>
                          <span className="text-right">Check spam/junk if missing.</span>
                        </div>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: loading ? 1 : 1.01 }}
                          whileTap={{ scale: loading ? 1 : 0.985 }}
                          disabled={loading || !isOtpReady}
                          className="relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white
                                     shadow-lg shadow-black/20 transition
                                     hover:bg-white/12 active:bg-white/14
                                     disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                              Verifying…
                            </>
                          ) : (
                            "Verify OTP"
                          )}
                        </motion.button>
                      </motion.div>
                    )}

                    {step === "setPassword" && (
                      <motion.div
                        key="step-password"
                        variants={stepSwap}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="space-y-5"
                      >
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-xs text-white/50">Verified email</p>
                          <p className="text-sm font-medium text-white/90">{email}</p>
                        </div>

                        <Field label="Full name">
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full name"
                            required
                            autoComplete="name"
                            enterKeyHint="next"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/90 placeholder:text-white/35 outline-none transition duration-200 ease-out
                                       focus:border-cyan-300/40 focus:bg-white/7 focus:ring-4 focus:ring-cyan-300/10
                                       focus:scale-[1.02] motion-reduce:focus:scale-100"
                          />
                        </Field>

                        <Field label="Create password" hint="Min 6 characters">
                          <div className="relative">
                            <input
                              type={showPwd ? "text" : "password"}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              required
                              minLength={6}
                              autoComplete="new-password"
                              enterKeyHint="done"
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 pr-16 text-sm text-white/90 placeholder:text-white/35 outline-none transition duration-200 ease-out
                                         focus:border-cyan-300/40 focus:bg-white/7 focus:ring-4 focus:ring-cyan-300/10
                                         focus:scale-[1.02] motion-reduce:focus:scale-100"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPwd((s) => !s)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                            >
                              {showPwd ? "Hide" : "Show"}
                            </button>
                          </div>
                        </Field>

                        <motion.button
                          type="submit"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                          disabled={loading}
                          className="relative inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-300/90 via-cyan-300/90 to-sky-300/90 px-4 py-3 text-sm font-semibold text-slate-950
                                     shadow-lg shadow-emerald-500/10 transition
                                     disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/80 border-t-transparent" />
                              Saving…
                            </>
                          ) : (
                            "Set password & continue"
                          )}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>
            </div>

            <p className="mt-4 text-center text-[11px] text-white/40">
              Protected login with OTP verification and secure tokens.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

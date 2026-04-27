import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Check, X } from "lucide-react";

const HERO_PHOTO = "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=85&auto=format&fit=crop";

export default function Login() {
  const [tab, setTab] = useState("signin"); // signin | signup
  const [mode, setMode] = useState("password"); // password | otp — for signin

  // Sign in (password)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Sign up
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupRole, setSignupRole] = useState("user"); // user | owner
  const [agree, setAgree] = useState(false);

  // OTP
  const [otpEmail, setOtpEmail] = useState("");
  const [otpInputs, setOtpInputs] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpNewUser, setOtpNewUser] = useState(false);
  const [otpResendIn, setOtpResendIn] = useState(0);
  const [devOtp, setDevOtp] = useState("");
  const otpRefs = useRef(Array.from({ length: 6 }, () => null));

  // Set-password (post-OTP for new users)
  const [pwName, setPwName] = useState("");
  const [pwValue, setPwValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const from = location.state?.from || "/";

  useEffect(() => {
    if (!otpResendIn) return;
    const t = setInterval(() => setOtpResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpResendIn]);

  const afterAuth = (data) => {
    if (keepSignedIn) localStorage.setItem("token", data.token);
    else sessionStorage.setItem("token", data.token);
    login(data);
    navigate(from, { replace: true });
  };

  const clearBanner = () => {
    setError("");
    setFlash("");
  };

  // Password sign in
  const handleSignIn = async (e) => {
    e.preventDefault();
    clearBanner();
    if (!email || !password) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      afterAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  // Sign up
  const handleSignUp = async (e) => {
    e.preventDefault();
    clearBanner();
    const name = `${firstName} ${lastName}`.trim();
    if (!name || !signupEmail || !signupPassword) {
      setError("Please fill name, email, and password.");
      return;
    }
    if (signupPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!agree) {
      setError("Please agree to the Terms & Privacy Policy.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/register", {
        name,
        email: signupEmail,
        password: signupPassword,
        contact: signupPhone,
        role: signupRole,
      });
      localStorage.setItem("token", res.data.token);
      afterAuth(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  // OTP flow
  const sendOtp = async (e) => {
    if (e) e.preventDefault();
    clearBanner();
    if (!otpEmail) {
      setError("Enter your email for OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/send-otp", { email: otpEmail });
      setOtpSent(true);
      setDevOtp(res.data?.otp || "");
      setOtpResendIn(30);
      setOtpInputs(["", "", "", "", "", ""]);
      setFlash("Code sent. Check your inbox.");
      setTimeout(() => otpRefs.current?.[0]?.focus?.(), 80);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    clearBanner();
    const otp = otpInputs.join("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", { email: otpEmail, otp });
      if (res.data?.newUser) {
        setOtpNewUser(true);
        setFlash("Verified. Create a password to finish.");
      } else {
        localStorage.setItem("token", res.data.token);
        afterAuth(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    clearBanner();
    if (!pwName.trim() || pwValue.length < 6) {
      setError("Full name and 6+ character password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await API.post("/auth/set-password", { email: otpEmail, name: pwName, password: pwValue });
      localStorage.setItem("token", res.data.token);
      afterAuth(res.data);
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

  const onOtpKey = (i, e) => {
    if (e.key === "Backspace" && !otpInputs[i] && i > 0) otpRefs.current[i - 1]?.focus?.();
  };

  const onOtpPaste = (e) => {
    const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtpInputs(next);
    requestAnimationFrame(() => otpRefs.current[Math.min(text.length, 5)]?.focus?.());
  };

  return (
    <div className="h-screen grid grid-cols-1 lg:grid-cols-2 bg-paper overflow-hidden">
      {/* LEFT — form */}
      <div className="px-6 py-10 md:px-12 md:py-10 flex flex-col overflow-y-auto scrollbar-hide">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center text-paper font-display text-[18px] leading-none">R</span>
          <span className="font-semibold text-ink text-[17px]">Rentora</span>
        </Link>

        <div className="flex-1 flex items-center">
          <div className="w-full max-w-[420px] mx-auto">
            <p className="font-eyebrow text-[color:var(--muted)]">{tab === "signup" ? "Create account" : "Welcome back"}</p>
            <h1 className="font-display text-[36px] md:text-[44px] mt-2 leading-[1.02]">Find your next quiet room.</h1>
            <p className="mt-3 text-[color:var(--muted)] text-[14px]">
              {tab === "signup"
                ? "Make a Rentora account to save homes, schedule visits, and chat with owners."
                : "Sign in to see saved homes, messages, and bookings."}
            </p>

            {/* Tabs */}
            <div className="mt-8 inline-flex bg-card border border-rule rounded-full p-1 gap-0.5">
              {[
                { k: "signin", label: "Sign in" },
                { k: "signup", label: "Create account" },
              ].map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => { setTab(t.k); setMode("password"); setOtpSent(false); setOtpNewUser(false); clearBanner(); }}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium transition ${
                    tab === t.k ? "bg-ink text-paper" : "text-[color:var(--muted)] hover:text-ink"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Banners */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                <p className="leading-snug">{error}</p>
              </div>
            )}
            {flash && (
              <div className="mt-5 rounded-xl border border-sage/30 bg-sage-soft px-4 py-3 text-sm text-sage-hover flex items-start gap-2">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-sage shrink-0" />
                <p className="leading-snug">{flash}</p>
              </div>
            )}

            {/* SIGN IN */}
            {tab === "signin" && mode === "password" && (
              <form onSubmit={handleSignIn} className="mt-6 flex flex-col gap-4">
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-eyebrow text-[11px] text-[color:var(--muted)]">Password</label>
                    <button type="button" className="text-[11px] text-[color:var(--muted)] hover:text-ink underline underline-offset-2">Forgot?</button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <label className="flex items-center gap-2 text-[13px] text-ink cursor-pointer">
                  <input
                    type="checkbox"
                    checked={keepSignedIn}
                    onChange={(e) => setKeepSignedIn(e.target.checked)}
                    className="w-4 h-4 accent-[color:var(--ink)]"
                  />
                  Keep me signed in
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-60"
                >
                  {loading ? "Signing in…" : "Sign in"}
                </button>

                <div className="flex items-center gap-3 text-[color:var(--muted)] text-[12px] my-1">
                  <div className="flex-1 h-px bg-rule" />
                  or continue with
                  <div className="flex-1 h-px bg-rule" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition"
                    onClick={() => setFlash("Google sign-in coming soon.")}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode("otp"); setOtpEmail(email); clearBanner(); }}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-full bg-card border border-rule text-ink text-sm font-medium hover:border-ink transition"
                  >
                    Email OTP
                  </button>
                </div>
              </form>
            )}

            {/* OTP flow (alt) */}
            {tab === "signin" && mode === "otp" && !otpSent && (
              <form onSubmit={sendOtp} className="mt-6 flex flex-col gap-4">
                <div className="rounded-xl border border-rule bg-paper p-3 flex items-center justify-between">
                  <span className="text-[13px] text-[color:var(--muted)]">Signing in with email OTP</span>
                  <button type="button" onClick={() => setMode("password")} className="text-[11px] text-ink underline underline-offset-2">Use password instead</button>
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-60"
                >
                  {loading ? "Sending code…" : "Send OTP"}
                </button>
              </form>
            )}

            {tab === "signin" && mode === "otp" && otpSent && !otpNewUser && (
              <form onSubmit={verifyOtp} className="mt-6 flex flex-col gap-4">
                <div className="rounded-xl border border-rule bg-paper p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] text-[color:var(--muted)]">Email</p>
                    <p className="truncate text-[14px] font-medium">{otpEmail}</p>
                  </div>
                  <button type="button" onClick={() => { setOtpSent(false); setOtpInputs(["","","","","",""]); }} className="shrink-0 text-[11px] underline underline-offset-2">Change</button>
                </div>
                {devOtp && import.meta?.env?.DEV && (
                  <div className="rounded-xl border border-sage/30 bg-sage-soft px-4 py-2.5 text-[12px] text-sage-hover">
                    Dev OTP: <span className="font-mono font-semibold tracking-[0.25em]">{devOtp}</span>
                  </div>
                )}
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Enter 6-digit code</label>
                  <div className="grid grid-cols-6 gap-2" onPaste={onOtpPaste}>
                    {otpInputs.map((v, i) => (
                      <input
                        key={i}
                        ref={(el) => (otpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={v}
                        onChange={(e) => onOtpChange(i, e.target.value)}
                        onKeyDown={(e) => onOtpKey(i, e)}
                        className="h-12 w-full rounded-xl border border-rule bg-card text-center text-lg font-semibold focus:outline-none focus:border-ink transition"
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={otpResendIn > 0}
                    className={otpResendIn > 0 ? "text-[color:var(--muted)] cursor-not-allowed" : "text-accent underline underline-offset-2"}
                  >
                    {otpResendIn > 0 ? `Resend in ${otpResendIn}s` : "Resend code"}
                  </button>
                  <span className="text-[color:var(--muted)]">Check spam if missing.</span>
                </div>
                <button
                  type="submit"
                  disabled={loading || otpInputs.join("").length !== 6}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-60"
                >
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
              </form>
            )}

            {tab === "signin" && mode === "otp" && otpSent && otpNewUser && (
              <form onSubmit={handleSetPassword} className="mt-6 flex flex-col gap-4">
                <div className="rounded-xl border border-rule bg-paper p-3">
                  <p className="text-[11px] text-[color:var(--muted)]">Verified email</p>
                  <p className="text-[14px] font-medium">{otpEmail}</p>
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Full name</label>
                  <input
                    value={pwName}
                    onChange={(e) => setPwName(e.target.value)}
                    placeholder="Ananya Sharma"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Create password</label>
                  <input
                    type="password"
                    value={pwValue}
                    onChange={(e) => setPwValue(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-60"
                >
                  {loading ? "Saving…" : "Set password & continue"}
                </button>
              </form>
            )}

            {/* SIGN UP */}
            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">First name</label>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ananya"
                      className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                    />
                  </div>
                  <div>
                    <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Last name</label>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Sharma"
                      className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Phone</label>
                  <input
                    type="tel"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">Password</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-rule bg-card px-4 py-3 text-[14px] focus:outline-none focus:border-ink transition"
                  />
                </div>
                <div>
                  <label className="block font-eyebrow text-[11px] text-[color:var(--muted)] mb-1.5">I am looking to</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { k: "user", label: "Rent a home" },
                      { k: "owner", label: "List my home" },
                    ].map((r) => (
                      <button
                        type="button"
                        key={r.k}
                        onClick={() => setSignupRole(r.k)}
                        className={`inline-flex items-center justify-center rounded-full px-3 py-3 text-[13px] border transition ${
                          signupRole === r.k ? "bg-ink text-paper border-ink" : "bg-card border-rule text-ink hover:border-ink"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-start gap-2 text-[12px] text-[color:var(--muted)] leading-relaxed cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={(e) => setAgree(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[color:var(--ink)]"
                  />
                  I agree to the Terms of Service and Privacy Policy.
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition disabled:opacity-60"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-[12px] text-[color:var(--muted)]">&copy; 2026 Rentora &middot; Indore</div>
      </div>

      {/* RIGHT — photo panel */}
      <div className="relative bg-ink overflow-hidden hidden lg:block">
        <img src={HERO_PHOTO} alt="" className="w-full h-full object-cover opacity-55" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(31,36,32,.85))" }} />
        <div className="absolute inset-0 p-12 flex flex-col justify-between text-paper">
          <span className="inline-flex items-center rounded-full px-3.5 py-1.5 text-xs bg-paper/15 border border-paper/20 text-paper self-start">
            Since 2022 &middot; Indore
          </span>
          <div>
            <p className="font-display text-[32px] md:text-[40px] leading-[1.1] max-w-[460px]">
              &ldquo;Found my flat in Palasia in 3 days. No broker calls, no fake photos.&rdquo;
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-medium">A</div>
              <div>
                <div className="text-[14px]">Ananya Sharma</div>
                <div className="text-[12px] opacity-70">Designer &middot; moved in Sept 2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

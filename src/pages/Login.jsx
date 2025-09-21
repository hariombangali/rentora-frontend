import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

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

  const startResendTimer = () => setResendIn(30);

  // Step 1: Send OTP
  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email");
    setLoading(true);
    try {
      const res = await API.post("/auth/send-otp", { email });
      setLoading(false);
      setStep("otp");
      setDevOtp(res.data?.otp || "");
      startResendTimer();
      // For dev visibility; keep alert if desired:
      // alert("Dummy OTP: " + res.data.otp);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Failed to send OTP");
    }
  };

  const resendOtp = async () => {
    if (!canResend || !email) return;
    setError("");
    try {
      const res = await API.post("/auth/send-otp", { email });
      setDevOtp(res.data?.otp || "");
      setOtpInputs(["", "", "", "", "", ""]);
      otpRefs.current?.[0]?.focus();
      startResendTimer();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    }
  };

  // Step 2: Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });
      setLoading(false);
      if (res.data.newUser) {
        setStep("setPassword");
      } else {
        localStorage.setItem("token", res.data.token);
        login(res.data);
        navigate("/");
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Invalid OTP");
    }
  };

  // Step 3: Set Password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/set-password", { email, name, password });
      setLoading(false);
      localStorage.setItem("token", res.data.token);
      login(res.data);
      navigate("/");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Failed to set password");
    }
  };

  const onOtpChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otpInputs];
    next[i] = v;
    setOtpInputs(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  const onOtpKeyDown = (i, e) => {
    if (e.key === "Backspace" && !otpInputs[i] && i > 0) {
      otpRefs.current[i - 1]?.focus();
    }
  };

  const onOtpPaste = (e) => {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtpInputs(next);
    const focusIndex = Math.min(text.length, 5);
    requestAnimationFrame(() => otpRefs.current[focusIndex]?.focus());
  };

  const StepTitle = useMemo(() => {
    if (step === "enter") return "Enter Email";
    if (step === "otp") return "Verify OTP";
    return "Set Password";
  }, [step]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-100 px-3 sm:px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Stepper */}
        <ol className="flex items-center justify-center gap-3 mb-5 text-xs sm:text-sm">
          {["enter", "otp", "setPassword"].map((s, idx) => {
            const activeIndex = ["enter", "otp", "setPassword"].indexOf(step);
            const isDone = idx < activeIndex;
            const isActive = idx === activeIndex;
            return (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={[
                    "w-6 h-6 rounded-full grid place-items-center font-bold",
                    isActive ? "bg-blue-600 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-gray-200 text-gray-600",
                  ].join(" ")}
                >
                  {idx + 1}
                </span>
                <span className={isActive ? "text-blue-700 font-semibold" : "text-gray-600"}>
                  {s === "enter" ? "Email" : s === "otp" ? "OTP" : "Password"}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Card */}
        <form
          onSubmit={step === "enter" ? sendOtp : step === "otp" ? verifyOtp : handleSetPassword}
          className="w-full bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100 px-5 sm:px-8 py-8 flex flex-col gap-5"
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-blue-800">{StepTitle}</h2>
            <p className="text-gray-500 text-sm mt-1">Secure login with email and OTP</p>
          </div>

          {error && (
            <div role="alert" aria-live="assertive" className="bg-red-100 text-red-700 p-2 rounded text-center text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Enter Email */}
          {step === "enter" && (
            <>
              <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                enterKeyHint="go"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl px-4 py-3 font-semibold transition"
              >
                {loading ? "Sending..." : "Send OTP →"}
              </button>

              {/* Optional social sign-in placeholder */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-500">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                type="button"
                className="w-full bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 rounded-xl px-4 py-3 font-semibold"
                onClick={() => alert("Coming soon")}
              >
                Continue with Google
              </button>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === "otp" && (
            <>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Email: <span className="font-semibold">{email}</span>
                </div>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline"
                  onClick={() => setStep("enter")}
                >
                  Change
                </button>
              </div>

              {/* Dev OTP hint (for testing) */}
              {devOtp && (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">
                  Dev: OTP {devOtp}
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700">Enter 6‑digit OTP</label>
              <div className="flex justify-between gap-2" onPaste={onOtpPaste}>
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
                    className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={!canResend}
                  className={`font-semibold ${canResend ? "text-blue-600 hover:underline" : "text-gray-400"}`}
                >
                  {canResend ? "Resend OTP" : `Resend in ${resendIn}s`}
                </button>
                <span className="text-gray-500">Didn’t receive? Check spam</span>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl px-4 py-3 font-semibold transition"
              >
                {loading ? "Verifying..." : "Verify OTP →"}
              </button>
            </>
          )}

          {/* Step 3: Set Password */}
          {step === "setPassword" && (
            <>
              <div className="text-sm text-gray-700">
                Email: <span className="font-semibold">{email}</span>
              </div>

              <label className="block text-sm font-medium text-gray-700" htmlFor="fullName">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                enterKeyHint="next"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <label className="block text-sm font-medium text-gray-700" htmlFor="newPassword">
                Set Password
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPwd ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  enterKeyHint="done"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-16 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-semibold"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl px-4 py-3 font-semibold transition"
              >
                {loading ? "Saving..." : "Set Password & Continue →"}
              </button>
            </>
          )}
        </form>

        {/* Footer helper */}
        <p className="text-center text-xs text-gray-500 mt-4">
          By continuing, acceptance of Terms and Privacy Policy is implied.
        </p>
      </div>
    </div>
  );
}

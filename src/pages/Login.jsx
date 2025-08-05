import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api"; // ✅ Make sure path is correct
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [step, setStep] = useState("enter"); // enter, login, register
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const { login } = useAuth();

  // ✅ Step 1: Check if user exists
  const checkUser = async () => {
    setError("");
    if (!email) return setError("Please enter your email or phone.");
    setLoading(true);

    try {
      const res = await API.get(`/auth/check-user?email=${email}`);
      setLoading(false);

      if (res.data.exists) setStep("login");
      else setStep("register");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Network error. Try again later.");
    }
  };

  // ✅ Step 2: Login or Register
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = step === "login" ? "/auth/login" : "/auth/register";
    const payload = step === "login" ? { email, password } : { name, email, password };

    try {
      const res = await API.post(endpoint, payload);
      setLoading(false);

      localStorage.setItem("token", res.data.token);

      const userData = {
        email: res.data.email || email,
        name: res.data.name || name,
        role: res.data.role, // must have role: "user" | "owner" | "admin"
        token: res.data.token, // optional, if you want to keep in context
      };
      login(userData);

      if (res.data.role === "owner") navigate("/my-properties");
      else if (res.data.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || "Authentication failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-yellow-100 px-2">
      <form
        onSubmit={step !== "enter" ? handleSubmit : (e) => { e.preventDefault(); checkUser(); }}
        className="w-full max-w-md bg-white/70 backdrop-blur-lg rounded-2xl shadow-2xl px-8 py-10 border border-blue-100 flex flex-col gap-6 animate-fade-in"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-800">
            {step === "enter" ? "Welcome" : step === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-sm text-gray-500">
            {step === "enter"
              ? "Continue to Room4Rent Indore"
              : step === "login"
                ? "Enter your password"
                : "Complete your registration"}
          </p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-2 rounded text-center text-sm">{error}</div>}

        {step === "enter" && (
          <>
            <input
              type="email"
              placeholder="Enter email or phone"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-style"
            />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Checking..." : "Continue →"}
            </button>
          </>
        )}

        {step === "login" && (
          <>
            <div className="text-left text-sm text-blue-700">Email: <strong>{email}</strong></div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-style"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-3 text-blue-500"
              >
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Logging in..." : "Login →"}
            </button>
          </>
        )}

        {step === "register" && (
          <>
            <div className="text-left text-sm text-blue-700">New User: <strong>{email}</strong></div>
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-style"
            />
            <input
              type={showPwd ? "text" : "password"}
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-style"
            />
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Registering..." : "Register & Login →"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}

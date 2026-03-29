import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getApiErrorMessage } from "../utils/apiError";

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await register(form);
      navigate("/verify");
    } catch (error) {
      showToast({
        tone: "danger",
        title: "Registration failed",
        message: getApiErrorMessage(error, "Please review your details.")
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background-dark font-display text-slate-100">
      <div
        className="min-h-screen bg-background-dark"
        style={{
          backgroundImage:
            "radial-gradient(at 0% 0%, rgba(60, 131, 246, 0.18) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(139, 92, 246, 0.14) 0px, transparent 50%)"
        }}
      >
        <div className="flex min-h-screen items-center justify-center px-6 py-12">
          <form
            className="w-full max-w-md rounded-[2rem] p-8"
            onSubmit={handleSubmit}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Passenger Signup</span>
            <h1 className="mt-4 text-4xl font-black tracking-tight">Create Account</h1>
            <p className="mt-3 text-slate-400">
              Register first, then verify your journey against the seeded records.
            </p>

            <div className="mt-8 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Full name</span>
                <input
                  className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40"
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                  type="text"
                  value={form.name}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Email</span>
                <input
                  className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40"
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  type="email"
                  value={form.email}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">Password</span>
                <input
                  className="h-14 w-full rounded-xl border border-slate-700 bg-slate-900/50 px-4 text-slate-100 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/40"
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required
                  type="password"
                  value={form.password}
                />
              </label>
            </div>

            <button
              className="mt-8 h-14 w-full rounded-xl bg-primary text-lg font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>

            <div className="mt-6 flex items-center justify-between text-sm text-slate-400">
              <span>Already registered?</span>
              <Link className="font-bold text-primary" to="/login">
                Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;

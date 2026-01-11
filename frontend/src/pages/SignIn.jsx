import PageWrapper from "../components/PageWrapper";
import { useState } from "react";
import { motion } from "framer-motion";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/login", { email, password });
      const data = res.data || {};

      if (data.access_token) {
        localStorage.setItem("auth_token", data.access_token);
        localStorage.setItem("auth_user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("authChanged"));
        navigate("/dashboard");
      } else {
        setError("Login failed");
      }
    } catch (err) {
      setError("Invalid credentials");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="mx-auto max-w-md px-8 pt-24 pb-20">
        <motion.h1 className="text-3xl font-bold mb-6 text-center">
          Sign In
        </motion.h1>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl bg-white/5 border border-white/10 p-6 space-y-4 overflow-hidden"
        >
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-white/70 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@microhard.local"
              className="w-full box-border rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-white/70 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="demo123"
              className="w-full box-border rounded-lg bg-white/10 border border-white/20 px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 px-4 py-3 text-black font-semibold disabled:opacity-50 transition"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </PageWrapper>
  );
}

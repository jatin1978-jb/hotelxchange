"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lock, UserCheck, Sparkles, ShieldCheck, ArrowRight, Hotel, AlertCircle } from "lucide-react";

export default function StaffLoginPage() {
  const router = useRouter();

  const [branding, setBranding] = useState<any>(null);
  const [identifier, setIdentifier] = useState("HK1001");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((data) => {
        if (data.branding) setBranding(data.branding);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/auth/staff-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Save session locally
        localStorage.setItem("hx_staff_user", JSON.stringify(data.user));
        localStorage.setItem("hx_staff_token", data.token);

        // Redirect based on role
        if (data.user.role === "SUPERVISOR" || data.user.role === "OPERATIONS_MANAGER") {
          router.push("/supervisor");
        } else if (data.user.role === "PROPERTY_ADMIN" || data.user.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/staff");
        }
      } else {
        setErrorMessage(data.error || "Login failed. Please check your Staff ID.");
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMessage("Network error connecting to hotel authentication.");
      setSubmitting(false);
    }
  };

  const primaryColor = branding?.primaryColor || "#0A4D7E";
  const secondaryColor = branding?.secondaryColor || "#B89759";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4">
      <div className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
        {/* Hotel Branding Header */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-3xl bg-white p-3 mx-auto shadow-2xl flex items-center justify-center border-2 border-[#B89759]">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt={branding.hotelName}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <Hotel className="w-10 h-10 text-[#0A4D7E]" />
            )}
          </div>

          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {branding?.hotelName || "Fortune Park Hotel"}
            </h1>
            <p className="text-xs text-[#B89759] font-bold tracking-widest uppercase mt-0.5">
              {branding?.staffPortalTitle || "HotelXchange Operations"}
            </p>
          </div>

          <p className="text-xs text-slate-400">
            {branding?.loginWelcomeText || "Welcome to Fortune Park Hotel"}
          </p>
        </div>

        {/* Staff Login Card */}
        <form
          onSubmit={handleLogin}
          className="bg-slate-900/90 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-4 backdrop-blur-md"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Employee Staff ID / Email
            </label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. HK1001, FB2001, EN3001"
              className="w-full text-sm p-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B89759] font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Password / PIN
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-sm p-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B89759]"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl hover:bg-[#a38243] transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            {submitting ? (
              "Authenticating Staff..."
            ) : (
              <>
                <span>Sign In to Workstation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Staff Presets */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-[#B89759] uppercase tracking-wider block">
              Quick Demo Staff Login Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <button
                type="button"
                onClick={() => {
                  setIdentifier("HK1001");
                  setPassword("password123");
                }}
                className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-left"
              >
                HK1001 (Ahmed - Floor 10)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("HK1002");
                  setPassword("password123");
                }}
                className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-left"
              >
                HK1002 (Maria - Floor 10)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("FB2001");
                  setPassword("password123");
                }}
                className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-left"
              >
                FB2001 (Sarah - F&B Mgr)
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdentifier("HK1004");
                  setPassword("password123");
                }}
                className="p-1.5 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 text-left"
              >
                HK1004 (David - HK Sup)
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Subtle Powered by HotelXchange Footer */}
      <footer className="text-center pb-4 text-xs text-slate-500">
        <p>{branding?.footerText || "© 2026 Fortune Park Hotel • Powered by HotelXchange"}</p>
        <span className="text-[10px] text-slate-600 block mt-0.5">
          Multi-Tenant Hotel Operations Platform v2.0
        </span>
      </footer>
    </div>
  );
}

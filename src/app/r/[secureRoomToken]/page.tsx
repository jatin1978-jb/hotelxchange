"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ShieldCheck, AlertCircle, ArrowRight, Lock } from "lucide-react";

export default function RoomQrVerificationPage({
  params,
}: {
  params: Promise<{ secureRoomToken: string }>;
}) {
  const { secureRoomToken } = use(params);
  const router = useRouter();

  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/guest/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secureRoomToken,
          guestLastName: lastName.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push(`/guest/stay/${data.secureAccessToken}`);
      } else {
        setErrorMessage(
          data.error || "We couldn't verify your stay. Please check the details and try again."
        );
        setSubmitting(false);
      }
    } catch (err) {
      setErrorMessage("We couldn't verify your stay. Please check the details and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-[#0A4D7E]/40 border border-[#B89759]/40 flex items-center justify-center mx-auto text-[#B89759] shadow-xl">
            <Sparkles className="w-7 h-7" />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-[#B89759] uppercase block">
            HotelXchange Guest Engagement
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight">Verify Your Stay</h1>
          <p className="text-xs text-slate-400">
            Please enter your last name to access your in-room services & concierge companion.
          </p>
        </div>

        {/* Verification Card */}
        <form
          onSubmit={handleVerify}
          className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4 backdrop-blur-md"
        >
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Guest Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g. Sharma or Bhai"
              className="w-full text-sm p-3.5 bg-white/5 border border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B89759]"
              required
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enter the last name registered on your PMS check-in reservation.
            </span>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !lastName.trim()}
            className="w-full py-4 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl hover:bg-[#a38243] transition-colors flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {submitting ? (
              "Verifying Active Stay..."
            ) : (
              <>
                <span>Access My Stay</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Helper Banner */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center space-y-1">
          <span className="text-[10px] font-bold text-[#B89759] uppercase tracking-wider block">
            Section 19 Demo Hint
          </span>
          <p className="text-xs text-slate-300">
            Enter <strong className="text-white font-bold">Sharma</strong> for Room 1204 (STAY-10045).
          </p>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" /> Secure Stay-Based Session • HotelXchange
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, Hotel, RefreshCw, ArrowRight } from "lucide-react";

export default function GuestIntakePage({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/guest/resolve-qr/${qrToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasActiveStay && data.secureAccessToken) {
          // Automatic friction-free redirect to MY STAY dashboard!
          router.replace(`/guest/stay/${data.secureAccessToken}`);
        } else {
          setRoomDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [qrToken, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#B89759] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Resolving Room QR & Active Stay...
          </p>
        </div>
      </div>
    );
  }

  // NO ACTIVE STAY DISPLAY
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        {/* Header Branding */}
        <div className="space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-[#B89759] shadow-xl">
            <Hotel className="w-8 h-8" />
          </div>
          <span className="text-[11px] font-bold tracking-widest text-[#B89759] uppercase block">
            {roomDetails?.propertyName || "HotelXchange"} • Room {roomDetails?.roomNumber || ""}
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">No Active Guest Stay</h1>
        </div>

        {/* Status Card */}
        <div className="bg-slate-900/90 border border-white/10 p-6 rounded-3xl shadow-2xl space-y-4 backdrop-blur-md">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            No active guest stay is currently associated with Room{" "}
            <strong className="text-white">{roomDetails?.roomNumber}</strong>.
          </p>

          <p className="text-[11px] text-slate-400">
            If you have just checked in, please contact Front Desk to synchronize your stay details.
          </p>
        </div>

        <div className="pt-2">
          <Link
            href="/frontdesk"
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0A4D7E] text-white font-bold text-xs rounded-2xl hover:bg-[#083e66] transition-colors shadow-lg"
          >
            <span>Open Front Desk PMS Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-slate-500">
            Permanent Room QR Asset • HotelXchange
          </span>
        </div>
      </div>
    </div>
  );
}

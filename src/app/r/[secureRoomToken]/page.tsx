"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, AlertCircle, Building, Hotel, RefreshCw } from "lucide-react";

export default function RoomQrVerificationPage({
  params,
}: {
  params: Promise<{ secureRoomToken: string }>;
}) {
  const { secureRoomToken } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [hasActiveStay, setHasActiveStay] = useState<boolean | null>(null);
  const [roomDetails, setRoomDetails] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/guest/resolve-qr/${secureRoomToken}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.hasActiveStay && data.secureAccessToken) {
          // Automatic seamless redirect to active stay dashboard!
          router.replace(`/guest/stay/${data.secureAccessToken}`);
        } else {
          setHasActiveStay(false);
          setRoomDetails(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        setErrorMessage("Network error resolving room stay context.");
        setLoading(false);
      });
  }, [secureRoomToken, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#B89759] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide text-slate-300">
            Resolving Room Context & Active Stay...
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
            className="inline-flex items-center gap-2 px-5 py-3 bg-[#0A4D7E] text-white font-bold text-xs rounded-2xl hover:bg-[#083e66] transition-colors"
          >
            Open Front Desk PMS Console
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

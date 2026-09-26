"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Building,
  Star,
  ChevronLeft,
  AlertTriangle,
  RefreshCw,
  Utensils,
  ShieldAlert,
} from "lucide-react";

export default function GuestTrackingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState<number>(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);

  const fetchStatus = () => {
    fetch(`/api/guest/tracking/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Tracking link invalid or expired.");
        return res.json();
      })
      .then((d) => {
        setData(d);
        if (d.feedback) {
          setRating(d.feedback.rating1To5);
          setRatingSubmitted(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, [token]);

  const handleRatingSubmit = async (stars: number) => {
    setRating(stars);
    setSubmittingRating(true);

    try {
      const res = await fetch(`/api/guest/tracking/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: stars }),
      });
      const result = await res.json();
      if (result.success) {
        setRatingSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0A4D7E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading tracking status...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-sm shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 mb-1">Tracking Link Expired</h2>
          <p className="text-sm text-slate-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-[#0A4D7E] text-white text-xs font-bold rounded-xl"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const { request, orderLines, events, slaStatus } = data;
  const isCompleted = request.status === "COMPLETED" || request.status === "DELIVERED";
  const isFnb = request.type === "FNB";

  // Define steps
  const generalSteps = [
    { key: "SUBMITTED", label: "Submitted" },
    { key: "ACCEPTED", label: "Accepted by Staff" },
    { key: "IN_PROGRESS", label: "In Progress" },
    { key: "COMPLETED", label: "Fulfilled" },
  ];

  const fnbSteps = [
    { key: "SUBMITTED", label: "Order Submitted" },
    { key: "PREPARING", label: "Kitchen Preparing" },
    { key: "READY", label: "Ready for Delivery" },
    { key: "DELIVERED", label: "Delivered to Room" },
  ];

  const steps = isFnb ? fnbSteps : generalSteps;
  const getCurrentStepIndex = () => {
    const idx = steps.findIndex((s) => s.key === request.status);
    return idx === -1 ? 0 : idx;
  };
  const currentStepIdx = getCurrentStepIndex();

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Mobile Top Bar */}
      <div className="bg-[#0A4D7E] text-white p-5 rounded-b-3xl shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#B89759] font-medium tracking-wide uppercase">
              <Building className="w-3.5 h-3.5" />
              Room {request.roomNumber}
            </div>
            <h1 className="text-xl font-bold mt-0.5">{request.categoryName}</h1>
          </div>
          <button
            onClick={fetchStatus}
            className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-4 space-y-4">
        {/* Status Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 mb-2">
            {request.status.replace("_", " ")}
          </span>

          <h2 className="text-lg font-bold text-slate-900">
            {isCompleted
              ? "Request Fulfilled!"
              : request.status === "ACCEPTED"
              ? "Staff is on the way!"
              : request.status === "PREPARING"
              ? "Chef is preparing your order..."
              : "We have received your request"}
          </h2>

          <p className="text-xs text-slate-500 mt-1">
            Department: <span className="font-semibold text-slate-800">{request.departmentName}</span>
          </p>

          {/* SLA Indicator */}
          {!isCompleted && (
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="w-4 h-4 text-[#0A4D7E]" />
                <span>Estimated Target:</span>
              </div>
              <span className="font-bold text-[#0A4D7E]">
                ~{slaStatus.targetMinutes} minutes
              </span>
            </div>
          )}
        </div>

        {/* Progress Tracker Timeline */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
            Live Status Timeline
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((step, idx) => {
              const isPast = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;

              return (
                <div key={step.key} className="relative flex items-center justify-between">
                  <div
                    className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      isPast
                        ? "bg-[#0A4D7E] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <div>
                    <span
                      className={`text-xs font-bold block ${
                        isCurrent
                          ? "text-[#0A4D7E]"
                          : isPast
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] text-emerald-600 font-semibold animate-pulse">
                        Active step
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items (if F&B) */}
        {isFnb && orderLines && orderLines.length > 0 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#0A4D7E]" />
              Order Summary
            </h3>
            <div className="space-y-2 text-xs">
              {orderLines.map((line: any) => (
                <div key={line.id} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="font-bold text-slate-800">{line.quantity}x </span>
                    <span className="text-slate-700">{line.menuItem?.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    ${((line.menuItem?.displayPrice || 0) * line.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guest Details */}
        {request.details && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Submitted Note:
            </span>
            <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
              "{request.details}"
            </p>
          </div>
        )}

        {/* Optional 1-5 Star Feedback Rating (FR-021) */}
        {isCompleted && (
          <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/40 text-center shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Rate Your Experience</h3>
            <p className="text-xs text-slate-600 mb-3">
              How satisfied were you with our service?
            </p>

            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRatingSubmit(star)}
                  disabled={submittingRating}
                  className={`p-2 transition-transform active:scale-125 ${
                    star <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300"
                  }`}
                >
                  <Star className="w-7 h-7 fill-current" />
                </button>
              ))}
            </div>

            {ratingSubmitted && (
              <p className="text-xs font-semibold text-emerald-700 mt-2">
                Thank you for your rating! ({rating} / 5 Stars)
              </p>
            )}
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href={`/guest/room/room-101-demo`}
            className="text-xs font-semibold text-[#0A4D7E] hover:underline"
          >
            ← Submit Another Request
          </Link>
        </div>
      </div>
    </div>
  );
}

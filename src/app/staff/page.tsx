"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bell,
  RefreshCw,
  LogOut,
  Play,
  CheckSquare,
  Sparkles,
  Hotel,
  ShieldCheck,
  Send,
  Smartphone,
  X,
  Sliders,
} from "lucide-react";

export default function StaffQueuePage() {
  const [staffUser, setStaffUser] = useState<any>(null);
  const [branding, setBranding] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Status & Filter state
  const [availabilityStatus, setAvailabilityStatus] = useState<string>("AVAILABLE");
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<string>("default");

  const fetchStaffData = () => {
    fetch("/api/staff/requests")
      .then((res) => res.json())
      .then((d) => {
        setRequests(d.requests || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });

    fetch("/api/branding")
      .then((res) => res.json())
      .then((d) => {
        if (d.branding) setBranding(d.branding);
      });
  };

  useEffect(() => {
    // Check saved staff user in localStorage
    const saved = localStorage.getItem("hx_staff_user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setStaffUser(u);
        setAvailabilityStatus(u.availabilityStatus || "AVAILABLE");
        // Fetch notifications for staff member
        fetch(`/api/notifications?userId=${u.id}`)
          .then((res) => res.json())
          .then((nd) => setNotifications(nd.notifications || []));
      } catch (e) {}
    } else {
      // Default to Ahmed Khan (HK1001) demo staff if not logged in
      setStaffUser({
        id: "demo-ahmed-id",
        staffId: "HK1001",
        name: "Ahmed Khan",
        designation: "Room Attendant",
        departmentName: "Housekeeping",
        assignedFloors: "[10]",
      });
    }

    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }

    fetchStaffData();
    const interval = setInterval(fetchStaffData, 4000); // Live poll updates
    return () => clearInterval(interval);
  }, []);

  const handleStatusToggle = async (newStatus: string) => {
    setAvailabilityStatus(newStatus);
    if (staffUser?.id) {
      try {
        await fetch("/api/staff/availability", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: staffUser.id,
            status: newStatus,
          }),
        });

        const updated = { ...staffUser, availabilityStatus: newStatus };
        setStaffUser(updated);
        localStorage.setItem("hx_staff_user", JSON.stringify(updated));
      } catch (err) {
        console.error("Failed to update status:", err);
      }
    }
  };

  const handleRequestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted" && staffUser?.id) {
        // Register Device & Send Test Notification
        fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "REGISTER_DEVICE",
            userId: staffUser.id,
            deviceType: /Mobi|Android/i.test(navigator.userAgent) ? "MOBILE_ANDROID" : "DESKTOP",
          }),
        });

        new Notification("HotelXchange Notifications Enabled", {
          body: "You will now receive instant push alerts for new room service requests!",
          icon: branding?.logoUrl || "/favicon.ico",
        });
      }
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      const res = await fetch("/api/staff/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          userId: staffUser?.id || "demo-ahmed-id",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchStaffData();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      alert("Network error accepting request");
    }
  };

  const handleUpdateStatus = async (requestId: string, status: string) => {
    try {
      const res = await fetch("/api/staff/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          status,
          userId: staffUser?.id,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        fetchStaffData();
      } else {
        alert(data.error || "Status update failed");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#B89759] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-300">Loading Staff Workspace...</p>
        </div>
      </div>
    );
  }

  const myWork = requests.filter(
    (r) => r.currentAssigneeId === staffUser?.id || r.status === "SUBMITTED"
  );
  const unreadNotifs = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* HOTEL BRANDED STAFF HEADER */}
      <div className="bg-gradient-to-b from-[#0A4D7E] via-[#063050] to-slate-950 px-4 pt-6 pb-5 border-b border-white/10 rounded-b-[2rem] shadow-xl">
        <div className="max-w-4xl mx-auto">
          {/* Top Bar: Hotel Logo, Staff Identity, Notifications & Exit */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white p-1 flex items-center justify-center border border-[#B89759]">
                {branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt={branding.hotelName} className="max-h-full object-contain" />
                ) : (
                  <Hotel className="w-6 h-6 text-[#0A4D7E]" />
                )}
              </div>

              <div>
                <span className="text-[10px] font-extrabold tracking-widest text-[#B89759] uppercase block">
                  {branding?.hotelName || "Fortune Park Hotel"}
                </span>
                <h1 className="text-base font-extrabold text-white flex items-center gap-1.5">
                  {staffUser?.name || "Ahmed Khan"}
                  <span className="text-xs font-semibold text-slate-300">({staffUser?.staffId || "HK1001"})</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notification Drawer Trigger */}
              <button
                onClick={() => setShowNotificationDrawer(true)}
                className="relative p-2 rounded-xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4 text-[#B89759]" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
              </button>

              <Link
                href="/staff/login"
                className="p-2 rounded-xl bg-white/10 border border-white/15 text-slate-300 hover:text-white"
                title="Switch Staff / Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Availability Status Bar */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/15 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                availabilityStatus === "AVAILABLE" ? "bg-emerald-400 animate-pulse" :
                availabilityStatus === "BUSY" ? "bg-amber-400" :
                availabilityStatus === "ON_BREAK" ? "bg-indigo-400" : "bg-rose-400"
              }`}></span>
              <span className="text-xs font-bold text-white">Status: {availabilityStatus.replace("_", " ")}</span>
            </div>

            {/* Quick Availability Toggles */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleStatusToggle("AVAILABLE")}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  availabilityStatus === "AVAILABLE"
                    ? "bg-emerald-500 text-slate-950 shadow-md"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                AVAILABLE
              </button>
              <button
                onClick={() => handleStatusToggle("BUSY")}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  availabilityStatus === "BUSY"
                    ? "bg-amber-500 text-slate-950 shadow-md"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                BUSY
              </button>
              <button
                onClick={() => handleStatusToggle("ON_BREAK")}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${
                  availabilityStatus === "ON_BREAK"
                    ? "bg-indigo-500 text-white shadow-md"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                ON BREAK
              </button>
            </div>
          </div>

          {/* Browser / PWA Notification Banner if not granted */}
          {notificationPermission !== "granted" && (
            <div className="mt-3 bg-amber-500/15 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-amber-200">Enable Push Notifications for instant task alerts.</span>
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1.5 bg-[#B89759] text-slate-950 font-bold text-[11px] rounded-xl hover:bg-[#a38243]"
              >
                Allow Notifications
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* WORKSTREAM SUMMARY */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-white">Active Queue Workstation</h2>
            <p className="text-xs text-slate-400">Assigned requests for your current floor & department.</p>
          </div>
          <button
            onClick={fetchStaffData}
            className="p-2 rounded-xl bg-slate-900 border border-white/10 text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* WORK REQUEST CARDS */}
        {requests.length === 0 ? (
          <div className="bg-slate-900/80 border border-white/10 p-12 rounded-3xl text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">All Caught Up!</h3>
            <p className="text-xs text-slate-400">No pending room requests assigned to your queue.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const isAssignedToMe = req.currentAssigneeId === staffUser?.id;
              const isSubmitted = req.status === "SUBMITTED" || req.status === "UNASSIGNED";
              const isAccepted = req.status === "ACCEPTED" || req.status === "PREPARING";
              const isReady = req.status === "READY" || req.status === "IN_PROGRESS";
              const isCompleted = req.status === "COMPLETED" || req.status === "DELIVERED";

              return (
                <div
                  key={req.id}
                  className={`bg-slate-900/90 border p-5 rounded-3xl shadow-xl transition-all ${
                    isSubmitted
                      ? "border-amber-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20"
                      : isAccepted
                      ? "border-[#0A4D7E] bg-slate-900"
                      : "border-white/10 bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0A4D7E] text-white font-extrabold text-base flex items-center justify-center shadow-md">
                        {req.room?.roomNumber || "101"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-white">
                            {req.category?.name || "Service Request"}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            req.priority === "URGENT" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-blue-500/20 text-blue-300"
                          }`}>
                            {req.priority}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Guest: <strong className="text-white font-semibold">{req.guestName || "Guest"}</strong> • Floor {req.room?.roomNumber?.slice(0, -2) || "10"}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-bold px-3 py-1 rounded-xl ${
                      isCompleted ? "bg-emerald-500/20 text-emerald-300" :
                      isAccepted ? "bg-[#0A4D7E] text-white" : "bg-amber-500/20 text-amber-300"
                    }`}>
                      {req.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Request Details */}
                  <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 text-xs text-slate-200 mb-4">
                    <p className="font-semibold text-white">"{req.details}"</p>
                    {req.orderLines?.length > 0 && (
                      <div className="mt-2 text-[11px] text-slate-300 space-y-0.5 border-t border-white/10 pt-2">
                        {req.orderLines.map((line: any) => (
                          <p key={line.id}>• {line.quantity}x {line.menuItem?.name}</p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS (Section 36 Large Touch-Friendly Buttons) */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#B89759]" />
                      <span>SLA ~{req.category?.slaTargetMinutes || 15}m</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSubmitted && (
                        <button
                          onClick={() => handleAccept(req.id)}
                          className="px-6 py-3 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl hover:bg-[#a38243] transition-colors shadow-lg flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          ACCEPT WORK
                        </button>
                      )}

                      {isAccepted && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "IN_PROGRESS")}
                          className="px-6 py-3 bg-indigo-600 text-white font-extrabold text-xs rounded-2xl hover:bg-indigo-700 transition-colors shadow-lg flex items-center gap-1.5"
                        >
                          <Play className="w-4 h-4" />
                          START WORK
                        </button>
                      )}

                      {(isReady || req.status === "IN_PROGRESS") && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, "COMPLETED")}
                          className="px-6 py-3 bg-emerald-600 text-white font-extrabold text-xs rounded-2xl hover:bg-emerald-700 transition-colors shadow-lg flex items-center gap-1.5"
                        >
                          <CheckSquare className="w-4 h-4" />
                          MARK COMPLETE
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NOTIFICATION DRAWER MODAL */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl max-h-[85vh] flex flex-col justify-between p-6 text-white shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#B89759]" />
                  <h3 className="text-base font-bold">In-App Notification Center</h3>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No notifications received yet.</div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#B89759]">{n.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-300">{n.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4">
              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="w-full py-3 bg-white/10 text-white font-bold text-xs rounded-2xl hover:bg-white/15"
              >
                Close Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

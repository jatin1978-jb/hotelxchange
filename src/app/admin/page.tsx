"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  Hotel,
  Users,
  Calendar,
  Sliders,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  Save,
  Send,
  Bell,
  Clock,
  Palette,
  ExternalLink,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"branding" | "staff" | "roster" | "routing" | "devices">("branding");

  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState<any>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);

  // Branding Form State
  const [hotelName, setHotelName] = useState("Fortune Park Hotel");
  const [shortName, setShortName] = useState("Fortune Park");
  const [logoUrl, setLogoUrl] = useState("https://fortunehotels.ae/wp-content/uploads/2021/04/fortune-logo-1.png");
  const [primaryColor, setPrimaryColor] = useState("#0A4D7E");
  const [secondaryColor, setSecondaryColor] = useState("#B89759");
  const [loginWelcomeText, setLoginWelcomeText] = useState("Welcome to Fortune Park Hotel");
  const [address, setAddress] = useState("Dubai Investment Park, Dubai, UAE");
  const [currency, setCurrency] = useState("AED");
  const [timezone, setTimezone] = useState("Asia/Dubai");
  const [savingBranding, setSavingBranding] = useState(false);

  // Test Notification State
  const [selectedStaffForTest, setSelectedStaffForTest] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const fetchAdminData = () => {
    fetch("/api/branding")
      .then((res) => res.json())
      .then((d) => {
        if (d.branding) {
          setBranding(d.branding);
          setHotelName(d.branding.hotelName);
          setShortName(d.branding.shortName);
          setLogoUrl(d.branding.logoUrl);
          setPrimaryColor(d.branding.primaryColor);
          setSecondaryColor(d.branding.secondaryColor);
          setLoginWelcomeText(d.branding.loginWelcomeText);
          setAddress(d.branding.address);
          setCurrency(d.branding.currency);
          setTimezone(d.branding.timezone);
        }
      });

    fetch("/api/admin/roster")
      .then((res) => res.json())
      .then((d) => {
        setStaffList(d.staffList || []);
        if (d.staffList && d.staffList.length > 0 && !selectedStaffForTest) {
          setSelectedStaffForTest(d.staffList[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBranding(true);
    try {
      const res = await fetch("/api/branding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName,
          shortName,
          logoUrl,
          primaryColor,
          secondaryColor,
          loginWelcomeText,
          address,
          currency,
          timezone,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBranding(data.branding);
        alert(data.message || "Hotel branding updated successfully!");
      } else {
        alert(data.error || "Failed to save branding");
      }
    } catch (err) {
      alert("Network error saving branding");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!selectedStaffForTest) return;
    setSendingTest(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_TEST_NOTIFICATION",
          userId: selectedStaffForTest,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message || "Test notification sent successfully!");
      } else {
        alert(data.error || "Failed to send test notification");
      }
    } catch (err) {
      alert("Network error sending test notification");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0A4D7E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading Property Admin Suite...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-7 h-7 text-[#0A4D7E]" />
            <h1 className="text-2xl font-bold text-slate-900">
              {branding?.hotelName || "Fortune Park Hotel"} Admin Suite
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-Tenant Administration: Hotel Branding, Staff Roster, Routing Rules & Push Notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/staff/login"
            className="px-4 py-2.5 bg-[#0A4D7E] text-white rounded-xl text-xs font-bold hover:bg-[#083e66] flex items-center gap-1.5 shadow-sm"
          >
            <Smartphone className="w-4 h-4" />
            Open Staff Login Screen
          </Link>
        </div>
      </div>

      {/* ADMIN NAVIGATION TABS */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl mb-8 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("branding")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "branding" ? "bg-white text-[#0A4D7E] shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          Hotel Branding & Profile
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "staff" ? "bg-white text-[#0A4D7E] shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Users className="w-4 h-4" />
          Staff Directory ({staffList.length})
        </button>
        <button
          onClick={() => setActiveTab("roster")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "roster" ? "bg-white text-[#0A4D7E] shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Roster & Floor Assignment
        </button>
        <button
          onClick={() => setActiveTab("routing")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "routing" ? "bg-white text-[#0A4D7E] shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sliders className="w-4 h-4" />
          Routing Rules
        </button>
        <button
          onClick={() => setActiveTab("devices")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === "devices" ? "bg-white text-[#0A4D7E] shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Bell className="w-4 h-4" />
          Device & Test Notifications
        </button>
      </div>

      {/* TAB 1: HOTEL BRANDING */}
      {activeTab === "branding" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSaveBranding} className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-[#0A4D7E] uppercase tracking-wider block">Configurable Hotel Identity</span>
              <h3 className="text-lg font-bold text-slate-900">Hotel Profile & Branding Configuration</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Full Name</label>
                <input
                  type="text"
                  value={hotelName}
                  onChange={(e) => setHotelName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Short Name</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Hotel Logo URL</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 text-xs p-3 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Secondary Brand Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 text-xs p-3 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Login Welcome Message</label>
                <input
                  type="text"
                  value={loginWelcomeText}
                  onChange={(e) => setLoginWelcomeText(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Property Location Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Currency Code</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-bold uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Timezone</label>
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingBranding}
              className="w-full py-4 bg-[#0A4D7E] text-white font-bold text-xs rounded-xl hover:bg-[#083e66] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              {savingBranding ? "Saving Hotel Branding..." : "Save Branding Configuration"}
            </button>
          </form>

          {/* LIVE BRANDING PREVIEW CARD */}
          <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#B89759] uppercase tracking-wider block mb-3">Live Branding Preview</span>

              <div className="bg-slate-900 p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="w-14 h-14 bg-white p-2 rounded-2xl flex items-center justify-center border-2 border-[#B89759]">
                  <img src={logoUrl} alt="Preview" className="max-h-full object-contain" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-white">{hotelName}</h4>
                  <p className="text-xs text-[#B89759] font-bold">{loginWelcomeText}</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <div className="flex-1 p-2 rounded-xl text-center text-xs font-bold text-white" style={{ backgroundColor: primaryColor }}>
                    Primary
                  </div>
                  <div className="flex-1 p-2 rounded-xl text-center text-xs font-bold text-slate-950" style={{ backgroundColor: secondaryColor }}>
                    Secondary
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-xs text-slate-400">
              Zero Code Changes required to rebrand HotelXchange for another hotel.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {activeTab === "staff" && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Hotel Staff Directory & Roles</h3>
              <p className="text-xs text-slate-500">Staff IDs, Department assignments, Floor allocations, and Availability statuses.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {staffList.map((staff) => (
              <div key={staff.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#0A4D7E]/10 text-[#0A4D7E] font-extrabold text-xs flex items-center justify-center">
                    {staff.staffId || "HK"}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {staff.name}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {staff.role}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {staff.designation} • Dept: <strong>{staff.department?.name || "General"}</strong> • Assigned Floors: <strong>{staff.assignedFloors}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    staff.availabilityStatus === "AVAILABLE" ? "bg-emerald-100 text-emerald-800" :
                    staff.availabilityStatus === "BUSY" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    {staff.availabilityStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: ROSTER & FLOOR ASSIGNMENT */}
      {activeTab === "roster" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Roster & Floor Allocation Management</h3>
            <p className="text-xs text-slate-500">Configure current shifts, floor allocations, and availability overrides.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staffList.map((staff) => (
              <div key={staff.id} className="p-4 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A4D7E]">{staff.staffId || "HK"}</span>
                  <span className="text-xs font-bold text-slate-900">{staff.name}</span>
                </div>
                <div className="text-xs text-slate-500">
                  <p>Designation: {staff.designation}</p>
                  <p>Floors: {staff.assignedFloors}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: ROUTING RULES */}
      {activeTab === "routing" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">Central Request Routing Rules</h3>
            <p className="text-xs text-slate-500">Configure round-robin, acceptance timeouts, auto-reassign, and supervisor fallback strategies.</p>
          </div>

          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-[#0A4D7E]">Housekeeping Routing Rule</span>
              <p>Strategy: Round-Robin across Floor & Category Eligible Staff</p>
              <p>Acceptance Timeout: 2 Minutes $\rightarrow$ Supervisor Alert + Auto-Reassign</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-[#0A4D7E]">F&B In-Room Dining Routing Rule</span>
              <p>Strategy: Shared F&B Queue + F&B Manager Alert (`FB2001` Sarah)</p>
              <p>Acceptance Timeout: 5 Minutes</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEVICE & TEST NOTIFICATIONS */}
      {activeTab === "devices" && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-[#0A4D7E] uppercase tracking-wider block">Staff Onboarding & Device Testing (Section 64)</span>
            <h3 className="text-base font-bold text-slate-900">Push Notification Test Console</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Target Staff Member</label>
              <select
                value={selectedStaffForTest}
                onChange={(e) => setSelectedStaffForTest(e.target.value)}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold bg-slate-50"
              >
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.staffId || "HK"} - {staff.department?.name})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSendTestNotification}
              disabled={sendingTest}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-xl hover:bg-[#a38243] transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
              {sendingTest ? "Sending Test Notification..." : "SEND TEST NOTIFICATION"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

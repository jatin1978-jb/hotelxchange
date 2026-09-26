import Link from "next/link";
import { Smartphone, UserCheck, ShieldCheck, LayoutDashboard, Settings, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#0A4D7E]/10 text-[#0A4D7E] mb-4">
          HotelXchange Prototype Baseline v1.2
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
          Every Guest Request.<br className="hidden sm:inline" />
          <span className="text-[#0A4D7E]"> One Operational Workflow.</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600">
          Seamless QR guest intake, continuous 24/7 SLA tracking, automated round-robin routing across 6 departments, and real-time supervisor escalation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Guest Mobile Intake Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Guest Experience</h3>
            <p className="text-sm text-slate-600 mb-4">
              Simulate scanning a room-specific QR code. Browse F&B menu, request housekeeping/amenities, or report maintenance issues with persistent link tracking.
            </p>
          </div>
          <div className="space-y-2">
            <Link
              href="/guest/room/room-101-demo"
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 transition-colors"
            >
              <span>Scan QR Room 101 (Bhai)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/guest/room/hx-room-1204-qr"
              className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0A4D7E] text-white font-medium text-xs hover:bg-[#083e66] transition-colors"
            >
              <span>Scan QR Room 1204 (Sharma)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/r/hx-room-1204-qr"
              className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20 font-medium text-xs hover:bg-amber-500/20 transition-colors"
            >
              <span>Opaque Room QR Verification (/r/...)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Staff Queue Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-[#0A4D7E]/10 flex items-center justify-center text-[#0A4D7E] mb-4">
              <UserCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Staff Workspace</h3>
            <p className="text-sm text-slate-600 mb-4">
              View assigned queue, accept requests to stop timeout timer, update work status (Preparing → Ready → Delivered for F&B), and complete tasks.
            </p>
          </div>
          <Link
            href="/staff"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#0A4D7E] text-white font-medium text-sm hover:bg-[#083e66] transition-colors"
          >
            <span>Open Staff Queue</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Supervisor Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Department Supervisor</h3>
            <p className="text-sm text-slate-600 mb-4">
              Monitor acceptance timeouts, receive low-rating alerts, manually reassign staff with audit trail, and transfer complaints to Service Recovery.
            </p>
          </div>
          <Link
            href="/supervisor"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-600 text-white font-medium text-sm hover:bg-amber-700 transition-colors"
          >
            <span>Supervisor Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Central Operations Dashboard Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 mb-4">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Operations Dashboard</h3>
            <p className="text-sm text-slate-600 mb-4">
              Cross-department overview of active request volume, SLA breach rates, average fulfillment speed, and departmental workload distribution.
            </p>
          </div>
          <Link
            href="/operations"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            <span>Operations Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Admin Console Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-4">
              <Settings className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Admin Configuration</h3>
            <p className="text-sm text-slate-600 mb-4">
              Configure category SLAs, acceptance timeout thresholds, staff eligibility, room QR links, and F&B menu management.
            </p>
          </div>
          <Link
            href="/admin"
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-800 text-white font-medium text-sm hover:bg-slate-900 transition-colors"
          >
            <span>Admin Settings</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* PRD Spec Baseline Card */}
        <div className="bg-[#0A4D7E]/5 rounded-2xl p-6 border border-[#0A4D7E]/20 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-[#0A4D7E] uppercase tracking-wider">PRD Baseline</span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 mb-2">PRD Spec Alignment</h3>
            <ul className="text-xs text-slate-600 space-y-1.5 mb-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                6 Seeded Departments (HK, ENG, FNB, CON, FO, SR)
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Round-robin assignment & continuous 24/7 SLA
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Acceptance timeout supervisor alerts
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Same-record Service Recovery transfer
              </li>
            </ul>
          </div>
          <Link
            href="/PRD.md"
            className="text-xs font-medium text-[#0A4D7E] hover:underline"
          >
            View full PRD document →
          </Link>
        </div>
      </div>
    </div>
  );
}

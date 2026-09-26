"use client";

import { useEffect, useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  ArrowRightLeft,
  Clock,
  CheckCircle2,
  RefreshCw,
  Star,
} from "lucide-react";

export default function SupervisorPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  // Reassignment Modal state
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [newAssignee, setNewAssignee] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const fetchSupervisorData = () => {
    const url = departmentFilter
      ? `/api/staff/requests?departmentId=${departmentFilter}`
      : `/api/staff/requests`;

    fetch(url)
      .then((res) => {
        if (!res.ok) return { requests: [] };
        return res.json();
      })
      .then((d) => {
        setRequests(d.requests || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSupervisorData();
    const interval = setInterval(fetchSupervisorData, 4000);
    return () => clearInterval(interval);
  }, [departmentFilter]);

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReq || !newAssignee) return;

    try {
      const res = await fetch("/api/supervisor/reassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: selectedReq.id,
          newAssigneeId: newAssignee,
          supervisorId: "SUPERVISOR",
          reason: reassignReason,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSelectedReq(null);
        setNewAssignee("");
        setReassignReason("");
        fetchSupervisorData();
      } else {
        alert(result.error || "Reassignment failed");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const handleTransferSR = async (requestId: string) => {
    if (!confirm("Transfer this complaint/request directly to Service Recovery?")) return;

    try {
      const res = await fetch("/api/supervisor/transfer-sr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          supervisorId: "SUPERVISOR",
          reason: "Supervisor escalation to Service Recovery",
        }),
      });
      const result = await res.json();
      if (result.success) {
        fetchSupervisorData();
      }
    } catch (err) {
      alert("Network error");
    }
  };

  const timeoutRequests = requests.filter((r) => r.slaStatus?.acceptedTimeoutExpired);
  const breachedRequests = requests.filter((r) => r.slaStatus?.isBreached);
  const lowRatingRequests = requests.filter((r) => r.feedback && r.feedback.rating1To5 <= 2);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <h1 className="text-2xl font-bold text-slate-900">Department Supervisor Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Oversee department queue, respond to acceptance timeout alerts, and perform manual reassignments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Departments Overview</option>
            <option value="HK">Housekeeping</option>
            <option value="ENG">Engineering</option>
            <option value="FNB">Food & Beverage</option>
            <option value="CON">Concierge</option>
            <option value="FO">Front Office</option>
            <option value="SR">Service Recovery</option>
          </select>

          <button
            onClick={fetchSupervisorData}
            className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ALERT BANNERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 font-bold text-lg">
            {timeoutRequests.length}
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Acceptance Timeouts</h4>
            <p className="text-xs text-amber-700">Requires manual supervisor reassignment</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-700 font-bold text-lg">
            {breachedRequests.length}
          </div>
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">SLA Breaches</h4>
            <p className="text-xs text-rose-700">Requests past Target SLA duration</p>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-700 font-bold text-lg">
            {lowRatingRequests.length}
          </div>
          <div>
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Low Rating Alerts</h4>
            <p className="text-xs text-indigo-700">Guest ratings ≤ 2 Stars</p>
          </div>
        </div>
      </div>

      {/* REQUEST MANAGEMENT TABLE / CARDS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Department Requests & Escalation Pool</h3>
          <span className="text-xs text-slate-500">Total: {requests.length}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading supervisor view...</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const sla = req.slaStatus;
              const hasTimeout = sla?.acceptedTimeoutExpired;

              return (
                <div key={req.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        Room {req.room.roomNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">{req.category.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {req.currentDepartment.name}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      Assignee: <span className="font-semibold text-slate-800">{req.currentAssignee?.name || "Unassigned"}</span> | Priority: <span className="font-semibold">{req.priority}</span>
                    </p>

                    {req.details && <p className="text-xs text-slate-500 mt-1">"{req.details}"</p>}
                  </div>

                  {/* Status & Alerts */}
                  <div className="flex items-center gap-3">
                    {hasTimeout && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Acceptance Timeout!
                      </span>
                    )}

                    {sla?.isBreached && (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800">
                        SLA Breached ({sla.elapsedMinutes}m)
                      </span>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl hover:bg-amber-700 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reassign
                      </button>

                      {req.currentDepartment.code !== "SR" && (
                        <button
                          onClick={() => handleTransferSR(req.id)}
                          className="px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition-colors flex items-center gap-1"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          Transfer to SR
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

      {/* REASSIGNMENT MODAL */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleReassignSubmit} className="bg-white p-6 rounded-2xl max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Manual Reassignment - Room {selectedReq.room.roomNumber}
            </h3>
            <p className="text-xs text-slate-600">
              Category: <span className="font-semibold">{selectedReq.category.name}</span>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Select New Assignee Email or ID</label>
              <input
                type="text"
                value={newAssignee}
                onChange={(e) => setNewAssignee(e.target.value)}
                placeholder="e.g. hk.staff2@hotelxchange.com"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reassignment Reason</label>
              <textarea
                rows={2}
                value={reassignReason}
                onChange={(e) => setReassignReason(e.target.value)}
                placeholder="e.g. Previous staff missed acceptance timeout..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700"
              >
                Confirm Reassignment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

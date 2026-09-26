"use client";

import { useEffect, useState } from "react";
import {
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Building,
  RefreshCw,
  Utensils,
  Filter,
  Play,
  Check,
} from "lucide-react";

export default function StaffQueuePage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState<string>("");

  const fetchQueue = () => {
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
    fetchQueue();
    const interval = setInterval(fetchQueue, 4000); // Live poll
    return () => clearInterval(interval);
  }, [departmentFilter]);

  const handleAction = async (requestId: string, action: string) => {
    try {
      const res = await fetch("/api/staff/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      const result = await res.json();
      if (result.success) {
        fetchQueue();
      } else {
        alert(result.error || "Action failed");
      }
    } catch (err) {
      alert("Network error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Department Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[#0A4D7E]" />
            <h1 className="text-2xl font-bold text-slate-900">Staff Work Queue</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept incoming requests, track SLA deadlines, and fulfill guest orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs p-2 border border-slate-200 rounded-xl bg-white font-medium text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0A4D7E]"
          >
            <option value="">All Departments Queue</option>
            <option value="HK">Housekeeping</option>
            <option value="ENG">Engineering</option>
            <option value="FNB">Food & Beverage</option>
            <option value="CON">Concierge</option>
            <option value="FO">Front Office</option>
            <option value="SR">Service Recovery</option>
          </select>

          <button
            onClick={fetchQueue}
            className="p-2 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-sm">Loading staff queue...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Queue is Clear!</h3>
          <p className="text-xs text-slate-500 mt-1">No active requests pending action right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {requests.map((req) => {
            const isFnb = req.type === "FNB";
            const isCompleted = req.status === "COMPLETED" || req.status === "DELIVERED";
            const sla = req.slaStatus;

            return (
              <div
                key={req.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  sla.isBreached
                    ? "border-rose-300 ring-2 ring-rose-100"
                    : sla.isAtRisk
                    ? "border-amber-300 ring-2 ring-amber-100"
                    : "border-slate-200"
                }`}
              >
                <div>
                  {/* Top Bar Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-[#0A4D7E]/10 text-[#0A4D7E]">
                      Room {req.room.roomNumber}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.priority === "URGENT"
                            ? "bg-rose-100 text-rose-800"
                            : req.priority === "HIGH"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {req.priority}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {req.currentDepartment.name}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{req.category.name}</h3>

                  {req.details && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                      "{req.details}"
                    </p>
                  )}

                  {/* F&B Lines Summary */}
                  {isFnb && req.orderLines && req.orderLines.length > 0 && (
                    <div className="bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 mb-3 text-xs">
                      <span className="font-bold text-amber-900 block mb-1">F&B Items:</span>
                      {req.orderLines.map((line: any) => (
                        <div key={line.id} className="text-slate-700">
                          • {line.quantity}x {line.menuItem?.name}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SLA Tracker Progress Bar */}
                  <div className="mt-2 mb-4">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Elapsed: {sla.elapsedMinutes}m / {sla.targetMinutes}m target
                      </span>
                      <span
                        className={`font-bold ${
                          sla.isBreached
                            ? "text-rose-600"
                            : sla.isAtRisk
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {sla.isBreached ? "BREACHED" : sla.isAtRisk ? "AT RISK" : "ON TIME"}
                      </span>
                    </div>

                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          sla.isBreached
                            ? "bg-rose-500"
                            : sla.isAtRisk
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, sla.percentageUsed)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Status & Controls */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="text-[11px] text-slate-500 mb-2">
                    Assignee:{" "}
                    <span className="font-semibold text-slate-800">
                      {req.currentAssignee?.name || "Unassigned"}
                    </span>
                  </div>

                  {!isCompleted ? (
                    <div className="grid grid-cols-2 gap-2">
                      {!req.accepted_at && (
                        <button
                          onClick={() => handleAction(req.id, "ACCEPT")}
                          className="col-span-2 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-colors flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accept Request
                        </button>
                      )}

                      {req.accepted_at && !isFnb && (
                        <>
                          {req.status !== "IN_PROGRESS" && (
                            <button
                              onClick={() => handleAction(req.id, "IN_PROGRESS")}
                              className="py-2 bg-[#0A4D7E] text-white font-bold text-xs rounded-xl hover:bg-[#083e66]"
                            >
                              In Progress
                            </button>
                          )}
                          <button
                            onClick={() => handleAction(req.id, "COMPLETE")}
                            className="col-span-2 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                          >
                            Mark Complete
                          </button>
                        </>
                      )}

                      {req.accepted_at && isFnb && (
                        <>
                          {req.status === "SUBMITTED" || req.status === "ACCEPTED" ? (
                            <button
                              onClick={() => handleAction(req.id, "PREPARING")}
                              className="col-span-2 py-2 bg-[#0A4D7E] text-white font-bold text-xs rounded-xl hover:bg-[#083e66]"
                            >
                              Kitchen Preparing
                            </button>
                          ) : req.status === "PREPARING" ? (
                            <button
                              onClick={() => handleAction(req.id, "READY")}
                              className="col-span-2 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700"
                            >
                              Mark Ready
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAction(req.id, "DELIVERED")}
                              className="col-span-2 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                            >
                              Delivered to Room
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="block text-center text-xs font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl">
                      ✓ Fulfilled
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

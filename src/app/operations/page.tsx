"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  AlertOctagon,
  CheckCircle2,
  Building,
  RefreshCw,
  Users,
  AlertTriangle,
} from "lucide-react";

export default function OperationsDashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = () => {
    fetch("/api/operations/metrics")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((d) => {
        setMetrics(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !metrics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading central operations metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-bold text-slate-900">Central Operations Dashboard</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-department operational metrics, SLA compliance performance, and workload monitoring.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="p-2.5 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 text-xs font-bold shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Metrics
        </button>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Requests</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{metrics.totalRequests}</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.openRequests} Open Requests</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Within-SLA Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">{metrics.withinSlaRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Target Fulfillment Compliance</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SLA Breaches</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-rose-600">{metrics.slaBreached}</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.atRisk} Requests At Risk</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Avg Fulfillment Speed</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">~{metrics.avgFulfillmentMinutes}m</div>
          <div className="text-xs text-slate-500 mt-1">{metrics.acceptanceTimeouts} Acceptance Timeouts</div>
        </div>
      </div>

      {/* DEPARTMENT WORKLOAD BREAKDOWN GRID */}
      <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
        Departmental Workload Distribution (6 Seeded Departments)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {metrics.departmentBreakdown.map((dept: any) => (
          <div key={dept.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700">
                  {dept.code}
                </span>
                <span className="text-xs font-bold text-slate-500">
                  {dept.openRequests} Open
                </span>
              </div>
              <h4 className="text-lg font-bold text-slate-900">{dept.name}</h4>
              <p className="text-xs text-slate-500 mt-1">Total Lifetime Requests: {dept.totalRequests}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Department Status:</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

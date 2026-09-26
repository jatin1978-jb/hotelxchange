"use client";

import { useEffect, useState } from "react";
import { Building2, Settings, QrCode, Sliders, Check, Shield } from "lucide-react";

export default function AdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/guest/room/room-101-demo")
      .then((res) => res.json())
      .then((d) => {
        setCategories(d.categories || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="w-6 h-6 text-slate-700" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Configuration Console</h1>
          <p className="text-xs text-slate-500">Configure SLA targets, acceptance timeouts, room QR mappings, and department settings.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Categories & SLA Policy Config */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#0A4D7E]" />
            Request Categories & SLA Targets (Continuous 24/7)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                <tr>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">SLA Target (Min)</th>
                  <th className="p-3">Acceptance Timeout (Min)</th>
                  <th className="p-3">Priority Rule</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{cat.name}</td>
                    <td className="p-3 font-semibold text-[#0A4D7E]">{cat.department?.name}</td>
                    <td className="p-3 font-bold text-slate-800">{cat.slaTargetMinutes} mins</td>
                    <td className="p-3 font-bold text-amber-700">{cat.acceptanceTimeoutMinutes} mins</td>
                    <td className="p-3">{cat.priorityRule}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Room QR Mappings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-emerald-600" />
            Active Room QR Tokens & Context Mapping
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-extrabold text-slate-900 block text-base">Room 101</span>
              <span className="text-[10px] text-slate-500 block mb-2">Token: room-101-demo</span>
              <a
                href="/guest/room/room-101-demo"
                target="_blank"
                className="text-xs font-bold text-[#0A4D7E] hover:underline"
              >
                Launch QR Guest Portal →
              </a>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-extrabold text-slate-900 block text-base">Room 102</span>
              <span className="text-[10px] text-slate-500 block mb-2">Token: room-102-demo</span>
              <a
                href="/guest/room/room-102-demo"
                target="_blank"
                className="text-xs font-bold text-[#0A4D7E] hover:underline"
              >
                Launch QR Guest Portal →
              </a>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-extrabold text-slate-900 block text-base">Room 201</span>
              <span className="text-[10px] text-slate-500 block mb-2">Token: room-201-demo</span>
              <a
                href="/guest/room/room-201-demo"
                target="_blank"
                className="text-xs font-bold text-[#0A4D7E] hover:underline"
              >
                Launch QR Guest Portal →
              </a>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <span className="font-extrabold text-slate-900 block text-base">Room 305 (Suite)</span>
              <span className="text-[10px] text-slate-500 block mb-2">Token: room-305-demo</span>
              <a
                href="/guest/room/room-305-demo"
                target="_blank"
                className="text-xs font-bold text-[#0A4D7E] hover:underline"
              >
                Launch QR Guest Portal →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

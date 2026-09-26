"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  QrCode,
  UserCheck,
  Building,
  Sparkles,
  Smartphone,
  RefreshCw,
  LogOut,
  ExternalLink,
  CheckCircle2,
  Hotel,
  ArrowRightLeft,
  Calendar,
} from "lucide-react";

export default function FrontDeskPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check-In Form State (Section 19 Demo Default: Sharma in Room 1204)
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [reservationId, setReservationId] = useState("STAY-10045");
  const [guestLastName, setGuestLastName] = useState("Sharma");
  const [submitting, setSubmitting] = useState(false);

  // Room Change State (Section 11)
  const [newRoomId, setNewRoomId] = useState("");

  // Display QR Code Modal / Drawer
  const [activeQrRoom, setActiveQrRoom] = useState<any>(null);

  const fetchRooms = () => {
    fetch("/api/frontdesk/checkin")
      .then((res) => res.json())
      .then((d) => {
        setRooms(d.rooms || []);
        if (d.rooms && d.rooms.length > 0 && !selectedRoomId) {
          const r1204 = d.rooms.find((r: any) => r.roomNumber === "1204") || d.rooms[0];
          setSelectedRoomId(r1204.id);
          setActiveQrRoom(r1204);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCheckInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId || !guestLastName) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/frontdesk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId: selectedRoomId,
          reservationId,
          guestLastName: guestLastName.trim(),
          action: "CHECK_IN",
        }),
      });

      const result = await res.json();
      if (result.success) {
        fetchRooms();
        const updated = rooms.find((r) => r.id === selectedRoomId);
        if (updated) {
          setActiveQrRoom({ ...updated, registeredGuest: guestLastName, qrDataUrl: result.qrDataUrl });
        }
        alert(`PMS Check-In Success! Stay ${reservationId} created for Mr./Ms. ${guestLastName}.`);
      }
    } catch (err) {
      alert("Check-in error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoomChange = async (roomId: string) => {
    if (!newRoomId) {
      alert("Please select the target room for Room Change.");
      return;
    }
    try {
      const res = await fetch("/api/frontdesk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          newRoomId,
          action: "ROOM_CHANGE",
        }),
      });

      const result = await res.json();
      if (result.success) {
        fetchRooms();
        alert(`PMS Room Change Success! Stay transferred to new room.`);
      }
    } catch (err) {
      alert("Room Change error");
    }
  };

  const handleCheckOut = async (roomId: string, name: string) => {
    if (!confirm(`PMS CHECK-OUT: Close stay and invalidate all guest access tokens for ${name}?`)) return;

    try {
      const res = await fetch("/api/frontdesk/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          action: "CHECK_OUT",
        }),
      });

      const result = await res.json();
      if (result.success) {
        fetchRooms();
        alert(`PMS Check-out complete. Guest session closed & access revoked.`);
      }
    } catch (err) {
      alert("Check-out error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#0A4D7E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">Loading Front Desk Reception Console...</p>
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
            <h1 className="text-2xl font-bold text-slate-900">Front Desk PMS & Check-In Console</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            PMS System of Record: Check-in, Room Change, Stay Extension, and Session Closure on Check-out.
          </p>
        </div>

        <button
          onClick={fetchRooms}
          className="p-2.5 border border-slate-200 bg-white rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh PMS Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* CHECK-IN FORM CARD (SECTION 19 DEMO) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-[#0A4D7E] uppercase tracking-wider block">
              PMS Check-In Sync (Section 19 Demo)
            </span>
            <h3 className="text-lg font-bold text-slate-900">Create Active Guest Stay</h3>
          </div>

          <form onSubmit={handleCheckInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reservation ID</label>
              <input
                type="text"
                value={reservationId}
                onChange={(e) => setReservationId(e.target.value)}
                placeholder="e.g. STAY-10045"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-[#0A4D7E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Guest Last Name</label>
              <input
                type="text"
                value={guestLastName}
                onChange={(e) => setGuestLastName(e.target.value)}
                placeholder="e.g. Sharma"
                className="w-full text-xs p-3 border border-slate-200 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A4D7E]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Room</label>
              <select
                value={selectedRoomId}
                onChange={(e) => {
                  setSelectedRoomId(e.target.value);
                  const selected = rooms.find((r) => r.id === e.target.value);
                  if (selected) setActiveQrRoom(selected);
                }}
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50 font-semibold"
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    Room {room.roomNumber} ({room.registeredGuest})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const r1204 = rooms.find((r) => r.roomNumber === "1204") || rooms[0];
                  setSelectedRoomId(r1204.id);
                  setReservationId("STAY-10045");
                  setGuestLastName("Sharma");
                  setActiveQrRoom(r1204);
                }}
                className="px-3 py-1.5 text-[11px] font-bold bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200"
              >
                Preset: Section 19 (Sharma - 1204)
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-[#0A4D7E] text-white font-bold text-xs rounded-xl hover:bg-[#083e66] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? "Syncing PMS Check-In..." : "Sync PMS Check-In & Create Stay"}
            </button>
          </form>
        </div>

        {/* DYNAMIC SCANNABLE ROOM QR DISPLAY */}
        {activeQrRoom && (
          <div className="lg:col-span-2 bg-gradient-to-br from-[#0A4D7E] via-[#063050] to-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#B89759]" />
                  <span className="text-xs font-bold tracking-widest text-[#B89759] uppercase">
                    Room {activeQrRoom.roomNumber} Opaque QR Code
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 border border-white/15">
                  Room {activeQrRoom.roomNumber}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-[#B89759]">
                  {activeQrRoom.qrDataUrl ? (
                    <img
                      src={activeQrRoom.qrDataUrl}
                      alt={`QR Code for Room ${activeQrRoom.roomNumber}`}
                      className="w-44 h-44 rounded-lg"
                    />
                  ) : (
                    <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-slate-400">
                      <QrCode className="w-16 h-16 animate-pulse" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <span className="text-xs text-slate-300">Registered Guest Last Name:</span>
                  <h2 className="text-2xl font-extrabold text-white">
                    {activeQrRoom.registeredGuest}
                  </h2>

                  <p className="text-xs text-slate-300">
                    Opaque QR URL: <code className="font-mono text-[#B89759] font-bold">/r/{activeQrRoom.qrToken}</code>
                  </p>

                  <div className="pt-2">
                    <a
                      href={`/r/${activeQrRoom.qrToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#B89759] text-slate-950 font-bold text-xs hover:bg-[#a38243] transition-colors shadow-md"
                    >
                      <Smartphone className="w-4 h-4" />
                      Simulate Room QR Scan (Verification Page)
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span>Section 19 Target URL: <code className="font-mono text-[#B89759]">/r/hx-room-1204-qr</code></span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Opaque Token Ready
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ROOM OCCUPANCY & CHECKOUT CONTROL */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hotel Rooms & PMS Active Stays</h3>
            <p className="text-xs text-slate-500">Trigger PMS Check-out to close stay sessions and invalidate guest tokens.</p>
          </div>
          <span className="text-xs font-bold text-[#0A4D7E] bg-[#0A4D7E]/10 px-3 py-1 rounded-full">
            {rooms.length} Total Rooms
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {rooms.map((room) => {
            const isOccupied = room.registeredGuest && room.registeredGuest !== "Vacant / Available";

            return (
              <div key={room.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base ${
                    isOccupied ? "bg-[#0A4D7E]/10 text-[#0A4D7E]" : "bg-slate-100 text-slate-400"
                  }`}>
                    {room.roomNumber}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {isOccupied ? `Mr./Ms. ${room.registeredGuest}` : "Vacant Room"}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOccupied ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}>
                        {isOccupied ? "ACTIVE PMS STAY" : "Vacant"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">
                      Room QR URL: <code className="font-mono text-slate-700">/r/{room.qrToken}</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/r/${room.qrToken}`}
                    target="_blank"
                    className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 flex items-center gap-1.5"
                  >
                    <QrCode className="w-4 h-4 text-[#0A4D7E]" />
                    Test QR Scan
                  </a>

                  {isOccupied && (
                    <button
                      onClick={() => handleCheckOut(room.id, room.registeredGuest)}
                      className="px-4 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl hover:bg-rose-100 flex items-center gap-1.5 border border-rose-200"
                    >
                      <LogOut className="w-4 h-4" />
                      PMS Check-Out (Revoke Token)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

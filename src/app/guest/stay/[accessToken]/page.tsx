"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  ConciergeBell,
  Utensils,
  Clock,
  CheckCircle2,
  ListOrdered,
  Plus,
  Minus,
  CheckSquare,
  Send,
  Building,
  Activity,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Search,
  Check,
} from "lucide-react";

export default function MyStayDashboardPage({
  params,
}: {
  params: Promise<{ accessToken: string }>;
}) {
  const { accessToken } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  // Tab State: 'overview' | 'requests' | 'fnb' | 'services' | 'activity'
  const [activeTab, setActiveTab] = useState<"overview" | "requests" | "fnb" | "services" | "activity">("overview");

  // Zero-typing amenity picker state
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, number>>({});
  const [customNote, setCustomNote] = useState("");
  const [urgency, setUrgency] = useState("NORMAL");
  const [submitting, setSubmitting] = useState(false);

  // F&B Cart State
  const [cart, setCart] = useState<any[]>([]);

  const fetchSession = () => {
    fetch(`/api/guest/session/${accessToken}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        if (d.categories && d.categories.length > 0 && !selectedCategory) {
          setSelectedCategory(d.categories[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 4000); // Live poll updates during stay
    return () => clearInterval(interval);
  }, [accessToken]);

  const updateAmenityQty = (item: string, delta: number) => {
    setSelectedAmenities((prev) => {
      const current = prev[item] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      }
      return { ...prev, [item]: updated };
    });
  };

  const compiledSummary = Object.entries(selectedAmenities)
    .filter(([_, qty]) => qty > 0)
    .map(([item, qty]) => `${qty}x ${item}`)
    .join(", ");

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;

    const requestDetails = compiledSummary
      ? compiledSummary + (customNote ? ` (Note: ${customNote})` : "")
      : customNote || "Standard service request";

    if (!requestDetails) {
      alert("Please tap '+' to select at least one amenity or enter a note.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/guest/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          categoryId: selectedCategory.id,
          urgency,
          details: requestDetails,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setSelectedAmenities({});
        setCustomNote("");
        fetchSession();
        setActiveTab("requests");
      } else {
        alert(result.error || "Submission failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const addToCart = (item: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          price: item.displayPrice,
          quantity: 1,
        },
      ];
    });
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItemId === menuItemId);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.menuItemId !== menuItemId);
    });
  };

  const handleFnbSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);

    const fnbCategory = data.categories.find(
      (c: any) => c.slug === "fnb-order" || c.department?.code === "FNB"
    );

    try {
      const res = await fetch("/api/guest/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken,
          categoryId: fnbCategory?.id || data.categories[0].id,
          urgency: "NORMAL",
          details: `In-Room Dining Order (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)`,
          items: cart.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
          })),
        }),
      });

      const result = await res.json();
      if (result.success) {
        setCart([]);
        fetchSession();
        setActiveTab("fnb");
      } else {
        alert(result.error || "Order submission failed");
      }
    } catch (err) {
      alert("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#B89759] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Loading your MY STAY companion...</p>
        </div>
      </div>
    );
  }

  // SECTION 8: CRITICAL CHECKOUT SCREEN
  if (!data || data.checkedOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-white/10 p-8 rounded-3xl text-center max-w-sm shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Your stay has ended.</h2>
          <p className="text-xs text-slate-300">
            {data?.message || "Thank you for staying with us at HotelXchange."}
          </p>
          <p className="text-[11px] text-slate-500">
            Guest stay access token has been invalidated. Previous stay data is closed.
          </p>
          <div className="pt-2">
            <Link
              href="/frontdesk"
              className="inline-flex items-center justify-center px-5 py-3 bg-[#0A4D7E] text-white font-bold text-xs rounded-2xl hover:bg-[#083e66]"
            >
              Return to Reception Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { session, requests, activityTimeline, categories, menuSections } = data;
  const generalRequests = requests.filter((r: any) => r.type !== "FNB");
  const fnbOrders = requests.filter((r: any) => r.type === "FNB");

  let categoryItems: string[] = [];
  if (selectedCategory && selectedCategory.formSchema) {
    try {
      categoryItems = JSON.parse(selectedCategory.formSchema);
    } catch (e) {
      categoryItems = [];
    }
  }

  const selectedCount = Object.values(selectedAmenities).reduce((a: number, b: any) => a + b, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32">
      {/* PERSONALIZED MY STAY HEADER */}
      <div className="bg-gradient-to-b from-[#0A4D7E] via-[#063050] to-slate-950 px-5 pt-8 pb-6 border-b border-white/10 rounded-b-[2.5rem] shadow-2xl">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-extrabold tracking-widest text-[#B89759] uppercase">
                {session.propertyName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white/10 border border-white/15 text-white">
                MY STAY • Room {session.roomNumber}
              </span>
              <button
                onClick={() => {
                  if (confirm("Exit screen on this device? (Your stay remains active in hotel system)")) {
                    router.push(`/r/hx-room-1204-qr`);
                  }
                }}
                className="p-1.5 rounded-xl bg-white/10 border border-white/15 text-slate-300 hover:text-white hover:bg-white/20 transition-colors flex items-center gap-1 text-[11px] font-bold"
                title="Exit Instance (Keep Stay Active)"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-300" />
                <span className="hidden sm:inline">Exit</span>
              </button>
            </div>
          </div>

          <div className="mb-2">
            <span className="text-xs text-slate-300 font-medium">Welcome,</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Mr. {session.guestLastName}
              <Sparkles className="w-5 h-5 text-[#B89759]" />
            </h1>
          </div>

          <p className="text-xs text-slate-300">
            One Guest. One Active Stay. All Hotel Services in One Companion.
          </p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-5">
        {/* 5 MAIN NAVIGATION TABS */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/10 mb-5 overflow-x-auto no-scrollbar gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "overview"
                ? "bg-[#0A4D7E] text-white shadow-md shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === "requests"
                ? "bg-[#0A4D7E] text-white shadow-md shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            My Requests ({generalRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("fnb")}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeTab === "fnb"
                ? "bg-[#0A4D7E] text-white shadow-md shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            F&B ({fnbOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "services"
                ? "bg-[#0A4D7E] text-white shadow-md shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === "activity"
                ? "bg-[#0A4D7E] text-white shadow-md shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Activity Timeline
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-3xl border border-white/10 shadow-xl">
              <span className="text-[11px] font-bold text-[#B89759] uppercase tracking-wider block mb-1">
                Active Stay Summary
              </span>
              <h3 className="text-lg font-bold text-white mb-2">Room {session.roomNumber}</h3>
              <div className="text-xs text-slate-300 space-y-1">
                <p>Guest: <span className="font-semibold text-white">Mr. {session.guestLastName}</span></p>
                <p>Status: <span className="font-semibold text-emerald-400">ACTIVE STAY</span></p>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab("services")}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#B89759] text-left transition-all"
              >
                <ConciergeBell className="w-6 h-6 text-[#B89759] mb-2" />
                <h4 className="text-xs font-bold text-white">Request Amenities</h4>
                <p className="text-[11px] text-slate-400">Towels, glasses, pillows...</p>
              </button>

              <button
                onClick={() => setActiveTab("fnb")}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#B89759] text-left transition-all"
              >
                <Utensils className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-xs font-bold text-white">In-Room Dining</h4>
                <p className="text-[11px] text-slate-400">Order breakfast & food</p>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MY REQUESTS */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#B89759] uppercase tracking-wider mb-2">
              My Requests ({generalRequests.length})
            </h3>

            {generalRequests.length === 0 ? (
              <div className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 text-center text-slate-400 text-xs">
                No active service requests submitted yet.
              </div>
            ) : (
              generalRequests.map((req: any) => {
                const isCompleted = req.status === "COMPLETED";
                return (
                  <div key={req.id} className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-[#B89759]">{req.category.name}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCompleted ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {isCompleted ? "Completed ✓" : req.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">"{req.details}"</p>
                    <div className="text-[10px] text-slate-400 mt-2 flex items-center justify-between">
                      <span>Dept: {req.currentDepartment?.name}</span>
                      <span>{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 3: F&B ORDERS */}
        {activeTab === "fnb" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#B89759] uppercase tracking-wider mb-2">
              F&B Orders ({fnbOrders.length})
            </h3>

            {fnbOrders.length > 0 && (
              <div className="space-y-3 mb-6">
                {fnbOrders.map((ord: any) => (
                  <div key={ord.id} className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[#B89759]">In-Room Dining</span>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                        {ord.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      {ord.orderLines?.map((line: any) => (
                        <p key={line.id}>• {line.quantity}x {line.menuItem?.name}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Menu Sections Browser */}
            {menuSections.map((sec: any) => (
              <div key={sec.id} className="bg-slate-900/90 p-4 rounded-3xl border border-white/10">
                <h4 className="text-xs font-bold text-[#B89759] mb-3 pb-2 border-b border-white/10">
                  {sec.name}
                </h4>
                <div className="space-y-3">
                  {sec.items.map((item: any) => {
                    const cartItem = cart.find((i) => i.menuItemId === item.id);
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-3 p-2 rounded-2xl bg-white/5">
                        <div className="flex-1">
                          <h5 className="text-xs font-bold text-white">{item.name}</h5>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                          <span className="text-xs font-bold text-[#B89759] mt-1 inline-block">
                            ${item.displayPrice.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          {cartItem ? (
                            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-white/15">
                              <button type="button" onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-lg bg-white/10 text-white flex items-center justify-center">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-bold px-1 text-white">{cartItem.quantity}</span>
                              <button type="button" onClick={() => addToCart(item)} className="w-6 h-6 rounded-lg bg-[#0A4D7E] text-white flex items-center justify-center">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button type="button" onClick={() => addToCart(item)} className="px-3 py-1.5 bg-[#0A4D7E] text-white text-xs font-bold rounded-lg flex items-center gap-1">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {cart.length > 0 && (
              <div className="fixed bottom-5 left-4 right-4 max-w-md mx-auto bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/20 z-50">
                <div>
                  <div className="text-xs font-bold text-slate-300">{cart.reduce((s, i) => s + i.quantity, 0)} Items Selected</div>
                  <div className="text-sm font-extrabold text-[#B89759]">Total: ${cartTotal.toFixed(2)}</div>
                </div>
                <button type="button" onClick={handleFnbSubmit} disabled={submitting} className="px-4 py-3 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl">
                  {submitting ? "Submitting..." : "Place F&B Order"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AVAILABLE SERVICES */}
        {activeTab === "services" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#B89759] uppercase tracking-wider mb-2">
              Available Hotel Services
            </h3>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {categories.map((cat: any) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedAmenities({});
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    selectedCategory?.id === cat.id
                      ? "border-[#B89759] bg-[#B89759]/15 text-white font-bold"
                      : "border-white/10 bg-slate-900/80 text-slate-300"
                  }`}
                >
                  <span className="text-xs font-bold block">{cat.name}</span>
                </button>
              ))}
            </div>

            {selectedCategory && (
              <form onSubmit={handleServiceSubmit} className="bg-slate-900/90 p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Tap Options to Select
                </h4>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {categoryItems.map((item) => {
                    const qty = selectedAmenities[item] || 0;
                    return (
                      <div key={item} className="p-3 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{item}</span>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => updateAmenityQty(item, -1)} disabled={qty === 0} className="w-7 h-7 rounded-xl bg-white/10 text-white flex items-center justify-center">
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-extrabold text-[#B89759]">{qty}</span>
                          <button type="button" onClick={() => updateAmenityQty(item, 1)} className="w-7 h-7 rounded-xl bg-[#0A4D7E] text-white flex items-center justify-center">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {compiledSummary ? (
                  <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-500/30 text-xs">
                    <span className="font-bold text-emerald-400">Selected Items ({selectedCount}):</span>
                    <p className="text-emerald-200 mt-0.5">{compiledSummary}</p>
                  </div>
                ) : null}

                <button type="submit" disabled={submitting || selectedCount === 0} className="w-full py-4 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg">
                  {submitting ? "Sending..." : "Submit Service Request"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 5: STAY ACTIVITY TIMELINE (SECTION 7) */}
        {activeTab === "activity" && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#B89759] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#B89759]" />
              Stay Activity Timeline
            </h3>

            {activityTimeline.length === 0 ? (
              <div className="bg-slate-900/80 p-8 rounded-3xl border border-white/10 text-center text-slate-400 text-xs">
                No stay activity recorded yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                {activityTimeline.map((evt: any) => (
                  <div key={evt.id} className="relative bg-slate-900/90 p-4 rounded-2xl border border-white/10 shadow-md">
                    <div className="absolute -left-6.5 top-4 w-3.5 h-3.5 rounded-full bg-[#B89759] border-2 border-slate-950"></div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-white">{evt.categoryName}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Event: <span className="font-semibold text-emerald-400">{evt.eventType.replace("_", " ")}</span>
                    </p>
                    {evt.details && <p className="text-[11px] text-slate-400 mt-1">"{evt.details}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Utensils,
  ConciergeBell,
  Clock,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Plus,
  Minus,
  Check,
  Send,
  Building,
  CheckSquare,
  Search,
  Wrench,
  Compass,
  KeyRound,
  ShieldAlert,
  ListOrdered,
  LogOut,
  X,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

export default function GuestIntakePage({ params }: { params: Promise<{ qrToken: string }> }) {
  const { qrToken } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<"services" | "fnb">("services");
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  // Search filter for mobile ease
  const [searchQuery, setSearchQuery] = useState("");

  // Selected Amenity Quantities: { "Bath Towel": 2, "Whisky Glass": 2, "Plates & Cutlery Set": 2 }
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, number>>({});

  // Service Form State
  const [urgency, setUrgency] = useState("NORMAL");
  const [customNote, setCustomNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // F&B Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [fnbSpecialInstructions, setFnbSpecialInstructions] = useState("");

  // Active Requests History Drawer State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [guestHistory, setGuestHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Farewell / Checkout state
  const [isCheckedOut, setIsCheckedOut] = useState(false);

  const fetchRoomData = () => {
    fetch(`/api/guest/room/${qrToken}`)
      .then((res) => {
        if (!res.ok) throw new Error("Invalid or expired QR code link.");
        return res.json();
      })
      .then((d) => {
        setData(d);
        if (d.categories && d.categories.length > 0 && !selectedCategory) {
          setSelectedCategory(d.categories[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchHistory = () => {
    setLoadingHistory(true);
    fetch(`/api/guest/room/${qrToken}/history`)
      .then((res) => {
        if (!res.ok) return { requests: [] };
        return res.json();
      })
      .then((d) => {
        setGuestHistory(d.requests || []);
        setLoadingHistory(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingHistory(false);
      });
  };

  useEffect(() => {
    fetchRoomData();
    fetchHistory();
    const interval = setInterval(fetchHistory, 5000); // Live poll guest request queue
    return () => clearInterval(interval);
  }, [qrToken]);

  // Reset selected amenities on category change
  const handleCategorySelect = (cat: any) => {
    setSelectedCategory(cat);
    setSelectedAmenities({});
    setSearchQuery("");
  };

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

  // Compile summary string from selected items
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
          qrToken,
          categoryId: selectedCategory.id,
          urgency,
          details: requestDetails,
          guestName: data?.room?.registeredGuest || "Guest",
        }),
      });

      const result = await res.json();
      if (result.success) {
        fetchHistory();
        router.push(`/guest/track/${result.trackingToken}`);
      } else {
        alert(result.error || "Submission failed");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Network connection error");
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
          qrToken,
          categoryId: fnbCategory?.id || data.categories[0].id,
          urgency: "NORMAL",
          details: `In-Room Dining Order (${cart.reduce((sum, item) => sum + item.quantity, 0)} items)`,
          guestName: data?.room?.registeredGuest || "Guest",
          items: cart.map((i) => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            specialInstructions: fnbSpecialInstructions,
          })),
        }),
      });

      const result = await res.json();
      if (result.success) {
        fetchHistory();
        router.push(`/guest/track/${result.trackingToken}`);
      } else {
        alert(result.error || "Order submission failed");
        setSubmitting(false);
      }
    } catch (err) {
      alert("Network error");
      setSubmitting(false);
    }
  };

  const handleGuestCheckout = () => {
    if (confirm("Are you sure you want to perform Express Checkout and exit your room session?")) {
      setIsCheckedOut(true);
    }
  };

  if (isCheckedOut) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 p-8 rounded-3xl border border-white/10 text-center max-w-sm shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-[#B89759]/20 flex items-center justify-center text-[#B89759] mx-auto border border-[#B89759]/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">Thank You for Staying With Us!</h2>
          <p className="text-xs text-slate-300">
            Express checkout complete for <span className="font-bold text-[#B89759]">{data?.room?.registeredGuest}</span>. We hope you had a wonderful stay at HotelXchange.
          </p>
          <div className="pt-2">
            <Link
              href="/frontdesk"
              className="inline-flex items-center gap-2 px-5 py-3 bg-[#0A4D7E] text-white font-bold text-xs rounded-2xl hover:bg-[#083e66]"
            >
              Return to Reception Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-[#B89759] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold tracking-wide text-slate-300">Resolving QR Room Context...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/10 text-center max-w-sm text-white">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-1">Invalid QR Code</h2>
          <p className="text-xs text-slate-300 mb-4">{error}</p>
          <p className="text-xs text-slate-400">Please contact Front Office or dial 0 from your in-room phone.</p>
        </div>
      </div>
    );
  }

  // Parse preset amenity items from schema
  let categoryItems: string[] = [];
  if (selectedCategory && selectedCategory.formSchema) {
    try {
      categoryItems = JSON.parse(selectedCategory.formSchema);
    } catch (e) {
      categoryItems = [];
    }
  }

  // Filter items if user typed in mobile search bar
  if (searchQuery) {
    categoryItems = categoryItems.filter((i) =>
      i.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const selectedCount = Object.values(selectedAmenities).reduce((a, b) => a + b, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const openRequestsCount = guestHistory.filter((r) => r.status !== "COMPLETED" && r.status !== "DELIVERED").length;

  const getCategoryIcon = (deptCode: string) => {
    switch (deptCode) {
      case "HK":
        return <ConciergeBell className="w-4 h-4 text-[#0A4D7E]" />;
      case "ENG":
        return <Wrench className="w-4 h-4 text-amber-600" />;
      case "FNB":
        return <Utensils className="w-4 h-4 text-emerald-600" />;
      case "CON":
        return <Compass className="w-4 h-4 text-indigo-600" />;
      case "FO":
        return <KeyRound className="w-4 h-4 text-blue-600" />;
      case "SR":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#B89759]" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-32">
      {/* LUXURY PERSONALIZED MOBILE HEADER */}
      <div className="bg-gradient-to-b from-[#0A4D7E] via-[#063050] to-slate-950 px-5 pt-8 pb-6 border-b border-white/10 rounded-b-[2rem] shadow-xl">
        <div className="max-w-md mx-auto">
          {/* Top Bar Navigation & Actions */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-bold tracking-widest text-[#B89759] uppercase">
                {data.property.name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* My Requests Queue Button */}
              <button
                onClick={() => {
                  fetchHistory();
                  setShowHistoryModal(true);
                }}
                className="relative px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 backdrop-blur-md active:scale-95 transition-transform"
              >
                <ListOrdered className="w-3.5 h-3.5 text-[#B89759]" />
                <span>My Queue</span>
                {guestHistory.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#B89759] text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                    {guestHistory.length}
                  </span>
                )}
              </button>

              {/* Express Checkout / Exit Button */}
              <button
                onClick={handleGuestCheckout}
                className="p-1.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-colors"
                title="Express Checkout / Exit"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Personalized Guest Welcome Message */}
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-300 font-medium">Welcome back,</span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {data.room.registeredGuest || "Valued Guest"}
                <Sparkles className="w-5 h-5 text-[#B89759]" />
              </h1>
            </div>

            <span className="text-xs font-extrabold px-3 py-1.5 rounded-2xl bg-white/10 text-white border border-white/15">
              Room {data.room.roomNumber}
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Select your service options below for instant 24/7 in-room fulfillment.
          </p>

          {/* Mobile Touch Search Bar */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search towels, whisky glass, extra pillows, AC..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B89759]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-5">
        {/* MOBILE NAVIGATION TABS */}
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/10 mb-5">
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "services"
                ? "bg-[#0A4D7E] text-white shadow-lg shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <ConciergeBell className="w-4 h-4" />
            Services & Amenities
          </button>
          <button
            onClick={() => setActiveTab("fnb")}
            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === "fnb"
                ? "bg-[#0A4D7E] text-white shadow-lg shadow-[#0A4D7E]/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Utensils className="w-4 h-4" />
            In-Room Dining
          </button>
        </div>

        {/* TAB 1: SERVICES & AMENITIES */}
        {activeTab === "services" && (
          <div className="space-y-5">
            {/* Category Cards Selector */}
            <div>
              <span className="text-[11px] font-bold text-[#B89759] uppercase tracking-wider block mb-2">
                1. Select Category
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {data.categories.map((cat: any) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-[#B89759] bg-[#B89759]/15 text-white shadow-md shadow-[#B89759]/10"
                          : "border-white/10 bg-slate-900/80 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                          {getCategoryIcon(cat.department?.code)}
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#B89759]" />}
                      </div>
                      <span className="text-xs font-bold block">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#B89759]" />
                        SLA ~{cat.slaTargetMinutes}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zero-Typing Amenity Item Picker */}
            {selectedCategory && (
              <form onSubmit={handleServiceSubmit} className="bg-slate-900/90 p-5 rounded-3xl border border-white/10 space-y-4 shadow-xl">
                <div className="border-b border-white/10 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      2. Tap '+' to Select Options
                    </h3>
                    <p className="text-[11px] text-slate-400">Zero typing required — simply tap quantities</p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#0A4D7E] text-white">
                    {selectedCategory.department.name}
                  </span>
                </div>

                {categoryItems.length > 0 ? (
                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {categoryItems.map((item) => {
                      const qty = selectedAmenities[item] || 0;
                      return (
                        <div
                          key={item}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                            qty > 0
                              ? "border-[#B89759] bg-[#B89759]/15 shadow-sm"
                              : "border-white/5 bg-white/5"
                          }`}
                        >
                          <span className={`text-xs font-bold ${qty > 0 ? "text-white" : "text-slate-200"}`}>
                            {item}
                          </span>

                          <div className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => updateAmenityQty(item, -1)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                                qty > 0
                                  ? "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                                  : "bg-white/5 text-slate-600 cursor-not-allowed"
                              }`}
                              disabled={qty === 0}
                            >
                              <Minus className="w-4 h-4" />
                            </button>

                            <span className="w-6 text-center text-xs font-extrabold text-[#B89759]">
                              {qty}
                            </span>

                            <button
                              type="button"
                              onClick={() => updateAmenityQty(item, 1)}
                              className="w-8 h-8 rounded-xl bg-[#0A4D7E] text-white flex items-center justify-center text-xs font-bold shadow-md hover:bg-[#083e66]"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No pre-set options available.</p>
                )}

                {/* Selection Summary */}
                {compiledSummary ? (
                  <div className="bg-emerald-950/60 p-3.5 rounded-2xl border border-emerald-500/30 text-xs">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      Selected Items ({selectedCount}):
                    </span>
                    <p className="font-semibold text-emerald-200">{compiledSummary}</p>
                  </div>
                ) : null}

                {/* Optional Additional Note */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Special Note / Custom Instruction (Optional)
                  </label>
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Leave at door, or extra cold ice..."
                    className="w-full text-xs p-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#B89759]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || (selectedCount === 0 && !customNote)}
                  className="w-full py-4 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl hover:bg-[#a38243] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg"
                >
                  {submitting ? (
                    "Sending Request to Staff..."
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request ({selectedCount} Selected Items)
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: IN-ROOM DINING */}
        {activeTab === "fnb" && (
          <div className="space-y-4">
            {data.menuSections.map((sec: any) => (
              <div key={sec.id} className="bg-slate-900/90 p-4 rounded-3xl border border-white/10 shadow-lg">
                <h3 className="text-sm font-bold text-[#B89759] mb-3 pb-2 border-b border-white/10">
                  {sec.name}
                </h3>
                <div className="space-y-3">
                  {sec.items.map((item: any) => {
                    const cartItem = cart.find((i) => i.menuItemId === item.id);
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-3 p-2.5 rounded-2xl bg-white/5">
                        <div className="flex-1">
                          <h4 className="text-xs font-bold text-white">{item.name}</h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                          <span className="text-xs font-bold text-[#B89759] mt-1.5 inline-block">
                            ${item.displayPrice.toFixed(2)}
                          </span>
                        </div>
                        <div>
                          {cartItem ? (
                            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-white/15">
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-bold px-1 text-white">{cartItem.quantity}</span>
                              <button
                                type="button"
                                onClick={() => addToCart(item)}
                                className="w-7 h-7 rounded-lg bg-[#0A4D7E] flex items-center justify-center text-white"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="px-3.5 py-2 bg-[#0A4D7E] text-white text-xs font-bold rounded-lg flex items-center gap-1 hover:bg-[#083e66]"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* STICKY FLOATING CART BAR */}
            {cart.length > 0 && (
              <div className="fixed bottom-5 left-4 right-4 max-w-md mx-auto bg-slate-900 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/20 z-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#B89759] flex items-center justify-center text-slate-950 font-bold">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-300">
                      {cart.reduce((s, i) => s + i.quantity, 0)} Items Selected
                    </div>
                    <div className="text-sm font-extrabold text-[#B89759]">
                      Total: ${cartTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleFnbSubmit}
                  disabled={submitting}
                  className="px-4 py-3 bg-[#B89759] text-slate-950 font-extrabold text-xs rounded-2xl hover:bg-[#a38243] transition-colors flex items-center gap-1.5 shadow-md"
                >
                  {submitting ? "Placing Order..." : "Place F&B Order"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MY REQUESTS QUEUE MODAL DRAWER */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-t-[2.5rem] sm:rounded-3xl max-h-[85vh] flex flex-col justify-between p-6 text-white shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <div className="flex items-center gap-2">
                  <ListOrdered className="w-5 h-5 text-[#B89759]" />
                  <h3 className="text-base font-bold">My Stay Request Queue</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading request history...</div>
              ) : guestHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No requests submitted yet during this stay.</p>
                </div>
              ) : (
                <div className="space-y-3 overflow-y-auto max-h-[55vh] pr-1">
                  {guestHistory.map((req) => {
                    const isCompleted = req.status === "COMPLETED" || req.status === "DELIVERED";
                    return (
                      <Link
                        key={req.id}
                        href={`/guest/track/${req.trackingToken}`}
                        onClick={() => setShowHistoryModal(false)}
                        className="block p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#B89759] transition-all"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-extrabold text-[#B89759]">
                            {req.category?.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isCompleted ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {req.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 line-clamp-2">"{req.details}"</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                          <span>{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[#B89759] font-bold flex items-center gap-0.5">
                            Track Status <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4 text-center">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-3 bg-white/10 text-white font-bold text-xs rounded-2xl hover:bg-white/15"
              >
                Close Queue View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

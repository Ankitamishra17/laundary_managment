import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Store,
  MapPin,
  Plus,
  Minus,
  ShoppingBag,
  CalendarDays,
  Clock,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Package,
  Truck,
  Home,
  Shirt,
  X,
  Check,
  Info,
  Star,
  PlusCircle,
} from "lucide-react";
import { getMyShopContext } from "../../api/shopApi";
import { createOrder } from "../../api/orderApi";
import { getAddresses } from "../../api/customerApi";
import AddAddressModal from "../../components/customer/AddAddressModal";
import { useAuth } from "../../context/AuthContext";
import { formatINR, formatDate } from "../../utils/orderStatus";

const colors = {
  bgDark: "#05282A",
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

const TIME_SLOTS = [
  "9 AM – 11 AM",
  "11 AM – 1 PM",
  "1 PM – 3 PM",
  "3 PM – 5 PM",
  "5 PM – 7 PM",
  "7 PM – 9 PM",
];

const STEPS = [
  { key: "services", label: "Services", icon: Shirt },
  { key: "pickup", label: "Pickup", icon: Home },
  { key: "delivery", label: "Delivery", icon: Truck },
  { key: "review", label: "Review", icon: Package },
];

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border p-5 sm:p-6 ${className}`}
    style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
  >
    {children}
  </div>
);

const CardTitle = ({ icon: Icon, children }) => (
  <h3
    className="flex items-center gap-2 text-base sm:text-lg mb-1"
    style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
  >
    {Icon && <Icon size={18} color={colors.primaryTeal} />} {children}
  </h3>
);

const StepHeader = ({ step }) => {
  const meta = STEPS[step];
  const Icon = meta.icon;
  return (
    <div className="mb-5">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${colors.primaryTeal}1F` }}
        >
          <Icon size={16} color={colors.primaryTeal} />
        </div>
        <h2
          className="text-xl sm:text-2xl"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
        >
          {meta.label}
        </h2>
      </div>
      <p className="mt-1.5 text-sm" style={{ color: colors.textMuted }}>
        {step === 0 && "Pick the services you need (Wash Only, Iron Only, Dry Cleaning…), set the quantity and add them to your order — the price updates live."}
        {step === 1 && "Tell us where to pick up your clothes and when."}
        {step === 2 && "Where should we bring the fresh laundry back?"}
        {step === 3 && "One last look before you place the order."}
      </p>
    </div>
  );
};

const Stepper = ({ step }) => (
  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
    {STEPS.map((s, i) => {
      const Icon = s.icon;
      const done = i < step;
      const active = i === step;
      return (
        <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
            style={{
              backgroundColor: active || done ? (done ? colors.mint : colors.primaryTeal) : colors.cardTint,
              color: active || done ? "#FFFFFF" : colors.textMuted,
            }}
          >
            <Icon size={13} />
            <span className="whitespace-nowrap">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-4 h-px" style={{ backgroundColor: colors.cardBorder }} />
          )}
        </div>
      );
    })}
  </div>
);

export default function NewOrder() {
  const { user, updateUser } = useAuth();

  // The WashFlow laundry serving this customer is resolved automatically —
  // the customer never picks one. Their linked laundry is used when set,
  // otherwise the platform default; the first order links the account.
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState(false);

  // Step 1 — service-based builder
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]); // [{ serviceId, quantity }]

  // Step 2 — pickup
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupDate, setPickupDate] = useState(todayISO());
  const [pickupTime, setPickupTime] = useState(TIME_SLOTS[1]);

  // Step 3 — delivery
  const [sameAsPickup, setSameAsPickup] = useState(true);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  // Saved addresses for address selection
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedPickupAddressId, setSelectedPickupAddressId] = useState(null);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalContext, setAddressModalContext] = useState("pickup"); // "pickup" or "delivery"

  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  // Format a saved address into a single-line string
  const formatAddress = (addr) => {
    const parts = [
      addr.addressLine1,
      addr.addressLine2,
      addr.landmark,
      `${addr.city}, ${addr.state} - ${addr.postalCode}`,
    ].filter(Boolean);
    return parts.join(", ");
  };

  useEffect(() => {
    (async () => {
      try {
        const [shopRes, addrRes] = await Promise.allSettled([
          getMyShopContext(),
          getAddresses(),
        ]);

        if (shopRes.status === "fulfilled" && shopRes.value.success) {
          setShop(shopRes.value.data?.shop || null);
          const svcs = shopRes.value.data?.services || [];
          setServices(svcs);
          if (svcs.length > 0) setSelectedServiceId(svcs[0].id);
        } else {
          setContextError(true);
        }

        if (addrRes.status === "fulfilled" && addrRes.value.success) {
          const addrs = addrRes.value.data || [];
          setSavedAddresses(addrs);
          // Auto-select default address for pickup
          const defaultAddr = addrs.find((a) => a.isDefault);
          if (defaultAddr) {
            setSelectedPickupAddressId(defaultAddr.id);
            setPickupAddress(formatAddress(defaultAddr));
            setSelectedDeliveryAddressId(defaultAddr.id);
            setDeliveryAddress(formatAddress(defaultAddr));
          } else if (addrs.length > 0) {
            // Select the first address if no default
            setSelectedPickupAddressId(addrs[0].id);
            setPickupAddress(formatAddress(addrs[0]));
            setSelectedDeliveryAddressId(addrs[0].id);
            setDeliveryAddress(formatAddress(addrs[0]));
          }
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load services.");
        setContextError(true);
      } finally {
        setContextLoading(false);
      }
    })();
  }, []);

  const servicesById = useMemo(
    () => new Map(services.map((s) => [s.id, s])),
    [services],
  );

  const cartItems = useMemo(
    () =>
      cart
        .map((line) => ({ ...line, service: servicesById.get(line.serviceId) }))
        .filter((line) => line.service),
    [cart, servicesById],
  );

  const subtotal = cartItems.reduce(
    (sum, { service, quantity }) => sum + (Number(service.price) || 0) * quantity,
    0,
  );

  const selectedService = selectedServiceId ? servicesById.get(selectedServiceId) : null;

  // ---------- Cart actions ----------
  const addToCart = () => {
    if (!selectedService) return;
    const amount = Math.max(1, qty);
    setCart((prev) => {
      const existing = prev.find((l) => l.serviceId === selectedService.id);
      if (existing) {
        return prev.map((l) =>
          l.serviceId === selectedService.id
            ? { ...l, quantity: l.quantity + amount }
            : l,
        );
      }
      return [...prev, { serviceId: selectedService.id, quantity: amount }];
    });
    toast.success(`${selectedService.serviceName} added to your order`);
    setQty(1);
  };

  const changeCartQty = (serviceId, delta) => {
    setCart((prev) =>
      prev
        .map((l) =>
          l.serviceId === serviceId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  };

  const removeCartLine = (serviceId) => {
    setCart((prev) => prev.filter((l) => l.serviceId !== serviceId));
  };

  const hasItems = cartItems.length > 0;

  // ---------- Address selection ----------
  const handleSelectPickupAddress = (addr) => {
    setSelectedPickupAddressId(addr.id);
    setPickupAddress(formatAddress(addr));
  };

  const handleSelectDeliveryAddress = (addr) => {
    setSelectedDeliveryAddressId(addr.id);
    setDeliveryAddress(formatAddress(addr));
  };

  const handleOpenAddressModal = (context) => {
    setAddressModalContext(context);
    setShowAddressModal(true);
  };

  const handleAddressAdded = async () => {
    try {
      const res = await getAddresses();
      if (res.success) {
        const addrs = res.data || [];
        setSavedAddresses(addrs);
        // If this was the first address, auto-select it
        if (addrs.length === 1) {
          const newAddr = addrs[0];
          if (addressModalContext === "pickup") {
            setSelectedPickupAddressId(newAddr.id);
            setPickupAddress(formatAddress(newAddr));
          } else {
            setSelectedDeliveryAddressId(newAddr.id);
            setDeliveryAddress(formatAddress(newAddr));
          }
        }
      }
    } catch {
      /* silent */
    }
  };

  // ---------- Navigation ----------
  const goNext = () => {
    if (step === 0 && !hasItems) {
      toast.error("Add at least one service to continue.");
      return;
    }
    if (step === 1 && !pickupAddress.trim()) {
      toast.error("Please enter the pickup address.");
      return;
    }
    if (step === 1 && !pickupDate) {
      toast.error("Please choose a pickup date.");
      return;
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const resetForm = () => {
    setCart([]);
    setQty(1);
    setPickupAddress("");
    setPickupDate(todayISO());
    setPickupTime(TIME_SLOTS[1]);
    setSameAsPickup(true);
    setDeliveryAddress("");
    setDeliveryDate("");
    setDeliveryNote("");
    setStep(0);
  };

  // ---------- Place order ----------
  const handlePlaceOrder = async () => {
    if (!hasItems) {
      toast.error("Please add at least one service to your order.");
      return;
    }
    if (!pickupAddress.trim()) {
      toast.error("Please enter the pickup address.");
      return;
    }
    if (!pickupDate) {
      toast.error("Please choose a pickup date.");
      return;
    }

    setPlacing(true);
    try {
      // No shopId is sent — the backend automatically assigns the order to
      // the WashFlow laundry serving this customer.
      const res = await createOrder({
        pickupDate,
        pickupTime,
        pickupAddress: pickupAddress.trim(),
        deliveryAddress: sameAsPickup ? pickupAddress.trim() : deliveryAddress.trim(),
        deliveryDate: deliveryDate || null,
        deliveryNote: deliveryNote.trim() || null,
        items: cartItems.map(({ service, quantity }) => ({
          serviceId: service.id,
          quantity,
        })),
      });
      if (res.success) {
        toast.success("Order placed successfully!");
        setPlacedOrder(res.data);
        // Link the account to the laundry so future orders default to it.
        const orderShopId = res.data?.shop?.id;
        if (orderShopId && Number(user?.shopId) !== Number(orderShopId)) {
          updateUser({ shopId: Number(orderShopId) });
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not place the order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  // -------- Success screen --------
  if (placedOrder) {
    return (
      <div className="max-w-lg mx-auto mt-10" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        `}</style>
        <div
          className="text-center rounded-3xl border p-8 sm:p-10"
          style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
            style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
          >
            <CheckCircle2 size={30} color="#FFFFFF" />
          </div>
          <h2
            className="mt-6 text-2xl"
            style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
          >
            Order confirmed!
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            Order <span className="font-semibold" style={{ color: colors.textDark }}>#{placedOrder.id}</span>
            {placedOrder.shop?.name ? (
              <> for <span className="font-semibold" style={{ color: colors.textDark }}>{placedOrder.shop.name}</span></>
            ) : null}{" "}
            is placed.
            <br />
            Pickup {formatDate(placedOrder.pickup_date)}
            {placedOrder.pickup_time ? ` · ${placedOrder.pickup_time}` : ""}.
          </p>

          <div
            className="mt-6 rounded-xl px-5 py-4 flex items-center justify-between"
            style={{ backgroundColor: colors.cardTint }}
          >
            <span className="text-sm" style={{ color: colors.textMuted }}>Total</span>
            <span className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
              {formatINR(placedOrder.total_amount)}
            </span>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/customer/orders"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white transition-all hover:brightness-110"
              style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
            >
              Track my order <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => {
                setPlacedOrder(null);
                resetForm();
              }}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl transition-colors"
              style={{ color: colors.primaryTeal, backgroundColor: colors.cardTint }}
            >
              Place another order
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------- Loading the WashFlow context --------
  if (contextLoading) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="flex items-center justify-center py-24">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      </div>
    );
  }

  // -------- No services available (never a laundry-picker) --------
  if (contextError && services.length === 0) {
    return (
      <div style={{ fontFamily: "'Inter', sans-serif" }}>
        <div
          className="max-w-lg mx-auto mt-8 text-center rounded-3xl border p-8 sm:p-10"
          style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
        >
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${colors.mint}1F` }}>
            <Store size={24} color={colors.mint} />
          </div>
          <h2 className="mt-5 text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            No services available right now
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            We're setting things up. Please check back soon to place your order.
          </p>
        </div>
      </div>
    );
  }

  // -------- Main wizard --------
  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .no-input:focus { outline: none; border-color: ${colors.primaryTeal}; box-shadow: 0 0 0 3px rgba(2,128,144,0.14); }
      `}</style>

      <div className="mb-6">
        <h2
          className="text-2xl sm:text-3xl"
          style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}
        >
          Place a new order
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Choose your services, schedule pickup &amp; delivery, and we'll handle the rest.
        </p>
        {shop?.name && (
          <div
            className="mt-3 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium"
            style={{ backgroundColor: `${colors.mint}1A`, color: colors.seafoam }}
          >
            <Info size={13} /> Serving you from WashFlow · {shop.name}
          </div>
        )}
      </div>

      <Stepper step={step} />
      <StepHeader step={step} />

      <div className="grid lg:grid-cols-3 gap-5 lg:gap-6 items-start">
        <div className="lg:col-span-2 space-y-5">
          {/* ================= Step 1 — Services ================= */}
          {step === 0 && (
            <Card>
              <CardTitle icon={ShoppingBag}>Select services</CardTitle>
              <p className="text-xs" style={{ color: colors.textMuted }}>
                Tap a service to select it, set the quantity, then add it to your order. Add as many services as you need.
              </p>

              {services.length === 0 ? (
                <div className="text-center py-14">
                  <Sparkles size={26} style={{ color: colors.textMuted }} className="mx-auto mb-3" />
                  <p className="text-sm" style={{ color: colors.textMuted }}>
                    No services are available right now. Please check back soon!
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid sm:grid-cols-2 gap-3">
                    {services.map((s) => {
                      const isSelected = selectedServiceId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedServiceId(s.id)}
                          className="relative text-left rounded-xl border p-4 transition-all hover:-translate-y-0.5"
                          style={{
                            backgroundColor: isSelected ? `${colors.mint}0D` : colors.bgLight,
                            borderColor: isSelected ? colors.mint : colors.cardBorder,
                            boxShadow: isSelected ? `0 0 0 1px ${colors.mint}` : "none",
                          }}
                        >
                          {isSelected && (
                            <span
                              className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: colors.mint }}
                            >
                              <Check size={12} color="#FFFFFF" strokeWidth={3} />
                            </span>
                          )}
                          <div className="flex items-start justify-between gap-3 pr-6">
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate" style={{ color: colors.textDark }}>{s.serviceName}</div>
                              <div className="mt-0.5 text-[11px]" style={{ color: colors.textMuted }}>
                                {s.pricingType}
                                {s.estimatedTime ? ` · ${s.estimatedTime}` : ""}
                              </div>
                            </div>
                            <span className="text-sm font-semibold flex-shrink-0" style={{ color: colors.primaryTeal }}>
                              {formatINR(s.price)}
                            </span>
                          </div>
                          {s.description && (
                            <p className="mt-2 text-[11px] leading-relaxed" style={{ color: colors.textMuted }}>{s.description}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Quantity + Add service */}
                  <div
                    className="mt-5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    style={{ backgroundColor: colors.cardTint, border: `1px solid ${colors.cardBorder}` }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Adding</div>
                      <div className="text-sm font-semibold truncate" style={{ color: colors.textDark }}>
                        {selectedService ? selectedService.serviceName : "Select a service first"}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 rounded-xl border px-1.5 py-1" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
                        <button
                          type="button"
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold" style={{ color: colors.textDark }}>{qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty((q) => Math.min(999, q + 1))}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white transition-all hover:brightness-110"
                          style={{ backgroundColor: colors.primaryTeal }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={addToCart}
                        disabled={!selectedService}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                      >
                        <Plus size={14} /> Add service
                      </button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* ================= Step 2 — Pickup ================= */}
          {step === 1 && (
            <Card>
              <CardTitle icon={Home}>Pickup address</CardTitle>

              {/* Saved addresses with radio buttons */}
              {savedAddresses.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.textMuted }}>
                      Choose from saved addresses
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenAddressModal("pickup")}
                      className="inline-flex items-center gap-1 text-xs font-medium"
                      style={{ color: colors.primaryTeal }}
                    >
                      <PlusCircle size={13} /> Add new
                    </button>
                  </div>

                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className="flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all"
                      style={{
                        backgroundColor: selectedPickupAddressId === addr.id ? `${colors.mint}0D` : colors.bgLight,
                        borderColor: selectedPickupAddressId === addr.id ? colors.mint : colors.cardBorder,
                      }}
                    >
                      <input
                        type="radio"
                        name="pickupAddress"
                        checked={selectedPickupAddressId === addr.id}
                        onChange={() => handleSelectPickupAddress(addr)}
                        className="mt-0.5"
                        style={{ accentColor: colors.primaryTeal }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                              style={{ background: `${colors.mint}20`, color: colors.primaryTeal }}
                            >
                              <Star size={9} className="inline mr-0.5" /> Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                          {addr.fullName} · {addr.phone}
                        </p>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                          {formatAddress(addr)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {savedAddresses.length === 0 && (
                <div
                  className="mt-4 rounded-xl p-4 text-center"
                  style={{ backgroundColor: colors.cardTint, border: `1px dashed ${colors.cardBorder}` }}
                >
                  <MapPin size={18} style={{ color: colors.textMuted }} className="mx-auto mb-2" />
                  <p className="text-xs" style={{ color: colors.textMuted }}>No saved addresses yet.</p>
                  <button
                    type="button"
                    onClick={() => handleOpenAddressModal("pickup")}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
                    style={{ color: colors.primaryTeal }}
                  >
                    <PlusCircle size={13} /> Add your first address
                  </button>
                </div>
              )}

              {/* Manual address input */}
              <div className="mt-4">
                <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                  {savedAddresses.length > 0 ? "Or enter address manually" : "Pickup address *"}
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3" style={{ color: colors.textMuted }} />
                  <textarea
                    rows={3}
                    value={pickupAddress}
                    onChange={(e) => {
                      setPickupAddress(e.target.value);
                      setSelectedPickupAddressId(null);
                    }}
                    placeholder="Flat / house no, street, area, landmark, city"
                    className="no-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm resize-none"
                    style={{ backgroundColor: colors.cardTint, color: colors.textDark, borderColor: colors.cardBorder }}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Pickup date *</label>
                  <div className="relative">
                    <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                    <input
                      type="date"
                      min={todayISO()}
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="no-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm"
                      style={{ backgroundColor: colors.cardTint, color: colors.textDark, borderColor: colors.cardBorder }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Pickup time slot *</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="no-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm appearance-none"
                      style={{ backgroundColor: colors.cardTint, color: colors.textDark, borderColor: colors.cardBorder }}
                    >
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ================= Step 3 — Delivery ================= */}
          {step === 2 && (
            <Card>
              <CardTitle icon={Truck}>Delivery details</CardTitle>

              <label
                className="mt-4 flex items-start gap-3 rounded-xl border p-4 cursor-pointer"
                style={{ backgroundColor: colors.cardTint, borderColor: colors.cardBorder }}
              >
                <input
                  type="checkbox"
                  checked={sameAsPickup}
                  onChange={(e) => setSameAsPickup(e.target.checked)}
                  className="mt-0.5"
                  style={{ accentColor: colors.primaryTeal }}
                />
                <span className="text-sm" style={{ color: colors.textDark }}>
                  Deliver to the pickup address
                  <span className="block text-xs mt-0.5" style={{ color: colors.textMuted }}>{pickupAddress || "Enter your pickup address first"}</span>
                </span>
              </label>

              {!sameAsPickup && (
                <div className="mt-4 space-y-3">
                  {/* Saved addresses with radio buttons for delivery */}
                  {savedAddresses.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium uppercase tracking-wide" style={{ color: colors.textMuted }}>
                          Choose from saved addresses
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenAddressModal("delivery")}
                          className="inline-flex items-center gap-1 text-xs font-medium"
                          style={{ color: colors.primaryTeal }}
                        >
                          <PlusCircle size={13} /> Add new
                        </button>
                      </div>

                      {savedAddresses.map((addr) => (
                        <label
                          key={addr.id}
                          className="flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-all"
                          style={{
                            backgroundColor: selectedDeliveryAddressId === addr.id ? `${colors.mint}0D` : colors.bgLight,
                            borderColor: selectedDeliveryAddressId === addr.id ? colors.mint : colors.cardBorder,
                          }}
                        >
                          <input
                            type="radio"
                            name="deliveryAddress"
                            checked={selectedDeliveryAddressId === addr.id}
                            onChange={() => handleSelectDeliveryAddress(addr)}
                            className="mt-0.5"
                            style={{ accentColor: colors.primaryTeal }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                                {addr.label}
                              </span>
                              {addr.isDefault && (
                                <span
                                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                                  style={{ background: `${colors.mint}20`, color: colors.primaryTeal }}
                                >
                                  <Star size={9} className="inline mr-0.5" /> Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: colors.textMuted }}>
                              {addr.fullName} · {addr.phone}
                            </p>
                            <p className="text-xs mt-1 leading-relaxed" style={{ color: colors.textMuted }}>
                              {formatAddress(addr)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </>
                  )}

                  {/* Manual delivery address input */}
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>
                      {savedAddresses.length > 0 ? "Or enter delivery address manually" : "Delivery address *"}
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-3" style={{ color: colors.textMuted }} />
                      <textarea
                        rows={3}
                        value={deliveryAddress}
                        onChange={(e) => {
                          setDeliveryAddress(e.target.value);
                          setSelectedDeliveryAddressId(null);
                        }}
                        placeholder="Flat / house no, street, area, landmark, city"
                        className="no-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm resize-none"
                        style={{ backgroundColor: colors.cardTint, color: colors.textDark, borderColor: colors.cardBorder }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Preferred delivery date (optional)</label>
                  <div className="relative">
                    <CalendarDays size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                    <input
                      type="date"
                      min={todayISO()}
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="no-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm"
                      style={{ backgroundColor: colors.cardTint, color: colors.textDark, borderColor: colors.cardBorder }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: colors.textDark }}>Delivery note (optional)</label>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: colors.textMuted }} />
                    <input
                      type="text"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      placeholder="e.g. Call before you arrive"
                      className="no-input w-full rounded-xl border pl-10 pr-4 py-2.5 text-sm"
                      style={{ backgroundColor: colors.cardTint, color: colors.textDark, borderColor: colors.cardBorder }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* ================= Step 4 — Review ================= */}
          {step === 3 && (
            <Card>
              <CardTitle icon={Package}>Order summary</CardTitle>

              <div className="mt-4 space-y-3">
                {cartItems.map(({ service, quantity }) => (
                  <div key={service.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium" style={{ color: colors.textDark }}>
                        {service.serviceName}
                        <span className="text-xs font-normal" style={{ color: colors.textMuted }}> × {quantity}</span>
                      </div>
                      <div className="text-[11px]" style={{ color: colors.textMuted }}>{formatINR(service.price)} each</div>
                    </div>
                    <span className="font-medium flex-shrink-0" style={{ color: colors.textDark }}>
                      {formatINR((Number(service.price) || 0) * quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t space-y-2" style={{ borderColor: colors.cardBorder }}>
                <div className="flex items-start gap-2.5 text-sm">
                  <Home size={14} className="mt-0.5 flex-shrink-0" style={{ color: colors.seafoam }} />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Pickup</div>
                    <div style={{ color: colors.textDark }}>{pickupAddress}</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {formatDate(pickupDate)} · {pickupTime}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 text-sm">
                  <Truck size={14} className="mt-0.5 flex-shrink-0" style={{ color: colors.seafoam }} />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textMuted }}>Delivery</div>
                    <div style={{ color: colors.textDark }}>{sameAsPickup ? pickupAddress : deliveryAddress}</div>
                    <div className="text-xs" style={{ color: colors.textMuted }}>
                      {deliveryDate ? `Preferred ${formatDate(deliveryDate)} · ` : ""}
                      {deliveryNote || "No delivery note"}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Step nav */}
          <div className="flex items-center justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={goBack}
                className="inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                style={{ color: colors.primaryTeal, backgroundColor: colors.cardTint }}
              >
                <ArrowLeft size={15} /> Back
              </button>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110"
                style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
              >
                Continue <ArrowRight size={15} />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={placing}
                className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
              >
                {placing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Placing order...
                  </>
                ) : (
                  <>
                    Place order · {formatINR(subtotal)} <ArrowRight size={15} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right: live order summary */}
        <div className="lg:sticky lg:top-24">
          <Card>
            <CardTitle icon={ShoppingBag}>Order summary</CardTitle>

            {cartItems.length === 0 ? (
              <div className="mt-4 text-center py-6">
                <ShoppingBag size={22} style={{ color: colors.textMuted }} className="mx-auto mb-2" />
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Your order is empty. Add a service to get started.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {cartItems.map(({ service, quantity }) => (
                  <div
                    key={service.id}
                    className="rounded-xl border p-3"
                    style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: colors.textDark }}>{service.serviceName}</div>
                        <div className="text-[11px]" style={{ color: colors.textMuted }}>{formatINR(service.price)} each</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => changeCartQty(service.id, -1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                          style={{ backgroundColor: colors.cardTint, color: colors.textDark }}
                          aria-label={`Decrease ${service.serviceName} quantity`}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center text-xs font-semibold" style={{ color: colors.textDark }}>{quantity}</span>
                        <button
                          onClick={() => changeCartQty(service.id, 1)}
                          className="w-6 h-6 rounded-md flex items-center justify-center text-white transition-all hover:brightness-110"
                          style={{ backgroundColor: colors.primaryTeal }}
                          aria-label={`Increase ${service.serviceName} quantity`}
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeCartLine(service.id)}
                          className="ml-1 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                          style={{ color: "#E0645C", backgroundColor: "#FBE9E8" }}
                          aria-label={`Remove ${service.serviceName}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
                      <span className="text-[11px]" style={{ color: colors.textMuted }}>Quantity × {quantity}</span>
                      <span className="text-sm font-semibold" style={{ color: colors.textDark }}>
                        {formatINR((Number(service.price) || 0) * quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 pt-4 border-t flex items-center justify-between" style={{ borderColor: colors.cardBorder }}>
              <span className="text-sm" style={{ color: colors.textMuted }}>Total</span>
              <span className="text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
                {formatINR(subtotal)}
              </span>
            </div>

            <div className="mt-3 rounded-xl px-4 py-3 text-[11px] leading-relaxed" style={{ backgroundColor: colors.cardTint, color: colors.textMuted }}>
              <Clock size={11} className="inline mr-1" style={{ color: colors.seafoam }} />
              Free pickup &amp; delivery. Pay at delivery — no advance needed.
            </div>
          </Card>
        </div>
      </div>

      {/* Address Modal */}
      <AddAddressModal
        open={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        onSuccess={handleAddressAdded}
      />
    </div>
  );
}

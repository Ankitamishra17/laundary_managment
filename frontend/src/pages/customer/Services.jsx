import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Shirt,
  Sparkles,
  Droplets,
  Wind,
  BedDouble,
  Crown,
  Loader2,
  Store,
  ArrowRight,
  PlusCircle,
} from "lucide-react";
import { getMyShopContext } from "../../api/shopApi";
import { formatINR } from "../../utils/orderStatus";

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

const SERVICE_ICONS = {
  "wash & fold": Droplets,
  "wash and fold": Droplets,
  "wash & iron": Wind,
  "wash and iron": Wind,
  "dry clean": Sparkles,
  iron: Shirt,
  ironing: Shirt,
  bedding: BedDouble,
  premium: Crown,
};

function serviceIcon(name = "") {
  const key = name.toLowerCase();
  for (const [word, Icon] of Object.entries(SERVICE_ICONS)) {
    if (key.includes(word)) return Icon;
  }
  return Shirt;
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);

  // The WashFlow laundry is resolved automatically — the customer never
  // picks one. First order links the account; until then the platform
  // default laundry is used.
  useEffect(() => {
    (async () => {
      try {
        const res = await getMyShopContext();
        if (res.success) {
          setServices(res.data?.services || []);
          setShopName(res.data?.shop?.name || "");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load services.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
        .sv-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px -18px rgba(5,40,42,0.28); }
      `}</style>

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          Our services
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Everything your clothes need — every price tagged up front.
          {shopName && (
            <span className="block mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: colors.seafoam }}>
              <Store size={13} /> Serving you from WashFlow · {shopName}
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${colors.mint}1F` }}>
            <Sparkles size={24} color={colors.mint} />
          </div>
          <p className="text-sm" style={{ color: colors.textMuted }}>
            This laundry hasn't added any services yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {services.map((s) => {
            const Icon = serviceIcon(s.serviceName);
            return (
              <div
                key={s.id}
                className="sv-card rounded-2xl border p-6 sm:p-7 transition-all duration-300 flex flex-col"
                style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
                    <Icon size={22} color={colors.primaryTeal} />
                  </div>
                  <span className="text-right">
                    <span className="block text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>{formatINR(s.price)}</span>
                    <span className="text-[11px]" style={{ color: colors.textMuted }}>{s.pricingType}</span>
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-semibold" style={{ color: colors.textDark }}>{s.serviceName}</h3>
                {s.estimatedTime && (
                  <p className="mt-1 text-xs" style={{ color: colors.textMuted }}>{s.estimatedTime}</p>
                )}

                <button
                  onClick={() => navigate("/customer/new-order")}
                  className="mt-6 inline-flex items-center justify-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl text-white shadow-lg transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
                >
                  <PlusCircle size={15} /> Book now <ArrowRight size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

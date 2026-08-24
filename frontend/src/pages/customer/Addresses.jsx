import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MapPin, Home, Loader2, ArrowRight, PlusCircle } from "lucide-react";
import { getMyCustomerProfile } from "../../api/customerApi";

const colors = {
  primaryTeal: "#028090",
  seafoam: "#00A896",
  mint: "#02C39A",
  bgLight: "#FFFFFF",
  cardTint: "#EEF7F6",
  cardBorder: "#D8ECEA",
  textDark: "#0F2C2E",
  textMuted: "#5C7A78",
};

export default function Addresses() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyCustomerProfile();
        if (res.success) setProfile(res.data);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load your address.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasAddress = profile?.address || profile?.city;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
          Addresses
        </h2>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          Where we pick up from and deliver to.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin" style={{ color: colors.primaryTeal }} />
        </div>
      ) : hasAddress ? (
        <div className="grid sm:grid-cols-2 gap-5">
          <div
            className="rounded-2xl border p-5 sm:p-6"
            style={{ backgroundColor: colors.bgLight, borderColor: colors.mint }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colors.mint}1F` }}>
                <Home size={20} color={colors.mint} />
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${colors.mint}1F`, color: colors.seafoam }}>
                Default
              </span>
            </div>
            <div className="mt-4 text-sm font-semibold" style={{ color: colors.textDark }}>
              {profile?.name || "Home"}
            </div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
              {profile?.address || ""}
              {profile?.address && profile?.city ? ", " : ""}
              {profile?.city || ""}
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto mt-8 text-center rounded-3xl border p-8 sm:p-10" style={{ backgroundColor: colors.bgLight, borderColor: colors.cardBorder }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto" style={{ backgroundColor: `${colors.primaryTeal}1F` }}>
            <MapPin size={24} color={colors.primaryTeal} />
          </div>
          <h2 className="mt-5 text-xl" style={{ color: colors.textDark, fontFamily: "'Libre Baskerville', serif" }}>
            No saved address yet
          </h2>
          <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textMuted }}>
            You can still place an order — just enter your pickup and delivery addresses at checkout. Your address will be remembered here once you've placed an order.
          </p>
          <Link
            to="/customer/new-order"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-white transition-all hover:brightness-110"
            style={{ background: "linear-gradient(95deg, #028090, #02C39A)" }}
          >
            <PlusCircle size={15} /> Place an order <ArrowRight size={15} />
          </Link>
        </div>
      )}
    </div>
  );
}

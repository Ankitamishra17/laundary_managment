import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { getMyShopContext } from "../api/shopApi";

// Default brand — used before the shop loads / when no shop is assigned.
const DEFAULT_BRAND = {
  name: "WashFlow",
  primaryColor: "#028090",
  secondaryColor: "#02C39A",
};

const TenantContext = createContext({ shop: null, services: [], loading: true });

/**
 * TenantContext — resolves the current tenant (shop) for the customer-facing
 * app. The shop is derived from the authenticated customer's account
 * (server-side /api/shops/context), never from the URL or user input.
 *
 * Applies the shop's brand colors as CSS variables on :root so every
 * component can use `var(--tenant-primary)` / `var(--tenant-secondary)`.
 */
export const TenantProvider = ({ children }) => {
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Only customers have a tenant — other roles shouldn't hit this endpoint.
    if (!user || user.role !== "customer") {
      setLoading(false);
      return () => {};
    }

    getMyShopContext()
      .then((res) => {
        if (cancelled) return;
        setShop(res.data?.shop || null);
        setServices(res.data?.services || []);
        const s = res.data?.shop;
        if (s) {
          document.documentElement.style.setProperty(
            "--tenant-primary",
            s.primaryColor || DEFAULT_BRAND.primaryColor,
          );
          document.documentElement.style.setProperty(
            "--tenant-secondary",
            s.secondaryColor || DEFAULT_BRAND.secondaryColor,
          );
        }
      })
      .catch(() => {
        /* tenant fetch is best-effort — fall back to defaults */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const brand = shop
    ? {
        name: shop.name || DEFAULT_BRAND.name,
        logo: shop.logo || null,
        favicon: shop.favicon || null,
        primaryColor: shop.primaryColor || DEFAULT_BRAND.primaryColor,
        secondaryColor: shop.secondaryColor || DEFAULT_BRAND.secondaryColor,
        phone: shop.phone || null,
        email: shop.email || null,
        address: shop.address || null,
        city: shop.city || null,
      }
    : DEFAULT_BRAND;

  return (
    <TenantContext.Provider value={{ shop, brand, services, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => useContext(TenantContext);

import { createContext, useContext, useEffect, useState } from "react";
import { profileApi } from "../api/profileapi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Logged-in user
  const [user, setUser] = useState(null);

  // JWT Token
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // Loading state
  const [loading, setLoading] = useState(true);

  // Merge a partial update into the user (e.g. a new avatar after upload) and
  // persist it — every consumer (Topbar, Sidebar, Dashboard, Profile) re-renders
  // from the same source of truth, so the change shows up instantly everywhere.
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  // Check user when app starts
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    let parsed = null;
    try {
      parsed = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      // Corrupt stored user — fall through and start logged out.
    }

    if (parsed) setUser(parsed);

    // Old sessions may not have the avatar in localStorage. For employees,
    // quietly fetch the profile once so the photo syncs across the app even
    // after a hard refresh — no re-login needed.
    if (parsed?.role === "employee" && parsed?.id) {
      profileApi
        .getMyProfile()
        .then((data) => {
          if (data?.avatar && data.avatar !== parsed.avatar) {
            updateUser({ avatar: data.avatar });
          }
        })
        .catch(() => {
          /* profile fetch is best-effort — ignore */
        });
    }

    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Login Function
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", jwtToken);
  };

  // Logout Function
  const logout = () => {
    setUser(null);
    setToken("");

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook
export const useAuth = () => {
  return useContext(AuthContext);
};
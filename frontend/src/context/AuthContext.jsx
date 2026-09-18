// import { createContext, useContext, useEffect, useState } from "react";
// import { profileApi } from "../api/profileApi";

// const AuthContext = createContext();

// export const AuthProvider = ({ children }) => {
//   // Logged-in user
//   const [user, setUser] = useState(null);

//   // JWT Token
//   const [token, setToken] = useState(localStorage.getItem("token") || "");

//   // Loading state
//   const [loading, setLoading] = useState(true);

//   // Merge a partial update into the user (e.g. a new avatar after upload) and
//   // persist it — every consumer (Topbar, Sidebar, Dashboard, Profile) re-renders
//   // from the same source of truth, so the change shows up instantly everywhere.
//   const updateUser = (patch) => {
//     setUser((prev) => {
//       const next = { ...(prev || {}), ...patch };
//       localStorage.setItem("user", JSON.stringify(next));
//       return next;
//     });
//   };

//   // Check user when app starts
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     let parsed = null;
//     try {
//       parsed = storedUser ? JSON.parse(storedUser) : null;
//     } catch {
//       // Corrupt stored user — fall through and start logged out.
//     }

//     if (parsed) setUser(parsed);

//     // Old sessions may not have the avatar in localStorage. For employees,
//     // quietly fetch the profile once so the photo syncs across the app even
//     // after a hard refresh — no re-login needed.
//     if (parsed?.id) {
//       profileApi
//         .getMyProfile()
//         .then((data) => {
//           if (data?.avatar && data.avatar !== parsed.avatar) {
//             updateUser({ avatar: data.avatar });
//           }
//         })
//         .catch(() => {
//           /* profile fetch is best-effort — ignore */
//         });
//     }

//     setLoading(false);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Login Function
//   const login = (userData, jwtToken) => {
//     setUser(userData);
//     setToken(jwtToken);

//     localStorage.setItem("user", JSON.stringify(userData));
//     localStorage.setItem("token", jwtToken);
//   };

//   // Logout Function
//   const logout = () => {
//     setUser(null);
//     setToken("");

//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         token,
//         loading,
//         login,
//         logout,
//         updateUser,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom Hook
// export const useAuth = () => {
//   return useContext(AuthContext);
// };


import { createContext, useContext, useEffect, useState } from "react";
import { profileApi } from "../api/profileApi";


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Logged-in user
  const [user, setUser] = useState(null);

  // Which storage backend holds the current session's token.
  // "local"   -> localStorage  (survives browser restart, used when Keep me signed in is on)
  // "session" -> sessionStorage (cleared when the tab/browser closes, used when off)
  // Real value gets figured out in the mount effect below — don't assume "local" here.
  const [tokenStorage, setTokenStorage] = useState("local");

  // JWT Token — actual value gets set correctly in the mount effect below,
  // once we know which storage this session's data actually lives in.
  const [token, setToken] = useState("");

  // Loading state
  const [loading, setLoading] = useState(true);

  // Helper: the storage backend that owns the current session.
  const authStore = () => (tokenStorage === "session" ? sessionStorage : localStorage);

  // Merge a partial update into the user (e.g. a new avatar after upload) and
  // persist it — every consumer (Topbar, Sidebar, Dashboard, Profile) re-renders
  // from the same source of truth, so the change shows up instantly everywhere.
  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      authStore().setItem("user", JSON.stringify(next));
      return next;
    });
  };

  // Check user when app starts
  useEffect(() => {
    // Figure out which storage actually holds this session's data, instead of
    // assuming "local". Check localStorage (remembered session) first; if
    // nothing is there, fall back to sessionStorage (this-tab-only session).
    let storage = "local";
    let storedUser = localStorage.getItem("user");
    let storedToken = localStorage.getItem("token");

    if (!storedUser && !storedToken) {
      storage = "session";
      storedUser = sessionStorage.getItem("user");
      storedToken = sessionStorage.getItem("token");
    }

    setTokenStorage(storage);
    if (storedToken) setToken(storedToken);

    let parsed = null;
    try {
      parsed = storedUser ? JSON.parse(storedUser) : null;
    } catch {
      // Corrupt stored user — fall through and start logged out.
    }

    if (parsed) setUser(parsed);

    // Old sessions may not have the avatar in storage. For employees,
    // quietly fetch the profile once so the photo syncs across the app even
    // after a hard refresh — no re-login needed.
    if (parsed?.id) {
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
  // remember=true  -> persist to localStorage (survives browser restart)
  // remember=false -> persist to sessionStorage (cleared on tab/browser close)
  const login = (userData, jwtToken, remember = false) => {
    const storage = remember ? "local" : "session";
    const store = remember ? localStorage : sessionStorage;
    const otherStore = remember ? sessionStorage : localStorage;

    setTokenStorage(storage);
    setUser(userData);
    setToken(jwtToken);

    store.setItem("user", JSON.stringify(userData));
    store.setItem("token", jwtToken);

    // Clear any leftover data from the OTHER storage. Without this, a
    // previous "remember me" login can leave a stale token in localStorage
    // that silently logs the user back in on a later, non-remembered visit.
    otherStore.removeItem("user");
    otherStore.removeItem("token");

    
  };

  // Logout Function
  const logout = () => {
    setUser(null);
    setToken("");

    // Clear both storages, not just the currently active one, so no stale
    // session can resurrect itself later.
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    setTokenStorage("local");
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
// Central handler for expired / invalid sessions.
//
// Every axios instance in the app (api/axios.js, attendanceApi, taskApi,
// profileapi) wires this in via setupSessionInterceptor(). When the backend
// returns 401 for a protected call — e.g. "Invalid or expired token." — we
// clear the stored auth state and send the user back to the login page with
// ?session=expired so the UI can explain what happened.

let lastRedirectAt = 0;

export function handleSessionExpired() {
  const now = Date.now();

  // A burst of parallel requests can all fail with 401 at once — only
  // perform the redirect once.
  if (now - lastRedirectAt < 3000) return;
  lastRedirectAt = now;

  const path = window.location.pathname;
  const alreadyOnAuthPage =
    path.startsWith("/login") || path.startsWith("/create-password");

  // If the user is already on a login/auth page, do NOT touch localStorage.
  // A stale profile check (AuthContext mount) can return 401 while the user
  // is simultaneously logging in — clearing localStorage here would wipe the
  // fresh token the login just saved, causing an immediate redirect back.
  if (alreadyOnAuthPage) return;

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.assign("/login?session=expired");
}

/**
 * Attach a response interceptor that detects 401 responses from protected
 * endpoints and triggers the session-expired flow.
 */
export function setupSessionInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const url = error.config?.url || "";

        // 401 from /auth/login means wrong credentials — never redirect.
        const isLoginCall = url.includes("/auth/login");
        if (!isLoginCall) {
          handleSessionExpired();
        }
      }

      // A deactivated account gets 403 with an "inactive" message from the
      // auth middleware — treat that like an expired session so a disabled
      // employee is logged out of the panel instead of seeing errors.
      if (
        error.response?.status === 403 &&
        typeof error.response?.data?.message === "string" &&
        error.response.data.message.toLowerCase().includes("inactive")
      ) {
        handleSessionExpired();
      }

      return Promise.reject(error);
    }
  );
}

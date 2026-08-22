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

  localStorage.removeItem("token");
  localStorage.removeItem("user");

  const path = window.location.pathname;
  const alreadyOnAuthPage =
    path.startsWith("/login") || path.startsWith("/create-password");

  if (!alreadyOnAuthPage) {
    window.location.assign("/login?session=expired");
  }
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
      return Promise.reject(error);
    }
  );
}

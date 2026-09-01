import { useEffect, useState } from "react";

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Avatar — circular profile picture with an initials fallback.
 *
 * Reads `user.avatar` from the auth context, so the same photo appears in the
 * Topbar, Sidebar, Dashboard and Profile the moment it's updated — no refresh
 * or re-login required. Falls back to the user's initials while no photo is
 * set (or if the stored image fails to load).
 */
export default function Avatar({ user, className = "", style, fallbackBg }) {
  const [imgFailed, setImgFailed] = useState(false);

  const name = user?.name || "User";
  const avatar = user?.avatar;
  const src = avatar ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${avatar}` : null;

  // A new avatar URL (e.g. right after an upload) should always be tried again,
  // even if the previous image failed to load.
  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  if (src && !imgFailed) {
    return (
      <img
        src={src}
        alt={name}
        title={name}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={style}
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none ${className}`}
      style={{
        background: fallbackBg || "linear-gradient(135deg, #028090, #02C39A)",
        ...style,
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}

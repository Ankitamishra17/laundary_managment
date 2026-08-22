import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import axios from "axios";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing from the link.");
      return;
    }

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/auth/verify-email`, { params: { token } })
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.message || "Verification failed");
      });
  }, [token]);

  return (
    <div className="min-h-screen font-sans flex items-center justify-center px-4" style={{ background: "#EEF7F6" }}>
      <div className="bg-white border border-[#D8ECEA] rounded-2xl shadow-sm p-8 max-w-sm w-full text-center">
        {status === "verifying" && (
          <>
            <Loader2 size={40} className="mx-auto mb-4 animate-spin" style={{ color: "#028090" }} />
            <h1 className="font-serif text-xl text-[#0F2C2E]">Verifying your email…</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#DFF7F1" }}
            >
              <CheckCircle2 size={28} style={{ color: "#02C39A" }} />
            </div>
            <h1 className="font-serif text-xl text-[#0F2C2E] mb-2">Email Verified!</h1>
            <p className="text-sm text-[#6B8482] mb-5">{message}</p>
            <Link
              to="/login"
              className="inline-block text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #028090, #02C39A)" }}
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "#FBE4DC" }}
            >
              <XCircle size={28} style={{ color: "#B4482F" }} />
            </div>
            <h1 className="font-serif text-xl text-[#0F2C2E] mb-2">Verification Failed</h1>
            <p className="text-sm text-[#6B8482]">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
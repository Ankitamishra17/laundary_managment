import { useState, useEffect, useCallback } from "react";
import { profileApi } from "../api/profileApi";
import { useAuth } from "../context/AuthContext";

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  role: "",
  status: "",
  avatar: null,
  is_verified: false,
  is_phone_verified: false,
};

export function useMyProfile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await profileApi.getMyProfile();
      setProfile(data && typeof data === "object" ? data : DEFAULT_PROFILE);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (fields) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const updated = await profileApi.updateMyProfile(fields);
      setProfile((prev) => ({ ...prev, ...updated }));
      setSuccessMsg("Profile updated successfully");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      await profileApi.changePassword({ currentPassword, newPassword });
      setSuccessMsg("Password changed successfully");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const runOtpAction = async (fn) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);
      const result = await fn();
      setSuccessMsg(result?.message || "Success");
      // verification changes live on the server — refresh to show badges
      if (result?.data?.is_verified || result?.data?.is_phone_verified) {
        await fetchProfile();
      }
      return { ok: true, message: result?.message };
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong";
      setError(message);
      return { ok: false, error: message };
    } finally {
      setSaving(false);
    }
  };

  const sendEmailOtp = () => runOtpAction(() => profileApi.sendEmailOtp());
  const verifyEmailOtp = (otp) => runOtpAction(() => profileApi.verifyEmailOtp(otp));
  const sendPhoneOtp = () => runOtpAction(() => profileApi.sendPhoneOtp());
  const verifyPhoneOtp = (otp) => runOtpAction(() => profileApi.verifyPhoneOtp(otp));

  const updateAvatar = async (file) => {
    try {
      setSaving(true);
      setError(null);
      const result = await profileApi.updateAvatar(file);
      setProfile((prev) => ({ ...prev, avatar: result.avatar }));
      // Push the new photo into the auth context so the Topbar, Sidebar and
      // Dashboard all show it immediately — no refresh or re-login needed.
      updateUser({ avatar: result.avatar });
      setSuccessMsg("Photo updated");
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload photo");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    error,
    successMsg,
    clearMessages: () => {
      setError(null);
      setSuccessMsg(null);
    },
    updateProfile,
    changePassword,
    updateAvatar,
    sendEmailOtp,
    verifyEmailOtp,
    sendPhoneOtp,
    verifyPhoneOtp,
    refetch: fetchProfile,
  };
}
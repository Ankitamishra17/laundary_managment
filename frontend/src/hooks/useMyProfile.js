import { useState, useEffect, useCallback } from "react";
import { profileApi } from "../api/profileApi";

const DEFAULT_PROFILE = {
  name: "",
  email: "",
  phone: "",
  designation: "",
  role: "",
  status: "",
  avatar: null,
};

export function useMyProfile() {
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

  const updateAvatar = async (file) => {
    try {
      setSaving(true);
      setError(null);
      const result = await profileApi.updateAvatar(file);
      setProfile((prev) => ({ ...prev, avatar: result.avatar }));
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
    refetch: fetchProfile,
  };
}
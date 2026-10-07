import { useState, useEffect } from "react";

export type AvatarPreset =
  "default" | "nido" | "toto" | "chispa" | "star" | "fire" | "money" | "custom";

export interface UserAvatarState {
  preset: AvatarPreset;
  customPhoto: string | null;
}

const AVATAR_PRESET_KEY = "uali_user_avatar_preset";
const CUSTOM_PHOTO_KEY = "uali_user_custom_photo";
const AVATAR_EVENT_NAME = "uali_avatar_changed";

export function getStoredAvatar(): UserAvatarState {
  if (typeof window === "undefined") {
    return { preset: "default", customPhoto: null };
  }
  const preset = (localStorage.getItem(AVATAR_PRESET_KEY) as AvatarPreset) || "default";
  const customPhoto = localStorage.getItem(CUSTOM_PHOTO_KEY);
  return { preset, customPhoto };
}

export function saveStoredAvatar(preset: AvatarPreset, customPhoto: string | null = null) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AVATAR_PRESET_KEY, preset);
  if (customPhoto) {
    localStorage.setItem(CUSTOM_PHOTO_KEY, customPhoto);
  } else if (preset !== "custom") {
    localStorage.removeItem(CUSTOM_PHOTO_KEY);
  }
  window.dispatchEvent(new CustomEvent(AVATAR_EVENT_NAME, { detail: { preset, customPhoto } }));
}

export function useUserAvatar(): UserAvatarState {
  const [avatar, setAvatar] = useState<UserAvatarState>(getStoredAvatar);

  useEffect(() => {
    function handleChange() {
      setAvatar(getStoredAvatar());
    }
    window.addEventListener(AVATAR_EVENT_NAME, handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(AVATAR_EVENT_NAME, handleChange);
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  return avatar;
}

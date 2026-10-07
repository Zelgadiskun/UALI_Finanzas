import React from "react";
import {
  ChispaCharacter,
  NidoCharacter,
  TotoCharacter,
} from "@/components/ffos/characters/Characters";
import { useUserAvatar, type AvatarPreset } from "@/lib/ffos/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarDisplayProps {
  displayName?: string | null;
  className?: string;
  presetOverride?: AvatarPreset;
  customPhotoOverride?: string | null;
  size?: "sm" | "md" | "lg";
}

export function UserAvatarDisplay({
  displayName,
  className,
  presetOverride,
  customPhotoOverride,
  size = "md",
}: UserAvatarDisplayProps) {
  const stored = useUserAvatar();
  const preset = presetOverride ?? stored.preset;
  const customPhoto = customPhotoOverride !== undefined ? customPhotoOverride : stored.customPhoto;

  const initial = (displayName?.trim()?.charAt(0) || "U").toUpperCase();

  if (preset === "custom" && customPhoto) {
    return (
      <img
        src={customPhoto}
        alt={`Avatar de ${displayName || "usuario"}`}
        className={cn("size-full object-cover rounded-full", className)}
      />
    );
  }

  if (preset === "nido") {
    return <NidoCharacter className={cn("size-full p-0.5", className)} />;
  }

  if (preset === "toto") {
    return <TotoCharacter className={cn("size-full p-0.5", className)} />;
  }

  if (preset === "chispa") {
    return <ChispaCharacter className={cn("size-full p-0.5", className)} />;
  }

  if (preset === "star") {
    return (
      <span className={cn(size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-base")}>
        ⭐
      </span>
    );
  }

  if (preset === "fire") {
    return (
      <span className={cn(size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-base")}>
        🔥
      </span>
    );
  }

  if (preset === "money") {
    return (
      <span className={cn(size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-base")}>
        💰
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-extrabold text-amber-300 font-sans select-none",
        size === "sm" ? "text-xs" : size === "lg" ? "text-2xl" : "text-sm",
        className,
      )}
    >
      {initial}
    </span>
  );
}

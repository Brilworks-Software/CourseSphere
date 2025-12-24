import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_AVATAR_URL =
  "https://ui-avatars.com/api/?name=User&background=00b9c3&size=128";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

// App's primary color (hex, without #)
export const APP_PRIMARY_COLOR = "065f74"; // Use your theme's primary color

/**
 * Generate a default avatar URL using name and background color.
 * @param name - The name to use for the avatar.
 * @param background - Hex color string (without #).
 * @returns Avatar URL string.
 */
export function generateAvatarUrl(
  name: string,
  background: string = APP_PRIMARY_COLOR
) {
  const parts = name.trim().split(" ");
  const initials = (parts[0]?.charAt(0) || "") + (parts[1]?.charAt(0) || "");

  const encoded = encodeURIComponent(initials.toUpperCase() || "U");

  return `https://ui-avatars.com/api/?name=${encoded}&background=${background}&color=fff&size=128`;
}

export const getSupabaseSubdomain = (url: string): string | null => {
  const match = url.match(/^https?:\/\/([^\.]+)\.supabase\.co/);
  return match ? match[1] : null;
};

export interface SessionVerificationParams {
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  token_type: string | null;
  type: string | null;
  code: string | null;
}

export const parseHashParamsForSessionVerification = (
  hash: string
): SessionVerificationParams => {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return {
    access_token: params.get("access_token"),
    refresh_token: params.get("refresh_token"),
    expires_at: params.get("expires_at"),
    token_type: params.get("token_type"),
    type: params.get("type"),
    code: params.get("code"),
  };
};

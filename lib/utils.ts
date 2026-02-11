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
export const APP_PRIMARY_COLOR = "00b9c3"; // Use your theme's primary color

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


export const EDITOR_TOOLBAR =
  "blocks | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent";

export const EDITOR_PLUGIN = ["wordcount", "lists", "link", "table"];

export const EDITOR_MENUBAR = "edit insert format table";

// helpers
export function totalSecondsFromCourse(course: any) {
  try {
    const lessons = course?.lessons ?? [];
    if (!lessons.length) return 0;

    // Sum raw durations (unknown unit)
    const sumRaw = lessons.reduce((sum: number, l: any) => sum + (Number(l.duration) || 0), 0);
    const avgRaw = sumRaw / lessons.length;

    // Heuristic:
    // - If average raw duration > 10 -> likely durations are in seconds (e.g. 60, 120).
    // - Otherwise treat raw as minutes.
    const likelySeconds = avgRaw > 10;

    if (likelySeconds) {
      // durations are seconds already
      return Math.round(sumRaw);
    } else {
      // durations provided as minutes -> convert to seconds
      return Math.round(sumRaw * 60);
    }
  } catch (e) {
    return 0;
  }
}

export function formatHMS(totalSeconds: number) {
  if (totalSeconds === null || totalSeconds === undefined) return "—";
  if (totalSeconds <= 0) return "0s";

  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;

  // Build a compact label depending on available units
  if (h > 0) {
    // include seconds only if no minutes (rare) or you want finer detail; keep h and m
    return s ? `${h}h ${m}m ${s}s` : `${h}h ${m}m`;
  }
  if (m > 0) {
    return s ? `${m}m ${s}s` : `${m}m`;
  }
  return `${s}s`;
}
export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id?: string | null;
}

const AUTH_TOKEN_KEY = "sb-auth-token";
const REFRESH_TOKEN_KEY = "sb-refresh-token";
const USER_ID_KEY = "sb-user-id";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie || "";
  const parts = raw.split("; ");
  for (const part of parts) {
    const [k, ...rest] = part.split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function setCookie(name: string, value: string, expires?: Date) {
  if (typeof document === "undefined") return;
  let cookie = `${name}=${encodeURIComponent(value)}; path=/`;
  if (expires) cookie += `; expires=${expires.toUTCString()}`;
  // Do not set HttpOnly from client; secure only in production if served over HTTPS
  if (location.protocol === "https:") cookie += "; secure";
  document.cookie = cookie;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export const clientTokenManager = {
  getAccessToken(): string | null {
    return getCookie(AUTH_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_KEY);
  },

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (e) {
      console.error("clientTokenManager.isTokenExpired decode error", e);
      return true;
    }
  },

  setTokens(tokenData: TokenData) {
    try {
      const expiresAt = new Date(tokenData.expires_at * 1000);
      setCookie(AUTH_TOKEN_KEY, tokenData.access_token, expiresAt);

      const refreshExpires = new Date();
      refreshExpires.setDate(refreshExpires.getDate() + 30);
      setCookie(REFRESH_TOKEN_KEY, tokenData.refresh_token, refreshExpires);

      if (tokenData.user_id) {
        setCookie(USER_ID_KEY, tokenData.user_id, refreshExpires);
      }
    } catch (e) {
      console.error("clientTokenManager.setTokens error", e);
    }
  },

  clearTokens() {
    deleteCookie(AUTH_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
    deleteCookie(USER_ID_KEY);
  },
};

export default clientTokenManager;

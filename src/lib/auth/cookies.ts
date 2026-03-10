export const ACCESS_TOKEN_COOKIE = "clinic_access_token";

export function buildAccessTokenCookie(token: string | null) {
  if (!token) {
    return `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
  }

  return `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=3600; samesite=lax`;
}

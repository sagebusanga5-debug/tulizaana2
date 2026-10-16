import { Request, Response } from "express";

export const AUTH_COOKIE_NAME = "tlz_auth";

export interface CookieOptions {
  httpOnly: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  path?: string;
  maxAge?: number;
}

export function resolveCookieSecureFlag(): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }
  return process.env.COOKIE_SECURE === "true";
}

export function resolveCookieSameSite(): "strict" | "lax" | "none" {
  const explicit = process.env.COOKIE_SAME_SITE;
  if (explicit === "lax" || explicit === "none" || explicit === "strict") {
    return explicit;
  }
  return "strict";
}

export function getAuthCookieOptions(maxAgeMs: number): CookieOptions {
  const secure = resolveCookieSecureFlag();
  const sameSite = resolveCookieSameSite();

  return {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: maxAgeMs,
  };
}

export function setAuthCookie(res: Response, token: string, maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): void {
  const options = getAuthCookieOptions(maxAgeMs);
  res.cookie(AUTH_COOKIE_NAME, token, options);
}

export function clearAuthCookie(res: Response): void {
  const options = getAuthCookieOptions(0);
  res.cookie(AUTH_COOKIE_NAME, "", { ...options, maxAge: 0, expires: new Date(0) });
}

export function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const name = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1);
    if (!name) continue;

    try {
      cookies[name] = decodeURIComponent(rawValue);
    } catch {
      cookies[name] = rawValue;
    }
  }

  return cookies;
}

export function attachParsedCookies(req: Request): void {
  const reqWithCookies = req as Request & { cookies?: Record<string, string | undefined> };
  if (reqWithCookies.cookies) return;
  reqWithCookies.cookies = parseCookieHeader(req.headers.cookie);
}

export function getTokenFromCookie(req: Request & { cookies?: Record<string, string | undefined> }): string | null {
  const cookies = req.cookies ?? parseCookieHeader(req.headers.cookie);
  const raw = cookies[AUTH_COOKIE_NAME];
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

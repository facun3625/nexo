"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const COOKIE_NAME = "penalva_sid";
const SESSION_MINUTES = 30;

function getOrCreateSessionId(): string {
  // Try to read existing cookie
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (match) {
    // Refresh expiry (sliding window)
    refreshCookie(match[1]);
    return match[1];
  }
  // Generate a new session ID
  const newId = crypto.randomUUID();
  refreshCookie(newId);
  return newId;
}

function refreshCookie(id: string) {
  const expires = new Date(Date.now() + SESSION_MINUTES * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${id}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function TrackPageView() {
  const pathname = usePathname();
  const lastTracked = useRef<string>("");

  useEffect(() => {
    // Don't track admin routes or API routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    // Avoid double tracking same path within the same mount
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const sessionId = getOrCreateSessionId();

    const propertyId = pathname.startsWith("/propiedad/")
      ? pathname.split("/propiedad/")[1]
      : undefined;

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, propertyId, sessionId }),
    }).catch(() => {}); // Silent fail — never break UX
  }, [pathname]);

  return null;
}

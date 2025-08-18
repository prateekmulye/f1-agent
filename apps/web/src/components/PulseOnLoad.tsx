"use client";

import { useEffect } from "react";

/**
 * PulseOnLoad
 * Client-only component that pings the throttled OpenF1 pulse endpoint once per
 * browser session to keep live data fresh on Hobby plans without external cron.
 */
export default function PulseOnLoad() {
  useEffect(() => {
    const key = "openf1:pulsed";
    if (typeof window === "undefined") return;

    // Once per tab session
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    // Fire-and-forget; server will throttle by TTL.
    // Pass a conservative ttl=900s (15 min) so multiple page loads within
    // the same timeframe won’t re-trigger server work across users.
    fetch("/api/data/openf1/pulse?ttl=900", { method: "GET", cache: "no-store" })
      .then(() => {})
      .catch(() => {});
  }, []);

  return null;
}

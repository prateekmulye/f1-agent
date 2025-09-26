"use client";

import { useEffect } from "react";

/**
 * PulseOnLoad
 * Client-only component that previously pinged the throttled OpenF1 pulse endpoint.
 * Note: OpenF1 endpoints are not available in the Python backend migration.
 * This component is kept for compatibility but disabled.
 */
export default function PulseOnLoad() {
  useEffect(() => {
    // OpenF1 pulse endpoint is not available in Python backend
    // This functionality has been disabled during API migration
    console.log("PulseOnLoad: OpenF1 pulse endpoint not available in Python backend");
  }, []);

  return null;
}

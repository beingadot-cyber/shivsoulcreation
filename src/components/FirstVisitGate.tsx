"use client";

import { useEffect } from "react";
import { openAuthModal, AUTH_CLOSED_EVENT } from "./AuthModal";

/**
 * Shows the signup popup to first-time visitors on the homepage.
 * - Skipped when the customer is logged in.
 * - Skipped for the rest of the browsing session once dismissed.
 */
export default function FirstVisitGate() {
  useEffect(() => {
    if (sessionStorage.getItem("ssc_auth_dismissed") === "1") return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || data.customer) return;
        timer = setTimeout(() => {
          if (!cancelled && !sessionStorage.getItem("ssc_auth_dismissed")) {
            openAuthModal("signup");
          }
        }, 1000);
      } catch {
        /* network hiccup — skip popup */
      }
    })();

    const markDismissed = () => sessionStorage.setItem("ssc_auth_dismissed", "1");
    window.addEventListener(AUTH_CLOSED_EVENT, markDismissed);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener(AUTH_CLOSED_EVENT, markDismissed);
    };
  }, []);

  return null;
}

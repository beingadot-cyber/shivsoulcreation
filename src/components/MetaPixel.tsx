"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { PIXEL_ID } from "@/lib/pixel";

/**
 * Loads the Meta Pixel on the public site (not the admin panel) and fires a
 * PageView on the first load and on every client-side page change.
 */
export default function MetaPixel() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);
  const isAdmin = pathname.startsWith("/admin");

  function firePageView() {
    if (typeof window === "undefined" || typeof window.fbq !== "function") return;
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.fbq("track", "PageView");
  }

  useEffect(() => {
    if (!isAdmin) firePageView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, isAdmin]);

  if (isAdmin) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive" onReady={firePageView}>
        {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}

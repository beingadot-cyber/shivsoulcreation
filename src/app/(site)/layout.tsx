import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import { getSettings } from "@/lib/settings";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

// Microsoft Clarity (free session recordings + heatmaps). Public site only — not the admin panel.
const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID || "z45iylbb4f";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo.png`,
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
    ...(settings.contact_mobile ? { telephone: `+91${settings.contact_mobile}` } : {}),
  };
  return (
    <div className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }}
      />
      <Header settings={settings} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <FloatingCart />
      {CLARITY_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
        </Script>
      )}
    </div>
  );
}

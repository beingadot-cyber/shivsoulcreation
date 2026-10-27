import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingCart from "@/components/FloatingCart";
import { getSettings } from "@/lib/settings";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

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
    </div>
  );
}

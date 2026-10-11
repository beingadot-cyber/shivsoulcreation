import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSettings } from "@/lib/settings";

const MAP: Record<string, { key: string; title: string }> = {
  shipping: { key: "shipping_policy", title: "Shipping Policy" },
  returns: { key: "return_policy", title: "Return Policy" },
  privacy: { key: "privacy_policy", title: "Privacy Policy" },
  terms: { key: "terms", title: "Terms & Conditions" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: MAP[slug]?.title || "Policy" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = MAP[slug];
  if (!entry) notFound();
  const settings = await getSettings();
  const text = settings[entry.key] || "This policy will be updated soon.";
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 pb-16">
      <h1 className="section-title mb-6">{entry.title}</h1>
      <div className="card p-6 sm:p-8">
        {text.split(/\n+/).map((para, i) => (
          <p key={i} className="mb-4 text-sm leading-relaxed text-plum/85 last:mb-0">
            {para}
          </p>
        ))}
      </div>
    </div>
  );
}

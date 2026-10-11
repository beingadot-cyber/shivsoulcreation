"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Lock } from "lucide-react";

const BUSINESS_FIELDS: { key: string; label: string; placeholder: string; type?: string; hint?: string }[] = [
  { key: "store_name", label: "Store Name", placeholder: "Shiv Soul Creations" },
  { key: "tagline", label: "Tagline", placeholder: "Handcrafted festive décor & gifting" },
  { key: "whatsapp_number", label: "Business WhatsApp Number", placeholder: "91XXXXXXXXXX (with country code)", hint: "Used for WhatsApp orders — include country code, digits only." },
  { key: "upi_id", label: "UPI ID", placeholder: "yourname@upi", hint: "Shown at checkout for direct UPI payment." },
  { key: "upi_name", label: "UPI Payee Name", placeholder: "Shiv Soul Creations" },
  { key: "instagram_url", label: "Instagram URL", placeholder: "https://instagram.com/yourpage" },
  { key: "facebook_url", label: "Facebook URL", placeholder: "https://facebook.com/yourpage" },
  { key: "youtube_url", label: "YouTube URL", placeholder: "https://youtube.com/@yourchannel" },
  { key: "contact_mobile", label: "Contact Mobile", placeholder: "98XXXXXXXX" },
  { key: "contact_email", label: "Contact Email", placeholder: "hello@example.com" },
  { key: "announcement", label: "Announcement Bar Text", placeholder: "Shown at the very top of the website" },
];

const POLICY_FIELDS: { key: string; label: string }[] = [
  { key: "about", label: "About / Footer Brand Text" },
  { key: "business_address", label: "Business Address (footer)" },
  { key: "shipping_policy", label: "Shipping Policy" },
  { key: "return_policy", label: "Return Policy" },
  { key: "privacy_policy", label: "Privacy Policy" },
  { key: "terms", label: "Terms & Conditions" },
];

export default function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>(settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setSaved(false);
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: form }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwBusy(true);
    setPwMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "change-password", currentPassword: curPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwBusy(false);
    if (data.error) {
      setPwMsg(data.error);
      return;
    }
    setPwMsg("Password updated successfully.");
    setCurPw("");
    setNewPw("");
  }

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-semibold text-plum">Business Settings</h1>

      <form onSubmit={save} className="space-y-6">
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-plum">Business &amp; Contact</h2>
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-600">{error}</div>
          )}
          {saved && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-sage/10 px-4 py-3 text-xs font-bold text-sage">
              <Check className="h-4 w-4" /> Settings saved — the website is updated.
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {BUSINESS_FIELDS.map((f) => (
              <div key={f.key} className={f.key === "announcement" || f.key === "store_name" ? "sm:col-span-2" : ""}>
                <label className="label" htmlFor={`s-${f.key}`}>{f.label}</label>
                <input
                  id={`s-${f.key}`}
                  className="input"
                  type={f.type || "text"}
                  value={form[f.key] || ""}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                />
                {f.hint && <p className="mt-1 text-[11px] font-semibold text-plumsoft">{f.hint}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-plum">Footer &amp; Policies</h2>
          <div className="space-y-4">
            {POLICY_FIELDS.map((f) => (
              <div key={f.key}>
                <label className="label" htmlFor={`s-${f.key}`}>{f.label}</label>
                <textarea
                  id={`s-${f.key}`}
                  className="input min-h-24 resize-y"
                  value={form[f.key] || ""}
                  onChange={set(f.key)}
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-dark px-8 py-3">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Saving…
            </>
          ) : (
            "Save All Settings"
          )}
        </button>
      </form>

      <form onSubmit={changePassword} className="card mt-8 p-5 sm:p-6">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-semibold text-plum">
          <Lock className="h-5 w-5 text-rose" /> Change Admin Password
        </h2>
        <p className="mb-4 text-xs font-semibold text-plumsoft">
          Default credentials are <span className="font-mono">admin / Admin@12345</span> — change them after first login.
        </p>
        {pwMsg && (
          <div className={`mb-4 rounded-xl px-4 py-3 text-xs font-semibold ${pwMsg.includes("success") ? "bg-sage/10 text-sage" : "bg-red-50 text-red-600"}`}>
            {pwMsg}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cpw">Current Password</label>
            <input id="cpw" type="password" className="input" value={curPw} onChange={(e) => setCurPw(e.target.value)} required autoComplete="current-password" />
          </div>
          <div>
            <label className="label" htmlFor="npw">New Password</label>
            <input id="npw" type="password" className="input" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} autoComplete="new-password" />
          </div>
        </div>
        <button type="submit" disabled={pwBusy} className="btn-rose mt-4">
          {pwBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
        </button>
      </form>
    </div>
  );
}

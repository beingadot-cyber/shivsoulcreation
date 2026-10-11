"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClipboardList,
  Flower2,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Users,
  ExternalLink,
} from "lucide-react";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/homepage", label: "Homepage", icon: Home },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const navLinks = (onNavigate?: () => void) =>
    LINKS.map((l) => (
      <Link
        key={l.href}
        href={l.href}
        onClick={onNavigate}
        className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition ${
          isActive(l.href)
            ? "bg-plum text-white"
            : "text-plum hover:bg-blush"
        }`}
      >
        <l.icon className="h-4.5 w-4.5 shrink-0" strokeWidth={1.8} />
        {l.label}
      </Link>
    ));

  return (
    <div className="min-h-dvh bg-[#faf5f1]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-plum/10 bg-white p-4 lg:flex">
        <Link href="/admin/dashboard" className="mb-6 flex items-center gap-2.5 px-1">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blush text-rose">
            <Flower2 className="h-5 w-5" strokeWidth={1.7} />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-sm font-semibold text-plum">Shiv Soul</span>
            <span className="block text-[9px] font-bold tracking-[0.2em] text-rose uppercase">
              Admin Panel
            </span>
          </span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">{navLinks()}</nav>
        <div className="space-y-1 border-t border-plum/10 pt-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-plumsoft transition hover:bg-blush hover:text-plum"
          >
            <ExternalLink className="h-4.5 w-4.5" strokeWidth={1.8} /> View Website
          </Link>
          <button
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold text-rosedeep transition hover:bg-blush"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} /> Logout
          </button>
          <p className="px-3.5 pt-1 text-[11px] font-semibold text-plumsoft">Signed in as {username}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 border-b border-plum/10 bg-white lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blush text-rose">
              <Flower2 className="h-4 w-4" />
            </span>
            <span className="font-display text-sm font-semibold text-plum">Admin Panel</span>
          </Link>
          <button
            onClick={logout}
            className="flex cursor-pointer items-center gap-1.5 rounded-full bg-blush px-3.5 py-2 text-xs font-bold text-rosedeep"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 pb-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                isActive(l.href) ? "bg-plum text-white" : "bg-blush text-rosedeep"
              }`}
            >
              <l.icon className="h-3.5 w-3.5" /> {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <main className="px-4 py-6 lg:pl-68 lg:pr-8 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Settings, Server } from "lucide-react";
import { BrandIcon } from "@/components/brand-icon";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/services", label: "Services", icon: Server },
  { href: "/settings", label: "Settings", icon: Settings },
];

const minimalLayoutPaths = ["/login", "/setup"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const minimalLayout = minimalLayoutPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (minimalLayout) {
    return (
      <div className="min-h-dvh bg-background">
        <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card/60 p-4 backdrop-blur lg:block">
        <Brand />
        <nav className="mt-8 space-y-1" aria-label="Main">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
        </nav>
      </aside>

      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:ml-64 lg:px-8 lg:pb-8"
      >
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur lg:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-1">
          {navItems.map((item) => (
            <MobileNavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <BrandIcon className="size-9 rounded-lg" />
      <span>
        <span className="block text-sm font-semibold">UniHomelabDash</span>
        <span className="block text-xs text-muted-foreground">Homelab control plane</span>
      </span>
    </Link>
  );
}

function NavLink({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      <Icon className="size-4" />
      {item.label}
    </Link>
  );
}

function MobileNavLink({
  item,
  active,
}: {
  item: (typeof navItems)[number];
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-xs text-muted-foreground",
        active && "bg-muted text-foreground"
      )}
    >
      <Icon className="size-4" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === href : pathname.startsWith(href);
}

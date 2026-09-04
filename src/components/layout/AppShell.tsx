import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Search, Settings2, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav";
import { StatusBadge } from "@/components/primitives/StatusBadge";

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-4 py-4">
        <div className="numeric flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          FI
        </div>
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-semibold">Football Intelligence</div>
          <div className="text-caption text-subtle-foreground">Quant research platform</div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-2 pb-1.5 text-label text-subtle-foreground">{group.label}</div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  "exact" in item && item.exact
                    ? pathname === item.to
                    : pathname === item.to || pathname.startsWith(`${item.to}/`);
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "h-3.5 w-0.5 rounded-full transition-colors",
                          active ? "bg-primary" : "bg-transparent group-hover:bg-border-strong",
                        )}
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-4 py-3">
        <div className="text-caption text-subtle-foreground">Environment</div>
        <div className="mt-1 flex items-center justify-between">
          <span className="numeric text-xs">local / demo</span>
          <StatusBadge tone="brand">Shadow</StatusBadge>
        </div>
      </div>
    </div>
  );
}

function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <label className="relative hidden min-w-0 flex-1 items-center md:flex md:max-w-md">
        <Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-subtle-foreground" />
        <input
          type="search"
          placeholder="Search fixtures, teams, models…"
          className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-16 text-sm placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="numeric pointer-events-none absolute right-2 text-caption text-subtle-foreground">
          ⌘K
        </span>
      </label>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <StatusBadge tone="warning">Research mode</StatusBadge>
        <span className="hidden items-center gap-1.5 text-caption text-muted-foreground sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          Last sync <span className="numeric">12:03 UTC</span>
        </span>
        <button
          type="button"
          aria-label="Settings"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Account"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-elevated text-muted-foreground"
        >
          <User className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-sidebar-border bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-background/80"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-sidebar-border bg-sidebar">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-3 rounded-md p-1.5 text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-60">
        <Topbar onOpenMenu={() => setOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}

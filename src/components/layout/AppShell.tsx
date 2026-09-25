import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Menu, Search, Settings2, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { navGroups } from "./nav";
import { useQuery } from "@tanstack/react-query";
import { StatusBadge } from "@/components/primitives/StatusBadge";
import { DataSourcesProvider, PageDataModeBadge } from "@/components/system/DataSources";
import { DATA_MODE, LIVE_ENABLED } from "@/lib/api/mode";
import { live } from "@/lib/api/v1/queries";
import { timeOf } from "@/lib/format";
import {
  CommandPalette,
  destinationFor,
  SEARCH_EMPTY,
  useEntitySearch,
} from "@/components/system/CommandPalette";

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
          <span className="numeric text-xs">local / {DATA_MODE}</span>
          <StatusBadge tone="brand">Shadow</StatusBadge>
        </div>
      </div>
    </div>
  );
}

function GlobalSearch({ onOpenPalette }: { onOpenPalette: () => void }) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const hits = useEntitySearch(term, 6);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={box} className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
      <label className="relative flex items-center">
        <span className="sr-only">Search fixtures, teams and models</span>
        <Search
          aria-hidden
          className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-subtle-foreground"
        />
        <input
          type="search"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "Enter" && hits[0]) {
              const hit = hits[0];
              setOpen(false);
              setTerm("");
              if (hit.fixtureId && destinationFor(hit) === "/matches/$fixtureId") {
                void navigate({ to: "/matches/$fixtureId", params: { fixtureId: hit.fixtureId } });
              } else {
                void navigate({ to: destinationFor(hit) });
              }
            }
          }}
          placeholder="Search fixtures, teams, models…"
          className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-16 text-sm placeholder:text-subtle-foreground focus:border-border-strong focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          className="numeric absolute right-1.5 rounded border border-border px-1 py-0.5 text-caption text-subtle-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          ⌘K
        </button>
      </label>

      {open && term.trim() ? (
        <div className="absolute left-0 right-0 top-10 z-40 overflow-hidden rounded-md border border-border bg-card shadow-lg">
          {hits.length === 0 ? (
            <p className="px-3 py-3 text-xs text-subtle-foreground">{SEARCH_EMPTY}</p>
          ) : (
            <ul>
              {hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      setTerm("");
                      if (h.fixtureId && destinationFor(h) === "/matches/$fixtureId") {
                        void navigate({
                          to: "/matches/$fixtureId",
                          params: { fixtureId: h.fixtureId },
                        });
                      } else {
                        void navigate({ to: destinationFor(h) });
                      }
                    }}
                    className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-elevated focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <span className="truncate">{h.label}</span>
                    <span className="shrink-0 text-caption text-subtle-foreground">
                      {h.sublabel}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

/**
 * The newest payload the system has stored. Shell chrome, not page content:
 * it deliberately uses a plain query so it does not mark every page as live.
 */
function LastSync() {
  const q = useQuery(live.overview);
  const at = q.data?.data.freshness.last_payload_at ?? null;
  const worker = q.data?.data.worker.alive;
  const tone = q.isError
    ? "bg-negative"
    : worker === false
      ? "bg-negative"
      : at
        ? "bg-positive"
        : "bg-subtle-foreground";
  const label = q.isError
    ? "API unreachable"
    : at
      ? `Last payload ${timeOf(at)} UTC`
      : q.isLoading
        ? "Checking…"
        : "No payload yet";
  return (
    <span
      className="hidden items-center gap-1.5 text-caption text-muted-foreground lg:flex"
      title={worker === false ? "The worker is not running: no capture will happen." : undefined}
    >
      <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", tone)} />
      <span className="numeric">{label}</span>
      {worker === false ? <span className="text-negative">· worker down</span> : null}
    </span>
  );
}

function Topbar({
  onOpenMenu,
  onOpenPalette,
}: {
  onOpenMenu: () => void;
  onOpenPalette: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Open navigation"
        className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      <GlobalSearch onOpenPalette={onOpenPalette} />

      <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
        <PageDataModeBadge />
        <span className="hidden sm:inline-flex">
          <StatusBadge tone="warning">Research mode</StatusBadge>
        </span>
        {LIVE_ENABLED ? <LastSync /> : null}
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
        >
          <Search className="h-4 w-4" />
        </button>
        <Link
          to="/settings"
          aria-label="Settings"
          className="hidden rounded-md p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring sm:block"
        >
          <Settings2 className="h-4 w-4" />
        </Link>
        <button
          type="button"
          aria-label="Account"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-elevated text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <User className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  return (
    <DataSourcesProvider>
      <div className="min-h-screen bg-background">
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
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
          <Topbar onOpenMenu={() => setOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
          <main className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6">{children}</main>
        </div>
      </div>
    </DataSourcesProvider>
  );
}

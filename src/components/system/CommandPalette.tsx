import { useEffect, useMemo, useState } from "react";
import { useNavigate, type LinkProps } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { navGroups } from "@/components/layout/nav";
import { searchIndex } from "@/mock/research";
import type { SearchHit, SearchHitType } from "@/types/domain";

const typeLabel: Record<SearchHitType, string> = {
  fixture: "Fixtures",
  team: "Teams",
  competition: "Competitions",
  model: "Models",
};

/** Global entity + navigation search. Same index the topbar search uses. */
export function searchEntities(term: string, limit = 8): SearchHit[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return searchIndex
    .filter(
      (h) => h.label.toLowerCase().includes(q) || h.sublabel.toLowerCase().includes(q),
    )
    .slice(0, limit);
}

export function destinationFor(hit: SearchHit): LinkProps["to"] {
  if (hit.type === "model") return "/models";
  if (hit.type === "competition") return "/competitions";
  if (hit.fixtureId) return "/matches/$fixtureId";
  return "/matches";
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const hits = useMemo(() => searchEntities(term, 12), [term]);
  const grouped = useMemo(() => {
    const map = new Map<SearchHitType, SearchHit[]>();
    for (const h of hits) map.set(h.type, [...(map.get(h.type) ?? []), h]);
    return [...map.entries()];
  }, [hits]);

  function go(to: LinkProps["to"], fixtureId?: string | null) {
    onOpenChange(false);
    setTerm("");
    if (to === "/matches/$fixtureId" && fixtureId) {
      void navigate({ to, params: { fixtureId } });
    } else {
      void navigate({ to });
    }
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search fixtures, teams, competitions, models and modules"
    >
      <CommandInput
        placeholder="Search fixtures, teams, models or jump to a module…"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList>
        <CommandEmpty>No match in the indexed demo dataset.</CommandEmpty>
        {grouped.map(([type, list]) => (
          <CommandGroup key={type} heading={typeLabel[type]}>
            {list.map((h) => (
              <CommandItem
                key={h.id}
                value={`${h.label} ${h.sublabel}`}
                onSelect={() => go(destinationFor(h), h.fixtureId)}
              >
                <span className="truncate">{h.label}</span>
                <span className="ml-auto truncate text-caption text-subtle-foreground">
                  {h.sublabel}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {navGroups.map((group) => (
          <CommandGroup key={group.label} heading={`Go to · ${group.label}`}>
            {group.items.map((item) => (
              <CommandItem
                key={item.to}
                value={`${group.label} ${item.label}`}
                onSelect={() => go(item.to)}
              >
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

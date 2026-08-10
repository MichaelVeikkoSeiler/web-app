"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Loader2, Leaf, MapPinned } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { inputClasses } from "@/components/ui/field";
import { searchSiteContent, type SearchResult } from "@/lib/actions/search";

export function SiteSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const trimmed = query.trim();
      if (trimmed.length === 0) {
        setResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      const r = await searchSiteContent(query);
      setResults(r);
      setSearching(false);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Suchen"
        className="flex h-10 w-10 items-center justify-center rounded-full text-forest-muted hover:bg-sage/20 sm:h-9 sm:w-9"
      >
        <Search className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <Sheet open={open} onClose={close} title="Suchen">
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pflanzen, Zonen…"
            className={inputClasses}
          />

          {searching && (
            <div className="flex items-center gap-2 text-sm text-forest-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Suche…
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="flex flex-col gap-1">
              {results.map((r) => {
                const Icon = r.type === "plant" ? Leaf : MapPinned;
                const href = r.type === "plant" ? `/pflanzen/${r.id}` : `/zonen/${r.id}`;
                return (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={href}
                    onClick={close}
                    className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-cream"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cream text-forest-muted">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-forest">
                        {r.name}
                      </span>
                      {r.subtitle && (
                        <span className="block truncate text-xs italic text-forest-muted">
                          {r.subtitle}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {!searching && query.trim().length > 0 && results.length === 0 && (
            <p className="text-sm text-forest-muted">Keine Treffer.</p>
          )}
        </div>
      </Sheet>
    </>
  );
}

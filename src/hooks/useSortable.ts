import { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

export function useSortable<T>(data: T[], defaultKey?: keyof T) {
  const [sortKey, setSortKey] = useState<keyof T | null>(defaultKey ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : d === "desc" ? null : "asc"));
      if (sortDir === "desc") setSortKey(null);
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null || bv == null) return 0;
      const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  return { sorted, sortKey, sortDir, handleSort };
}

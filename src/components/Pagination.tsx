import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
          <ChevronLeft size={14} />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .reduce<(number | "...")[]>((acc, p, i, arr) => {
            if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
            acc.push(p);
            return acc;
          }, [])
          .map((p, i) =>
            p === "..." ? (
              <span key={`dots-${i}`} className="px-2 text-xs text-muted-foreground self-center">…</span>
            ) : (
              <Button
                key={p}
                variant={p === currentPage ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], perPage: number = 10) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  return {
    totalPages,
    perPage,
    paginate: (page: number) => items.slice((page - 1) * perPage, page * perPage),
  };
}

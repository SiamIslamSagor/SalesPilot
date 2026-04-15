import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentKey: string | null;
  direction: "asc" | "desc" | null;
  onClick: (key: string) => void;
  className?: string;
}

export function SortableHeader({ label, sortKey, currentKey, direction, onClick, className = "" }: SortableHeaderProps) {
  const isActive = currentKey === sortKey;
  return (
    <th
      className={`text-left px-4 py-3 font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors ${className}`}
      onClick={() => onClick(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && direction === "asc" ? (
          <ArrowUp size={14} />
        ) : isActive && direction === "desc" ? (
          <ArrowDown size={14} />
        ) : (
          <ArrowUpDown size={12} className="opacity-40" />
        )}
      </span>
    </th>
  );
}

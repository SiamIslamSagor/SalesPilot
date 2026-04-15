import { useState, useEffect, useRef } from "react";
import { Product, QuoteItem } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Search, Loader2 } from "lucide-react";
import apiService from "@/services/api";
import { useLanguage } from "@/i18n/LanguageContext";
import { formatEuro } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProductIds: string[];
  onAdd: (items: QuoteItem[]) => void;
}

export default function ProductPickerDialog({
  open,
  onOpenChange,
  existingProductIds,
  onAdd,
}: Props) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce search input
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [search]);

  // Fetch products from API when dialog opens or debounced search changes
  useEffect(() => {
    if (open) {
      const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await apiService.fetchProducts({
            limit: 50,
            search: debouncedSearch || undefined,
            status: "active",
          });
          if (result.success && result.data) {
            setProducts(result.data);
          } else {
            setError(result.message || "Failed to fetch products");
          }
        } catch (error) {
          setError("Failed to fetch products. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchProducts();
    }
  }, [open, debouncedSearch]);

  // Exclude products already in the offer (status=active is now filtered server-side)
  const filtered = products.filter(
    p => !existingProductIds.includes(p.id),
  );

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleAdd = () => {
    const items: QuoteItem[] = selected
      .map(id => products.find(p => p.id === id)!)
      .filter(Boolean)
      .map(product => ({
        id: `qi-${Date.now()}-${product.id}`,
        product,
        quantity: 100,
        unitPrice: product.salesPrice,
        discount: 0,
        markingCost: 0,
        showUnitPrice: true,
        showTotalPrice: true,
        hideMarkingCost: false,
        generateMockup: false,
      }));
    onAdd(items);
    setSelected([]);
    setSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Products</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-muted-foreground mr-2" />
            <span className="text-sm text-muted-foreground">
              {t("common.loadingProducts")}
            </span>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Product list */}
        {!loading && !error && (
          <div className="flex-1 overflow-auto space-y-1 min-h-0 max-h-[400px]">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No products found
              </p>
            ) : (
              filtered.map(p => (
                <label
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer border border-transparent has-[:checked]:border-primary/20 has-[:checked]:bg-primary/5"
                >
                  <Checkbox
                    checked={selected.includes(p.id)}
                    onCheckedChange={() => toggle(p.id)}
                  />
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {p.images && p.images.length > 0 ? (
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={16} className="text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.productNumber} · {p.category} · €
                      {formatEuro(p.salesPrice)}
                    </p>
                  </div>
                </label>
              ))
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={selected.length === 0} onClick={handleAdd}>
            Add {selected.length > 0 ? `(${selected.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

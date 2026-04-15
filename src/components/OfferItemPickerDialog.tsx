import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Package, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { type PrintingSheet } from "@/services/api";
import { formatEuro } from "@/lib/utils";

interface ProductVariant {
  id?: string;
  size?: string;
  color?: string;
  colorCode?: string;
  sku?: string;
  price?: number;
}

interface Product {
  _id?: string;
  id: string;
  productNumber: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  gender: string;
  fabrics: string;
  purchasePrice: number;
  salesPrice: number;
  margin: number;
  status: "active" | "inactive";
  images: string[];
  imageUrl?: string;
  variants?: ProductVariant[];
}

interface OfferItem {
  productId: string;
  productNumber: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  markingCost: number;
  showUnitPrice: boolean;
  showTotalPrice: boolean;
  hideMarkingCost: boolean;
  generateMockup: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: OfferItem[];
  products: Record<string, Product>;
  onCreate: (selectedItems: OfferItem[]) => void;
  existingPrintingSheets?: PrintingSheet[];
}

export default function OfferItemPickerDialog({
  open,
  onOpenChange,
  items,
  products,
  onCreate,
  existingPrintingSheets = [],
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  // Create a Set of product IDs that already have printing sheets
  const productsWithExistingSheets = useMemo(() => {
    const set = new Set<string>();
    existingPrintingSheets.forEach(sheet => {
      if (sheet.productId) {
        set.add(sheet.productId);
      }
    });
    return set;
  }, [existingPrintingSheets]);

  const toggle = (productId: string) => {
    // Prevent selecting products that already have printing sheets
    if (productsWithExistingSheets.has(productId)) {
      return;
    }
    setSelected(prev =>
      prev.includes(productId)
        ? prev.filter(x => x !== productId)
        : [...prev, productId],
    );
  };

  const handleCreate = () => {
    const selectedItems = items.filter(item =>
      selected.includes(item.productId),
    );
    onCreate(selectedItems);
    setSelected([]);
    onOpenChange(false);
  };
  console.log("items:", items);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Products for Info Sheet</DialogTitle>
        </DialogHeader>

        {/* Product list */}
        <div className="flex-1 overflow-auto space-y-2 min-h-0 max-h-[400px]">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No products found
            </p>
          ) : (
            items.map(item => {
              const product = products[item.productNumber];
              const productImage = product?.images?.[0] || product?.imageUrl;
              const hasExistingSheet = productsWithExistingSheets.has(
                item.productId,
              );
              const isDisabled = hasExistingSheet;

              return (
                <label
                  key={item.productId}
                  className={`flex items-center gap-3 p-3 rounded-md border border-transparent ${
                    isDisabled
                      ? "opacity-50 cursor-not-allowed bg-muted/30"
                      : "hover:bg-muted/50 cursor-pointer has-[:checked]:border-primary/20 has-[:checked]:bg-primary/5"
                  }`}
                >
                  <Checkbox
                    checked={selected.includes(item.productId)}
                    onCheckedChange={() => toggle(item.productId)}
                    disabled={isDisabled}
                  />
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon
                        size={20}
                        className="text-muted-foreground/30"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.productNumber} · Qty: {item.quantity} · €
                      {formatEuro(item.unitPrice)}
                    </p>
                    {hasExistingSheet && (
                      <Badge
                        variant="secondary"
                        className="mt-1.5 text-xs flex items-center gap-1"
                      >
                        <CheckCircle2 size={10} />
                        Already has printing sheet
                      </Badge>
                    )}
                  </div>
                </label>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={selected.length === 0} onClick={handleCreate}>
            Create Info Sheet
            {selected.length > 0 ? ` (${selected.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
